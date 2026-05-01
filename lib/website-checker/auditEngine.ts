/**
 * Unified Website Audit Engine - PRODUCTION STABLE
 * SINGLE SOURCE OF TRUTH for all PageSpeed Insights audits
 * 
 * PRINCIPLES:
 * - ONLY uses Google PageSpeed Insights API
 * - NEVER generates fake/simulated data
 * - NEVER throws - always returns safe results
 * - ALWAYS returns complete AuditResponse (never undefined fields)
 * - TIMEOUT handling with graceful degradation (25s mobile, 30s desktop)
 * - SEQUENTIAL execution: mobile first, then desktop
 * - RETRY logic: 1 retry max on failure
 * - PARTIAL results: return whatever succeeds
 */

import {
  AuditResponse,
  AuditScores,
  DeviceAudit,
  ScoreDetail,
  CoreWebVitals,
  MetricDetail,
  LighthouseScoreKey,
  LighthouseScoreLabel,
  AuditError,
  EMPTY_AUDIT_RESPONSE,
  ERROR_MESSAGES,
} from "./types";
import { auditLogger } from "@/lib/logger";

// Configuration
const PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const MOBILE_TIMEOUT_MS = 25000; // 25s for mobile
const DESKTOP_TIMEOUT_MS = 30000; // 30s for desktop

// Result type for safe returns (never throws)
interface FetchResult {
  success: boolean;
  data: unknown | null;
  error: string | null;
}

/**
 * Main entry point: Run complete audit for a URL
 * PRODUCTION-STABLE: Never throws, always returns AuditResponse
 */
export async function runWebsiteAudit(url: string): Promise<AuditResponse> {
  const scannedAt = new Date().toISOString();

  try {
    // Validate URL
    if (!isValidUrl(url)) {
      return createErrorResponse(
        "Invalid URL provided",
        "validation_error",
        scannedAt
      );
    }

    // Check API key configuration
    const apiKey = process.env.PAGESPEED_API_KEY;
    
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      console.error("[AuditEngine] Missing PAGESPEED_API_KEY");
      auditLogger.configMissing("AuditEngine");
      return createErrorResponse(
        ERROR_MESSAGES.config_error,
        "config_error",
        scannedAt
      );
    }

    const normalizedUrl = normalizeUrl(url);

    // SEQUENTIAL execution: mobile FIRST, then desktop
    // Each runs independently - failure of one doesn't affect the other
    let mobile: DeviceAudit | null = null;
    let desktop: DeviceAudit | null = null;
    let mobileError: string | null = null;
    let desktopError: string | null = null;

    // Run mobile FIRST with timeout protection
    console.log("[AuditEngine] Starting mobile audit...");
    const mobileResult = await fetchPageSpeedDataSafe(normalizedUrl, "mobile", apiKey.trim(), MOBILE_TIMEOUT_MS);
    
    if (mobileResult.success && mobileResult.data) {
      mobile = processPageSpeedData(mobileResult.data);
      console.log(`[AuditEngine] Mobile audit success: ${mobile ? "valid data" : "no data"}`);
    } else {
      mobileError = mobileResult.error || "Mobile audit failed";
      console.error("[AuditEngine] Mobile scan FAILED:", mobileError);
      auditLogger.scanFailed("AuditEngine", url, mobileError);
    }

    // Then run desktop AFTER mobile completes (completely independent)
    console.log("[AuditEngine] Starting desktop audit...");
    const desktopResult = await fetchPageSpeedDataSafe(normalizedUrl, "desktop", apiKey.trim(), DESKTOP_TIMEOUT_MS);
    
    if (desktopResult.success && desktopResult.data) {
      desktop = processPageSpeedData(desktopResult.data);
      console.log(`[AuditEngine] Desktop audit success: ${desktop ? "valid data" : "no data"}`);
    } else {
      desktopError = desktopResult.error || "Desktop audit failed";
      console.error("[AuditEngine] Desktop scan FAILED:", desktopError);
      auditLogger.scanFailed("AuditEngine", url, desktopError);
    }

    // Check if at least one succeeded
    const hasMobile = mobile !== null;
    const hasDesktop = desktop !== null;
    const hasValidData = hasMobile || hasDesktop;

    // ALWAYS return success if we have ANY data (partial is better than nothing)
    if (hasValidData) {
      return {
        success: true,
        source: "pagespeed_insights",
        desktop,
        mobile,
        error: combinedErrors(mobileError, desktopError),
        errorType: (!hasMobile || !hasDesktop) ? "scan_error" : null,
        scannedAt,
      };
    }

    // Only return failure if BOTH failed
    console.error("[AuditEngine] NO VALID DATA from either desktop or mobile scan");
    const combinedError = [mobileError, desktopError].filter(Boolean).join(" | ");
    return createErrorResponse(
      combinedError || ERROR_MESSAGES.scan_error,
      "scan_error",
      scannedAt
    );
  } catch (error) {
    // Ultimate safety net - should never reach here but just in case
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    auditLogger.crash("AuditEngine", error);
    return createErrorResponse(
      errorMsg || ERROR_MESSAGES.unknown,
      "unknown",
      scannedAt
    );
  }
}

/**
 * Combine error messages from both audits
 */
function combinedErrors(mobileError: string | null, desktopError: string | null): string | null {
  if (!mobileError && !desktopError) return null;
  const errors: string[] = [];
  if (mobileError) errors.push(`Mobile: ${mobileError}`);
  if (desktopError) errors.push(`Desktop: ${desktopError}`);
  return errors.join(" | ");
}

/**
 * Fetch PageSpeed data from Google API - SAFE VERSION
 * NEVER THROWS - always returns FetchResult
 * Handles timeouts, retries, and all errors gracefully
 */
async function fetchPageSpeedDataSafe(
  url: string,
  strategy: "mobile" | "desktop",
  apiKey: string,
  timeoutMs: number,
  attempt: number = 0
): Promise<FetchResult> {
  const MAX_RETRIES = 1;
  
  console.log(`[AuditEngine] ${strategy} request (attempt ${attempt + 1}) for: ${url}`);
  
  const apiUrl = new URL(PAGESPEED_API_URL);
  apiUrl.searchParams.append("key", apiKey);
  apiUrl.searchParams.append("url", url);
  apiUrl.searchParams.append("strategy", strategy);
  apiUrl.searchParams.append("category", "performance");
  apiUrl.searchParams.append("category", "seo");
  apiUrl.searchParams.append("category", "accessibility");
  apiUrl.searchParams.append("category", "best-practices");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl.toString(), {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Handle HTTP errors safely
    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {
        // Ignore text parsing errors
      }
      
      const errorMsg = `PageSpeed API error: ${response.status}${errorBody ? " - " + errorBody.substring(0, 200) : ""}`;
      console.error(`[AuditEngine] ${strategy} HTTP ${response.status} error`);
      
      // Retry on server errors (5xx)
      if (attempt < MAX_RETRIES && response.status >= 500) {
        console.log(`[AuditEngine] ${strategy} will retry after server error...`);
        return fetchPageSpeedDataSafe(url, strategy, apiKey, timeoutMs, attempt + 1);
      }
      
      return { success: false, data: null, error: errorMsg };
    }

    // Safe JSON parsing
    let data: unknown;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error(`[AuditEngine] ${strategy} JSON parse error:`, jsonError);
      return { success: false, data: null, error: "Invalid JSON response from API" };
    }

    // Validate response structure
    if (!isValidPageSpeedResponse(data)) {
      if (attempt < MAX_RETRIES) {
        console.log(`[AuditEngine] ${strategy} will retry after missing lighthouse data...`);
        return fetchPageSpeedDataSafe(url, strategy, apiKey, timeoutMs, attempt + 1);
      }
      return { success: false, data: null, error: "Invalid PageSpeed API response structure" };
    }

    console.log(`[AuditEngine] ${strategy} success`);
    return { success: true, data: (data as Record<string, unknown>).lighthouseResult, error: null };

  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = error instanceof Error && error.name === "AbortError";
    
    console.error(`[AuditEngine] ${strategy} ${isTimeout ? "timeout" : "error"}:`, errorMessage);
    
    // Retry on timeout or network errors
    if (attempt < MAX_RETRIES) {
      console.log(`[AuditEngine] ${strategy} will retry after ${isTimeout ? "timeout" : "error"}...`);
      return fetchPageSpeedDataSafe(url, strategy, apiKey, timeoutMs, attempt + 1);
    }
    
    return { 
      success: false, 
      data: null, 
      error: isTimeout ? `Timeout after ${timeoutMs}ms` : errorMessage 
    };
  }
}

/**
 * Process raw PageSpeed data into DeviceAudit
 */
function processPageSpeedData(rawLhr: unknown): DeviceAudit | null {
  if (!rawLhr || typeof rawLhr !== "object") {
    return null;
  }

  const lhr = rawLhr as Record<string, unknown>;
  const categories = lhr.categories as Record<string, { score?: number }> | undefined;
  const audits = lhr.audits as Record<string, { numericValue?: number; displayValue?: string; score?: number }> | undefined;

  if (!categories || !audits) {
    return null;
  }

  // Extract scores (Google returns 0-1, convert to 0-100)
  const scores: AuditScores = {
    performance: createScoreDetail(
      Math.round((categories.performance?.score ?? 0) * 100),
      "performance"
    ),
    seo: createScoreDetail(
      Math.round((categories.seo?.score ?? 0) * 100),
      "seo"
    ),
    accessibility: createScoreDetail(
      Math.round((categories.accessibility?.score ?? 0) * 100),
      "accessibility"
    ),
    "best-practices": createScoreDetail(
      Math.round((categories["best-practices"]?.score ?? 0) * 100),
      "best-practices"
    ),
  };

  // Extract Core Web Vitals
  const metrics: CoreWebVitals = {
    lcp: extractMetric(audits["largest-contentful-paint"]),
    cls: extractMetric(audits["cumulative-layout-shift"]),
    tbt: extractMetric(audits["total-blocking-time"]),
    fcp: extractMetric(audits["first-contentful-paint"]),
    tti: extractMetric(audits["interactive"]),
  };

  return {
    scores,
    metrics,
    rawLhr,
  };
}

/**
 * Create ScoreDetail with label, color, and explanation
 */
function createScoreDetail(score: number, category: LighthouseScoreKey): ScoreDetail {
  const label = getScoreLabel(score);
  const color = getScoreColor(score);
  const explanation = getScoreExplanation(category, score, label);

  return {
    score,
    label,
    color,
    explanation,
  };
}

/**
 * Extract metric from PageSpeed audit
 */
function extractMetric(
  audit: { numericValue?: number; displayValue?: string; score?: number } | undefined
): MetricDetail | null {
  if (!audit || typeof audit.numericValue !== "number") {
    return null;
  }

  const value = audit.numericValue;
  const formatted = audit.displayValue ?? value.toFixed(2);
  const severity = getMetricSeverity(audit.score ?? 0);

  return {
    value,
    formatted,
    severity,
  };
}

/**
 * Get severity from metric score
 */
function getMetricSeverity(score: number): "good" | "needs-improvement" | "poor" {
  if (score >= 0.9) return "good";
  if (score >= 0.5) return "needs-improvement";
  return "poor";
}

/**
 * Get score label
 */
function getScoreLabel(score: number): LighthouseScoreLabel {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}

/**
 * Get score color
 */
function getScoreColor(score: number): "green" | "yellow" | "red" {
  if (score >= 90) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

/**
 * Get score explanation based on category and score
 */
function getScoreExplanation(
  category: LighthouseScoreKey,
  score: number,
  label: LighthouseScoreLabel
): string {
  const explanations: Record<
    LighthouseScoreKey,
    Record<LighthouseScoreLabel, string>
  > = {
    performance: {
      Excellent: "Fast loading and responsive interactions",
      Good: "Good performance with minor optimizations possible",
      "Needs Improvement": "Slow loading may impact user experience",
      Poor: "Significant performance issues affecting conversions",
    },
    seo: {
      Excellent: "Well-optimized for search visibility",
      Good: "Solid SEO foundation with room for improvement",
      "Needs Improvement": "SEO gaps may limit organic reach",
      Poor: "Critical SEO issues affecting discoverability",
    },
    accessibility: {
      Excellent: "Highly accessible to all users",
      Good: "Good accessibility with minor improvements needed",
      "Needs Improvement": "Accessibility barriers may exclude users",
      Poor: "Significant barriers for users with disabilities",
    },
    "best-practices": {
      Excellent: "Follows modern web standards",
      Good: "Good practices with minor issues",
      "Needs Improvement": "Outdated practices may cause issues",
      Poor: "Critical issues with web standards",
    },
  };

  return explanations[category][label];
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const normalized = normalizeUrl(url);
    const u = new URL(normalized);
    return Boolean(u.hostname) && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Normalize URL (add https if missing)
 */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

/**
 * Validate PageSpeed API response structure
 */
function isValidPageSpeedResponse(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.lighthouseResult === "object" &&
    d.lighthouseResult !== null
  );
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  message: string,
  errorType: import("./types").AuditErrorType,
  scannedAt: string
): AuditResponse {
  return {
    success: false,
    source: null,
    desktop: null,
    mobile: null,
    error: message,
    errorType,
    scannedAt,
  };
}

/**
 * Get worst performing category
 * Safe: returns null if no valid data
 */
export function getWorstCategory(scores: AuditScores | null | undefined): LighthouseScoreKey | null {
  if (!scores) return null;

  const entries = Object.entries(scores) as [LighthouseScoreKey, ScoreDetail][];
  if (entries.length === 0) return null;

  return entries.reduce((worst, [key, detail]) =>
    detail.score < scores[worst].score ? key : worst,
    entries[0][0]
  );
}

/**
 * Get overall grade from all scores
 * Safe: returns "Poor" if no valid data
 */
export function getOverallGrade(scores: AuditScores | null | undefined): LighthouseScoreLabel {
  if (!scores) return "Poor";

  const values = Object.values(scores);
  if (values.length === 0) return "Poor";

  const avg = values.reduce((sum, s) => sum + s.score, 0) / values.length;
  return getScoreLabel(avg);
}

/**
 * Get safe default scores for empty state
 * NEVER returns undefined
 */
export function getDefaultScores(): AuditScores {
  const createEmpty = (category: LighthouseScoreKey): ScoreDetail => ({
    score: 0,
    label: "Poor",
    color: "red",
    explanation: "No data available",
  });

  return {
    performance: createEmpty("performance"),
    seo: createEmpty("seo"),
    accessibility: createEmpty("accessibility"),
    "best-practices": createEmpty("best-practices"),
  };
}
