import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for long-running scans

const PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const MOBILE_TIMEOUT_MS = 25000; // 25s timeout for mobile
const DESKTOP_TIMEOUT_MS = 30000; // 30s timeout for desktop

/**
 * POST handler for /api/lighthouse/audit
 * PRODUCTION-STABLE VERSION
 * 
 * PRINCIPLES:
 * - NEVER fail the full analysis - always return partial results if possible
 * - Each request fails independently (mobile vs desktop)
 * - Safe JSON parsing with validation
 * - Timeout resilience with graceful degradation
 * - Standard response format always returned
 */

// Standard response format
interface AuditResponse {
  success: boolean;
  status: "complete" | "partial_failure" | "failed";
  mobile: AuditData | null;
  desktop: AuditData | null;
  errors: {
    mobile?: string;
    desktop?: string;
  };
}

interface AuditData {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  lhr: unknown;
}

interface DeviceResult {
  success: boolean;
  data: AuditData | null;
  error: string | null;
}

export async function POST(req: Request): Promise<Response> {
  const scanStartTime = Date.now();
  console.log(`[Audit] ========== SCAN START at ${new Date().toISOString()} ==========`);

  // === STEP 1: API KEY VALIDATION ===
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
    console.error("[Audit] Missing API key");
    return NextResponse.json({
      success: false,
      status: "failed",
      mobile: null,
      desktop: null,
      errors: { mobile: "Server configuration error", desktop: "Server configuration error" },
    } as AuditResponse, { status: 500 });
  }

  const trimmedKey = apiKey.trim();

  // === STEP 2: PARSE AND VALIDATE URL ===
  let targetUrl: string | undefined;
  try {
    const body = await req.json();
    targetUrl = typeof body?.url === "string" ? body.url.trim() : undefined;
  } catch {
    return NextResponse.json({
      success: false,
      status: "failed",
      mobile: null,
      desktop: null,
      errors: { mobile: "Invalid JSON body", desktop: "Invalid JSON body" },
    } as AuditResponse, { status: 400 });
  }

  if (!targetUrl) {
    return NextResponse.json({
      success: false,
      status: "failed",
      mobile: null,
      desktop: null,
      errors: { mobile: "Missing URL parameter", desktop: "Missing URL parameter" },
    } as AuditResponse, { status: 400 });
  }

  // Check for invalid URL values
  const invalidUrlValues = ["idle", "running", "scanning", "completed", "error", "undefined", "null", ""];
  if (invalidUrlValues.includes(targetUrl.toLowerCase().trim())) {
    return NextResponse.json({
      success: false,
      status: "failed",
      mobile: null,
      desktop: null,
      errors: { mobile: "Invalid URL", desktop: "Invalid URL" },
    } as AuditResponse, { status: 400 });
  }

  // Validate and normalize URL
  let validatedUrl: string;
  try {
    let urlToValidate = targetUrl.trim();
    if (!urlToValidate.startsWith("http://") && !urlToValidate.startsWith("https://")) {
      urlToValidate = "https://" + urlToValidate;
    }
    const urlObj = new URL(urlToValidate);
    if (!urlObj.hostname || !urlObj.hostname.includes(".")) {
      throw new Error("Invalid hostname");
    }
    validatedUrl = urlObj.toString();
  } catch {
    return NextResponse.json({
      success: false,
      status: "failed",
      mobile: null,
      desktop: null,
      errors: { mobile: "Invalid URL format", desktop: "Invalid URL format" },
    } as AuditResponse, { status: 400 });
  }

  // === STEP 3: HELPER FUNCTIONS ===

  const buildApiUrl = (strategy: "mobile" | "desktop") => {
    const encodedUrl = encodeURIComponent(validatedUrl);
    return `${PAGESPEED_API_URL}?url=${encodedUrl}&key=${trimmedKey}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`;
  };

  const extractScores = (lighthouse: Record<string, unknown>): AuditData => {
    const scores = (lighthouse?.categories as Record<string, { score?: number }>) || {};
    return {
      performance: Math.round((scores.performance?.score ?? 0) * 100),
      seo: Math.round((scores.seo?.score ?? 0) * 100),
      accessibility: Math.round((scores.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((scores["best-practices"]?.score ?? 0) * 100),
      lhr: lighthouse,
    };
  };

  // Safe fetch with timeout and retry - NEVER throws
  const fetchAuditSafely = async (
    url: string,
    strategy: "mobile" | "desktop",
    timeoutMs: number,
    attempt: number = 0
  ): Promise<DeviceResult> => {
    const MAX_RETRIES = 1;
    const logUrl = url.replace(/key=[^&]+/, "key=***MASKED***");
    console.log(`[Audit] ${strategy} request (attempt ${attempt + 1}): ${logUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Handle non-OK responses safely
      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          // Ignore text parsing errors
        }
        
        const errorMsg = `${strategy}: HTTP ${response.status}${errorBody ? " - " + errorBody.substring(0, 200) : ""}`;
        console.error(`[Audit] ${errorMsg}`);
        
        // Retry on server errors (5xx)
        if (attempt < MAX_RETRIES && response.status >= 500) {
          console.log(`[Audit] ${strategy} retrying after server error...`);
          return fetchAuditSafely(url, strategy, timeoutMs, attempt + 1);
        }
        
        return { success: false, data: null, error: errorMsg };
      }

      // Safe JSON parsing
      let data: Record<string, unknown>;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(`[Audit] ${strategy} JSON parse error:`, jsonError);
        return { success: false, data: null, error: `${strategy}: Invalid JSON response` };
      }

      // Validate lighthouse result
      const lighthouse = data?.lighthouseResult as Record<string, unknown> | undefined;
      if (!lighthouse) {
        console.error(`[Audit] ${strategy}: No lighthouseResult in response`);
        if (attempt < MAX_RETRIES) {
          console.log(`[Audit] ${strategy} retrying after missing lighthouse data...`);
          return fetchAuditSafely(url, strategy, timeoutMs, attempt + 1);
        }
        return { success: false, data: null, error: `${strategy}: Missing lighthouse data` };
      }

      const scores = extractScores(lighthouse);
      console.log(`[Audit] ${strategy} success - performance: ${scores.performance}`);
      return { success: true, data: scores, error: null };

    } catch (err) {
      clearTimeout(timeoutId);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const isTimeout = err instanceof Error && err.name === "AbortError";
      
      console.error(`[Audit] ${strategy} ${isTimeout ? "timeout" : "error"}:`, errorMessage);
      
      // Retry on timeout or network errors
      if (attempt < MAX_RETRIES) {
        console.log(`[Audit] ${strategy} retrying after ${isTimeout ? "timeout" : "error"}...`);
        return fetchAuditSafely(url, strategy, timeoutMs, attempt + 1);
      }
      
      return { 
        success: false, 
        data: null, 
        error: isTimeout ? `${strategy}: Timeout after ${timeoutMs}ms` : `${strategy}: ${errorMessage}` 
      };
    }
  };

  // === STEP 4: SEQUENTIAL EXECUTION WITH INDEPENDENT FAILURE HANDLING ===
  
  // Mobile first - with separate error tracking
  const mobileStartTime = Date.now();
  console.log(`[Audit] MOBILE START at ${new Date().toISOString()}`);
  const mobileResult = await fetchAuditSafely(buildApiUrl("mobile"), "mobile", MOBILE_TIMEOUT_MS);
  const mobileDuration = ((Date.now() - mobileStartTime) / 1000).toFixed(1);
  console.log(`[Audit] MOBILE END - Duration: ${mobileDuration}s - Success: ${mobileResult.success}`);

  // Desktop second - completely independent
  const desktopStartTime = Date.now();
  console.log(`[Audit] DESKTOP START at ${new Date().toISOString()}`);
  const desktopResult = await fetchAuditSafely(buildApiUrl("desktop"), "desktop", DESKTOP_TIMEOUT_MS);
  const desktopDuration = ((Date.now() - desktopStartTime) / 1000).toFixed(1);
  console.log(`[Audit] DESKTOP END - Duration: ${desktopDuration}s - Success: ${desktopResult.success}`);

  const totalDuration = ((Date.now() - scanStartTime) / 1000).toFixed(1);

  // === STEP 5: BUILD RESPONSE - NEVER FAIL ===
  const hasMobile = mobileResult.success;
  const hasDesktop = desktopResult.success;
  const hasAnyData = hasMobile || hasDesktop;

  let response: AuditResponse;

  if (hasMobile && hasDesktop) {
    // Complete success
    response = {
      success: true,
      status: "complete",
      mobile: mobileResult.data,
      desktop: desktopResult.data,
      errors: {},
    };
    console.log(`[Audit] ========== SCAN COMPLETE (${totalDuration}s) - Both audits successful ==========`);
  } else if (hasAnyData) {
    // Partial failure - still return usable data
    response = {
      success: true,
      status: "partial_failure",
      mobile: mobileResult.data,
      desktop: desktopResult.data,
      errors: {
        ...(mobileResult.error && { mobile: mobileResult.error }),
        ...(desktopResult.error && { desktop: desktopResult.error }),
      },
    };
    console.log(`[Audit] ========== SCAN PARTIAL (${totalDuration}s) - Mobile: ${hasMobile}, Desktop: ${hasDesktop} ==========`);
  } else {
    // Both failed - return structured failure, not crash
    response = {
      success: false,
      status: "failed",
      mobile: null,
      desktop: null,
      errors: {
        mobile: mobileResult.error || "Mobile audit failed",
        desktop: desktopResult.error || "Desktop audit failed",
      },
    };
    console.log(`[Audit] ========== SCAN FAILED (${totalDuration}s) - Both audits failed ==========`);
  }

  // Always return 200 with structured response (never crash the frontend)
  return NextResponse.json(response, { status: 200 });
}

