/**
 * Unified Website Audit Engine
 * SINGLE SOURCE OF TRUTH for all PageSpeed Insights audits
 * 
 * RULES:
 * - ONLY uses Google PageSpeed Insights API
 * - NEVER generates fake/simulated data
 * - STRICT error classification
 * - ALWAYS returns complete AuditResponse (never undefined fields)
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

/**
 * Main entry point: Run complete audit for a URL
 * Returns unified AuditResponse with strict data contract
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
    // Try multiple common env variable names (Vercel, Netlify, etc. use different conventions)
    const possibleKeyNames = [
      "PAGESPEED_API_KEY",
      "NEXT_PUBLIC_PAGESPEED_API_KEY",  // Some platforms require this prefix
      "pagespeed_api_key",
      "GOOGLE_PAGESPEED_API_KEY",
      "PAGESPEED_KEY",
    ];
    
    let apiKey: string | undefined;
    let foundKeyName: string | undefined;
    
    for (const keyName of possibleKeyNames) {
      const value = process.env[keyName];
      if (value && value.trim() && !value.includes("your_")) {
        apiKey = value.trim();
        foundKeyName = keyName;
        break;
      }
    }
    
    // Production debugging: log what's available (safe - only logs presence, not value)
    console.log(`[AuditEngine] Found API key in: ${foundKeyName || "NONE"}`);
    console.log(`[AuditEngine] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[AuditEngine] Checked env vars: ${possibleKeyNames.map(k => `${k}=${process.env[k] ? "✓" : "✗"}`).join(", ")}`);
    
    if (!apiKey) {
      auditLogger.configMissing("AuditEngine");
      return createErrorResponse(
        ERROR_MESSAGES.config_error,
        "config_error",
        scannedAt
      );
    }

    const normalizedUrl = normalizeUrl(url);

    // Run both mobile and desktop audits in parallel
    const [mobileResult, desktopResult] = await Promise.allSettled([
      fetchPageSpeedData(normalizedUrl, "mobile", apiKey),
      fetchPageSpeedData(normalizedUrl, "desktop", apiKey),
    ]);

    // Process results
    let desktop: DeviceAudit | null = null;
    let mobile: DeviceAudit | null = null;
    let hasValidData = false;

    if (desktopResult.status === "fulfilled" && desktopResult.value) {
      desktop = processPageSpeedData(desktopResult.value);
      if (desktop) hasValidData = true;
    } else if (desktopResult.status === "rejected") {
      const reason = desktopResult.reason;
      console.error("[AuditEngine] Desktop scan FAILED:", reason instanceof Error ? reason.message : reason);
      auditLogger.scanFailed("AuditEngine", url, reason);
    }

    if (mobileResult.status === "fulfilled" && mobileResult.value) {
      mobile = processPageSpeedData(mobileResult.value);
      if (mobile) hasValidData = true;
    } else if (mobileResult.status === "rejected") {
      const reason = mobileResult.reason;
      console.error("[AuditEngine] Mobile scan FAILED:", reason instanceof Error ? reason.message : reason);
      auditLogger.scanFailed("AuditEngine", url, reason);
    }

    // STRICT: Must have at least one valid result
    if (!hasValidData) {
      console.error("[AuditEngine] NO VALID DATA from either desktop or mobile scan");
      return createErrorResponse(
        ERROR_MESSAGES.scan_error,
        "scan_error",
        scannedAt
      );
    }

    return {
      success: true,
      source: "pagespeed_insights",
      desktop,
      mobile,
      error: null,
      errorType: null,
      scannedAt,
    };
  } catch (error) {
    auditLogger.crash("AuditEngine", error);
    return createErrorResponse(
      ERROR_MESSAGES.unknown,
      "unknown",
      scannedAt
    );
  }
}

/**
 * Fetch PageSpeed data from Google API
 */
async function fetchPageSpeedData(
  url: string,
  strategy: "mobile" | "desktop",
  apiKey: string
): Promise<unknown> {
  const apiUrl = new URL(PAGESPEED_API_URL);
  apiUrl.searchParams.append("key", apiKey);
  apiUrl.searchParams.append("url", url);
  apiUrl.searchParams.append("strategy", strategy);
  apiUrl.searchParams.append("category", "performance");
  apiUrl.searchParams.append("category", "seo");
  apiUrl.searchParams.append("category", "accessibility");
  apiUrl.searchParams.append("category", "best-practices");

  const response = await fetch(apiUrl.toString());

  if (!response.ok) {
    let errorBody = "No error body";
    try {
      const errorData = await response.json();
      errorBody = JSON.stringify(errorData);
      console.error("[AuditEngine] Google API ERROR:", { status: response.status, error: errorBody, url, strategy });
      auditLogger.scanFailed("AuditEngine", url, { status: response.status, error: errorBody });
    } catch {
      errorBody = await response.text();
      console.error("[AuditEngine] Google API ERROR (text):", { status: response.status, error: errorBody, url, strategy });
      auditLogger.scanFailed("AuditEngine", url, { status: response.status, error: errorBody });
    }
    throw new Error(`PageSpeed API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();

  if (!isValidPageSpeedResponse(data)) {
    throw new Error("Invalid PageSpeed API response structure");
  }

  return data.lighthouseResult;
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
