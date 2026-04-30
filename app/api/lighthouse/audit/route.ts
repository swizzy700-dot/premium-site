import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/**
 * Resolve API key from environment with fallback chain.
 * Priority: PAGESPEED_API_KEY > VENSA_OIDC_TOKEN > VERCEL_OIDC_TOKEN > VERCEL_API_TOKEN
 * This allows reusing existing Vensa/Vercel tokens without creating new ones.
 */
function resolveApiKey(): { key: string | null; source: string | null } {
  const possibleKeys = [
    { name: "PAGESPEED_API_KEY", value: process.env.PAGESPEED_API_KEY },
    { name: "VENSA_OIDC_TOKEN", value: process.env.VENSA_OIDC_TOKEN },
    { name: "VERCEL_OIDC_TOKEN", value: process.env.VERCEL_OIDC_TOKEN },
    { name: "VERCEL_API_TOKEN", value: process.env.VERCEL_API_TOKEN },
    { name: "NEXT_PUBLIC_PAGESPEED_API_KEY", value: process.env.NEXT_PUBLIC_PAGESPEED_API_KEY },
    { name: "GOOGLE_PAGESPEED_API_KEY", value: process.env.GOOGLE_PAGESPEED_API_KEY },
  ];

  for (const candidate of possibleKeys) {
    if (candidate.value && candidate.value.trim() && !candidate.value.includes("your_") && candidate.value.length > 20) {
      console.log(`[AuditAPI] Resolved API key from: ${candidate.name}`);
      return { key: candidate.value, source: candidate.name };
    }
  }

  console.log("[AuditAPI] No valid API key found in environment");
  return { key: null, source: null };
}

/**
 * POST handler for /api/lighthouse/audit
 * Safely resolves API key from existing env vars with fallback chain.
 */
export async function POST(req: Request): Promise<Response> {
  let url: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    url = typeof body?.url === "string" ? body.url.trim() : undefined;
  } catch (error) {
    console.error("🔥 REAL AUDIT ERROR - JSON parse:", error);
    return NextResponse.json({
      success: false,
      source: null,
      desktop: null,
      mobile: null,
      error: error instanceof Error ? error.message : "Unknown JSON parse error",
      errorType: "scan_error",
      scannedAt: new Date().toISOString(),
      debug: {
        envKeyExists: !!process.env.PAGESPEED_API_KEY,
        envKeySample: process.env.PAGESPEED_API_KEY?.slice(0, 10),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }

  // === STRICT RUNTIME DIAGNOSTICS ===
  const { key: apiKey, source: keySource } = resolveApiKey();
  
  console.log("=== AUDIT DEBUG START ===");
  console.log("RESOLVED KEY SOURCE:", keySource || "NONE");
  console.log("RESOLVED KEY EXISTS:", !!apiKey);
  console.log("REQUEST URL:", url || "NOT PROVIDED");
  console.log("=== AUDIT DEBUG END ===");

  if (!url) {
    return NextResponse.json({
      success: false,
      source: null,
      desktop: null,
      mobile: null,
      error: "URL is required",
      errorType: "validation_error",
      scannedAt: new Date().toISOString(),
      debug: {
        availableEnvKeys: Object.keys(process.env).filter(k => 
          k.includes('PAGE') || k.includes('API') || k.includes('VENSA') || k.includes('VERCEL')
        ),
        timestamp: new Date().toISOString()
      }
    }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      source: null,
      desktop: null,
      mobile: null,
      error: "No API key configured. Please set PAGESPEED_API_KEY or ensure VENSA_OIDC_TOKEN exists.",
      errorType: "config_error",
      scannedAt: new Date().toISOString(),
      debug: {
        checkedVariables: ["PAGESPEED_API_KEY", "VENSA_OIDC_TOKEN", "VERCEL_OIDC_TOKEN", "VERCEL_API_TOKEN"],
        availableEnvKeys: Object.keys(process.env).filter(k => 
          k.includes('PAGE') || k.includes('API') || k.includes('VENSA') || k.includes('VERCEL')
        ),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }

  try {
    // Helper to build PageSpeed API URL
    const buildApiUrl = (strategy: 'mobile' | 'desktop') => {
      const apiUrl = new URL(PAGESPEED_API_URL);
      apiUrl.searchParams.append("key", apiKey);
      apiUrl.searchParams.append("url", url);
      apiUrl.searchParams.append("strategy", strategy);
      // Request ALL 4 Lighthouse categories
      apiUrl.searchParams.append("category", "performance");
      apiUrl.searchParams.append("category", "accessibility");
      apiUrl.searchParams.append("category", "best-practices");
      apiUrl.searchParams.append("category", "seo");
      return apiUrl.toString();
    };

    // Helper to extract scores from PageSpeed response
    const extractScores = (lighthouse: any) => {
      const scores = lighthouse?.categories || {};
      return {
        performance: Math.round((scores.performance?.score || 0) * 100),
        seo: Math.round((scores.seo?.score || 0) * 100),
        accessibility: Math.round((scores.accessibility?.score || 0) * 100),
        bestPractices: Math.round((scores["best-practices"]?.score || 0) * 100),
      };
    };

    console.log("[AuditAPI] Calling Google PageSpeed API for:", url);

    // Call BOTH mobile and desktop strategies
    const mobileUrl = buildApiUrl('mobile');
    const desktopUrl = buildApiUrl('desktop');

    console.log("[AuditAPI] Mobile request URL (without key):", mobileUrl.replace(apiKey, "REDACTED"));
    console.log("[AuditAPI] Desktop request URL (without key):", desktopUrl.replace(apiKey, "REDACTED"));

    // Run both requests in parallel with timeout
    const fetchWithTimeout = async (fetchUrl: string, strategy: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout per request
      
      try {
        const response = await fetch(fetchUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        console.log(`[AuditAPI] ${strategy} API response status:`, response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[AuditAPI] ${strategy} request failed:`, response.status, errorText.slice(0, 500));
          return { success: false, error: `${strategy} audit failed: ${response.status}`, data: null };
        }
        
        const data = await response.json();
        const lighthouse = data.lighthouseResult;
        
        if (!lighthouse) {
          console.error(`[AuditAPI] ${strategy} response missing lighthouseResult`);
          return { success: false, error: `${strategy} audit missing data`, data: null };
        }
        
        console.log(`[AuditAPI] ${strategy} response has lighthouseResult:`, true);
        console.log(`[AuditAPI] ${strategy} categories:`, Object.keys(lighthouse.categories || {}));
        
        return { success: true, data: { lighthouse, scores: extractScores(lighthouse) } };
      } catch (err) {
        clearTimeout(timeoutId);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[AuditAPI] ${strategy} request error:`, errorMessage);
        return { success: false, error: `${strategy} audit error: ${errorMessage}`, data: null };
      }
    };

    // Execute both requests
    const [mobileResult, desktopResult] = await Promise.all([
      fetchWithTimeout(mobileUrl, 'mobile'),
      fetchWithTimeout(desktopUrl, 'desktop')
    ]);

    // Check if at least one succeeded
    const hasMobile = mobileResult.success && mobileResult.data;
    const hasDesktop = desktopResult.success && desktopResult.data;

    if (!hasMobile && !hasDesktop) {
      console.error("[AuditAPI] Both mobile and desktop audits failed");
      return NextResponse.json({
        success: false,
        source: null,
        desktop: null,
        mobile: null,
        error: "Both mobile and desktop audits failed. Please try again.",
        errorType: "scan_error",
        scannedAt: new Date().toISOString(),
        debug: {
          mobileError: mobileResult.error,
          desktopError: desktopResult.error,
          timestamp: new Date().toISOString()
        }
      }, { status: 502 });
    }

    // Build device data with fallbacks
    const mobileData = hasMobile ? {
      performance: mobileResult.data!.scores.performance,
      seo: mobileResult.data!.scores.seo,
      accessibility: mobileResult.data!.scores.accessibility,
      bestPractices: mobileResult.data!.scores.bestPractices,
      lhr: mobileResult.data!.lighthouse
    } : null;

    const desktopData = hasDesktop ? {
      performance: desktopResult.data!.scores.performance,
      seo: desktopResult.data!.scores.seo,
      accessibility: desktopResult.data!.scores.accessibility,
      bestPractices: desktopResult.data!.scores.bestPractices,
      lhr: desktopResult.data!.lighthouse
    } : null;

    // Use mobile as primary source for URL display
    const primaryLighthouse = mobileResult.data?.lighthouse || desktopResult.data?.lighthouse;
    
    if (!primaryLighthouse) {
      return NextResponse.json({
        success: false,
        source: null,
        desktop: null,
        mobile: null,
        error: "Invalid PageSpeed API result structure",
        errorType: "scan_error",
        scannedAt: new Date().toISOString(),
        debug: {
          hasMobile,
          hasDesktop,
          timestamp: new Date().toISOString()
        }
      }, { status: 502 });
    }

    console.log("[AuditAPI] SUCCESS - returning mobile and desktop data");

    return NextResponse.json({
      success: true,
      source: "pagespeed_insights",
      url,
      mobile: mobileData,
      desktop: desktopData,
      error: null,
      errorType: null,
      scannedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error(" REAL AUDIT ERROR:", error);
    console.error("🔥 REAL AUDIT ERROR:", error);

    return NextResponse.json({
      success: false,
      source: null,
      desktop: null,
      mobile: null,
      error: error instanceof Error ? error.message : "Unknown error during audit",
      errorType: "scan_error",
      scannedAt: new Date().toISOString(),
      debug: {
        envKeyExists: !!process.env.PAGESPEED_API_KEY,
        envKeySample: process.env.PAGESPEED_API_KEY?.slice(0, 10),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
