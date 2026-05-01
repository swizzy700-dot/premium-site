import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for long-running scans

const PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/**
 * POST handler for /api/lighthouse/audit
 * Uses ONLY PAGESPEED_API_KEY from Vercel environment variables.
 * NO fallbacks. NO other tokens. Server-side only.
 *
 * ARCHITECTURE:
 * - NO manual timeouts - let PageSpeed API complete naturally
 * - SEQUENTIAL execution: mobile first, then desktop
 * - Retry logic: 1 retry max per request on failure
 * - Partial results: return whatever succeeds (mobile OR desktop)
 * - Always returns consistent JSON format
 * - Supports long-running scans (60s max)
 */

interface AuditResult {
  success: boolean;
  data?: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    lhr: unknown;
  };
  error?: string;
}

export async function POST(req: Request): Promise<Response> {
  // === STEP 1: STRICT API KEY VALIDATION (FIRST) ===
  const apiKey = process.env.PAGESPEED_API_KEY;

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
    return NextResponse.json(
      {
        success: false,
        mobile: null,
        desktop: null,
        error: "Server configuration error: Missing PageSpeed API key",
        partial: false,
      },
      { status: 500 }
    );
  }

  const trimmedKey = apiKey.trim();

  // === STEP 2: PARSE REQUEST BODY ===
  let targetUrl: string | undefined;

  try {
    const body = await req.json();
    targetUrl = typeof body?.url === "string" ? body.url.trim() : undefined;
  } catch {
    return NextResponse.json(
      {
        success: false,
        mobile: null,
        desktop: null,
        error: "Invalid JSON body",
        partial: false,
      },
      { status: 400 }
    );
  }

  // === STEP 3: VALIDATE URL ===
  if (!targetUrl) {
    return NextResponse.json(
      {
        success: false,
        mobile: null,
        desktop: null,
        error: "Missing URL parameter",
        partial: false,
      },
      { status: 400 }
    );
  }

  // Check for state strings being passed as URLs (common bug)
  const invalidUrlValues = [
    "idle",
    "running",
    "scanning",
    "completed",
    "error",
    "undefined",
    "null",
    "",
  ];
  if (invalidUrlValues.includes(targetUrl.toLowerCase().trim())) {
    return NextResponse.json(
      {
        success: false,
        mobile: null,
        desktop: null,
        error: "Invalid URL",
        partial: false,
      },
      { status: 400 }
    );
  }

  // Validate and normalize URL format
  let validatedUrl: string;
  try {
    let urlToValidate = targetUrl.trim();
    if (
      !urlToValidate.startsWith("http://") &&
      !urlToValidate.startsWith("https://")
    ) {
      urlToValidate = "https://" + urlToValidate;
    }

    const urlObj = new URL(urlToValidate);
    if (!urlObj.hostname || !urlObj.hostname.includes(".")) {
      throw new Error("Invalid hostname");
    }
    validatedUrl = urlObj.toString();
  } catch {
    return NextResponse.json(
      {
        success: false,
        mobile: null,
        desktop: null,
        error: "Invalid URL format",
        partial: false,
      },
      { status: 400 }
    );
  }

  // === STEP 4: HELPER FUNCTIONS ===

  // Helper to build PageSpeed API URL
  const buildApiUrl = (strategy: "mobile" | "desktop") => {
    const encodedUrl = encodeURIComponent(validatedUrl);
    return `${PAGESPEED_API_URL}?url=${encodedUrl}&key=${trimmedKey}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`;
  };

  // Helper to extract scores from Lighthouse result
  const extractScores = (lighthouse: Record<string, unknown>) => {
    const scores = (lighthouse?.categories as Record<string, { score?: number }>) || {};
    return {
      performance: Math.round((scores.performance?.score ?? 0) * 100),
      seo: Math.round((scores.seo?.score ?? 0) * 100),
      accessibility: Math.round((scores.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((scores["best-practices"]?.score ?? 0) * 100),
    };
  };

  // Fetch with retry logic - NO TIMEOUT, let API complete naturally
  const fetchAuditWithRetry = async (
    url: string,
    strategy: "mobile" | "desktop",
    attempt: number = 0
  ): Promise<AuditResult> => {
    const MAX_RETRIES = 1;

    // Log the request URL for debugging (mask API key)
    const logUrl = url.replace(/key=[^&]+/, "key=***MASKED***");
    console.log(`[Audit] ${strategy} request (attempt ${attempt + 1}): ${logUrl}`);

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        // Capture error response body for debugging
        let errorBody = "";
        try {
          errorBody = await response.text();
          console.error(`[Audit] ${strategy} HTTP ${response.status} error body:`, errorBody.substring(0, 500));
        } catch {
          // Ignore text parsing errors
        }
        
        const errorMsg = `${strategy}: HTTP ${response.status} ${response.statusText}${errorBody ? " - " + errorBody.substring(0, 200) : ""}`;
        
        // Retry on server errors (5xx) or specific conditions, but NOT on client errors (4xx)
        if (attempt < MAX_RETRIES && response.status >= 500) {
          console.log(`[Audit] ${strategy} will retry after server error...`);
          return fetchAuditWithRetry(url, strategy, attempt + 1);
        }
        
        return {
          success: false,
          error: errorMsg,
        };
      }

      const data = (await response.json()) as Record<string, unknown>;
      const lighthouse = data?.lighthouseResult as Record<string, unknown> | undefined;

      if (!lighthouse) {
        console.error(`[Audit] ${strategy}: No lighthouseResult in response`);
        
        // Retry if no lighthouse data on first attempt
        if (attempt < MAX_RETRIES) {
          console.log(`[Audit] ${strategy} will retry after missing lighthouse data...`);
          return fetchAuditWithRetry(url, strategy, attempt + 1);
        }
        
        return {
          success: false,
          error: `${strategy}: Missing lighthouse data`,
        };
      }

      const scores = extractScores(lighthouse);
      console.log(`[Audit] ${strategy} success - performance: ${scores.performance}`);
      return {
        success: true,
        data: {
          performance: scores.performance,
          seo: scores.seo,
          accessibility: scores.accessibility,
          bestPractices: scores.bestPractices,
          lhr: lighthouse,
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`[Audit] ${strategy} error:`, errorMessage);
      
      // Retry on network errors
      if (attempt < MAX_RETRIES) {
        console.log(`[Audit] ${strategy} will retry after error...`);
        return fetchAuditWithRetry(url, strategy, attempt + 1);
      }
      
      return {
        success: false,
        error: `${strategy}: ${errorMessage}`,
      };
    }
  };

  // === STEP 5: SEQUENTIAL EXECUTION - MOBILE FIRST, THEN DESKTOP ===
  const scanStartTime = Date.now();
  console.log(`[Audit] ========== SCAN START at ${new Date().toISOString()} ==========`);

  try {
    // Run mobile FIRST
    const mobileStartTime = Date.now();
    console.log(`[Audit] MOBILE START at ${new Date().toISOString()}`);
    const mobileResult = await fetchAuditWithRetry(buildApiUrl("mobile"), "mobile");
    const mobileEndTime = Date.now();
    const mobileDuration = ((mobileEndTime - mobileStartTime) / 1000).toFixed(1);
    console.log(`[Audit] MOBILE END at ${new Date().toISOString()} - Duration: ${mobileDuration}s - Result: ${mobileResult.success ? "success" : "failed"}`);

    // Then run desktop AFTER mobile completes
    const desktopStartTime = Date.now();
    console.log(`[Audit] DESKTOP START at ${new Date().toISOString()}`);
    const desktopResult = await fetchAuditWithRetry(buildApiUrl("desktop"), "desktop");
    const desktopEndTime = Date.now();
    const desktopDuration = ((desktopEndTime - desktopStartTime) / 1000).toFixed(1);
    console.log(`[Audit] DESKTOP END at ${new Date().toISOString()} - Duration: ${desktopDuration}s - Result: ${desktopResult.success ? "success" : "failed"}`);

    const hasMobile = mobileResult.success;
    const hasDesktop = desktopResult.success;
    const totalDuration = ((Date.now() - scanStartTime) / 1000).toFixed(1);
    console.log(`[Audit] ========== SCAN COMPLETE - Total Duration: ${totalDuration}s ==========`);

    // If both failed, return error
    if (!hasMobile && !hasDesktop) {
      const combinedError = [mobileResult.error, desktopResult.error]
        .filter(Boolean)
        .join(" | ");

      return NextResponse.json(
        {
          success: false,
          mobile: null,
          desktop: null,
          error: combinedError || "Both audits failed",
          partial: false,
        },
        { status: 502 }
      );
    }

    // Return partial or full results
    return NextResponse.json({
      success: true,
      mobile: mobileResult.data ?? null,
      desktop: desktopResult.data ?? null,
      error:
        (!hasMobile ? mobileResult.error : undefined) ||
        (!hasDesktop ? desktopResult.error : undefined) ||
        null,
      partial: !hasMobile || !hasDesktop,
    });
  } catch (error) {
    // Catch ALL errors safely
    const errorMessage = error instanceof Error ? error.message : "Unknown server error";
    console.error("[Audit] Unexpected error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        mobile: null,
        desktop: null,
        error: errorMessage,
        partial: false,
      },
      { status: 500 }
    );
  }
}

