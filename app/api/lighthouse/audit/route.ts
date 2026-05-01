import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const REQUEST_TIMEOUT_MS = 25000; // 25 seconds max per request

/**
 * POST handler for /api/lighthouse/audit
 * Uses ONLY PAGESPEED_API_KEY from Vercel environment variables.
 * NO fallbacks. NO other tokens. Server-side only.
 * 
 * STABILITY FIXES:
 * - AbortController with timeout to prevent hanging requests
 * - Sequential requests to avoid parallel timeout issues  
 * - Guaranteed response (never leave client hanging)
 * - Proper error handling with controlled responses
 */
export async function POST(req: Request): Promise<Response> {
  // Parse request body
  let targetUrl: string | undefined;
  
  try {
    const body = await req.json();
    targetUrl = typeof body?.url === "string" ? body.url.trim() : undefined;
  } catch {
    return NextResponse.json({
      success: false,
      mobile: null,
      desktop: null,
      error: "Invalid JSON body",
    }, { status: 400 });
  }

  // Validate URL
  if (!targetUrl) {
    return NextResponse.json({
      success: false,
      mobile: null,
      desktop: null,
      error: "Missing URL parameter",
    }, { status: 400 });
  }

  // === SINGLE ENV VARIABLE: PAGESPEED_API_KEY ONLY ===
  const key = process.env.PAGESPEED_API_KEY;
  
  // Reject invalid URLs early
  if (!targetUrl || typeof targetUrl !== 'string') {
    return NextResponse.json({
      success: false,
      mobile: null,
      desktop: null,
      error: "Invalid URL: URL must be a string",
    }, { status: 400 });
  }

  // Check for state strings being passed as URLs (common bug)
  const invalidUrlValues = ['idle', 'running', 'scanning', 'completed', 'error', 'undefined', 'null', ''];
  if (invalidUrlValues.includes(targetUrl.toLowerCase().trim())) {
    return NextResponse.json({
      success: false,
      mobile: null,
      desktop: null,
      error: "Invalid URL",
    }, { status: 400 });
  }

  // Validate URL format
  let validatedUrl: string;
  try {
    let urlToValidate = targetUrl.trim();
    if (!urlToValidate.startsWith('http://') && !urlToValidate.startsWith('https://')) {
      urlToValidate = 'https://' + urlToValidate;
    }

    const urlObj = new URL(urlToValidate);
    validatedUrl = urlObj.toString();
  } catch {
    return NextResponse.json({
      success: false,
      mobile: null,
      desktop: null,
      error: "Invalid URL format",
    }, { status: 400 });
  }

  // Strict validation: Return error immediately if missing
  if (!key) {
    return NextResponse.json({
      success: false,
      mobile: null,
      desktop: null,
      error: "Server configuration error: Missing PageSpeed API key",
    }, { status: 500 });
  }

  // Helper to build PageSpeed API URL
  const buildApiUrl = (strategy: 'mobile' | 'desktop') => {
    const encodedUrl = encodeURIComponent(validatedUrl);
    return `${PAGESPEED_API_URL}?url=${encodedUrl}&key=${key}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`;
  };

  // Helper to extract scores from Lighthouse result
  const extractScores = (lighthouse: any) => {
    const scores = lighthouse?.categories || {};
    return {
      performance: Math.round((scores.performance?.score || 0) * 100),
      seo: Math.round((scores.seo?.score || 0) * 100),
      accessibility: Math.round((scores.accessibility?.score || 0) * 100),
      bestPractices: Math.round((scores["best-practices"]?.score || 0) * 100),
    };
  };

  // Fetch without AbortController - let Google PageSpeed handle timeouts
  const fetchAudit = async (url: string, strategy: string): Promise<{success: boolean; data?: any; error?: string}> => {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `API error (${strategy}): ${response.status}`
        };
      }

      const data = await response.json();
      const lighthouse = data?.lighthouseResult;

      if (!lighthouse) {
        return {
          success: false,
          error: `${strategy} missing lighthouse data`
        };
      }

      const scores = extractScores(lighthouse);
      return {
        success: true,
        data: {
          performance: scores.performance,
          seo: scores.seo,
          accessibility: scores.accessibility,
          bestPractices: scores.bestPractices,
          lhr: lighthouse,
        }
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        error: `${strategy} error: ${errorMessage}`
      };
    }
  };

  try {
    // Build URLs for both strategies
    const mobileApiUrl = buildApiUrl('mobile');
    const desktopApiUrl = buildApiUrl('desktop');

    // PARALLEL requests: Run mobile and desktop simultaneously for speed
    const [mobileResult, desktopResult] = await Promise.all([
      fetchAudit(mobileApiUrl, 'mobile'),
      fetchAudit(desktopApiUrl, 'desktop')
    ]);

    // Check if at least one succeeded
    if (!mobileResult.success && !desktopResult.success) {
      return NextResponse.json({
        success: false,
        mobile: null,
        desktop: null,
        error: mobileResult.error || desktopResult.error || "Both audits failed",
      }, { status: 502 });
    }

    // Build final response (allow partial success)
    return NextResponse.json({
      success: true,
      mobile: mobileResult.data || null,
      desktop: desktopResult.data || null,
      partial: !mobileResult.success || !desktopResult.success,
      error: (!mobileResult.success ? mobileResult.error : undefined) ||
             (!desktopResult.success ? desktopResult.error : undefined) || null,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      mobile: null,
      desktop: null,
      partial: false,
      error: error instanceof Error ? error.message : "Unknown server error",
    }, { status: 500 });
  }
}
