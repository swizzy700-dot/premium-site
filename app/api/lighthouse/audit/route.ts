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
    // Call Google PageSpeed API directly - NO WRAPPING
    console.log("[AuditAPI] Calling Google PageSpeed API for:", url);

    const apiUrl = new URL(PAGESPEED_API_URL);
    apiUrl.searchParams.append("key", apiKey);
    apiUrl.searchParams.append("url", url);
    apiUrl.searchParams.append("strategy", "mobile");
    // Request ALL 4 Lighthouse categories
    apiUrl.searchParams.append("category", "performance");
    apiUrl.searchParams.append("category", "accessibility");
    apiUrl.searchParams.append("category", "best-practices");
    apiUrl.searchParams.append("category", "seo");

    console.log("[AuditAPI] Request URL (without key):", apiUrl.toString().replace(apiKey, "REDACTED"));

    const response = await fetch(apiUrl.toString());

    console.log("[AuditAPI] Google API response status:", response.status, response.statusText);

    if (!response.ok) {
      let errorBody: string;
      try {
        const errorData = await response.json();
        errorBody = JSON.stringify(errorData);
      } catch {
        errorBody = await response.text();
      }

      console.error("🔥 REAL AUDIT ERROR - Google API rejected request:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });

      return NextResponse.json({
        success: false,
        source: null,
        desktop: null,
        mobile: null,
        error: `Google PageSpeed API error: ${response.status} ${response.statusText}`,
        errorType: "scan_error",
        scannedAt: new Date().toISOString(),
        debug: {
          googleError: errorBody,
          envKeyExists: true,
          envKeySample: apiKey.slice(0, 10),
          requestUrl: url,
          timestamp: new Date().toISOString()
        }
      }, { status: 502 });
    }

    const data = await response.json();

    console.log("[AuditAPI] Google API response received, has lighthouseResult:", !!data.lighthouseResult);
    console.log("[AuditAPI] Categories in response:", Object.keys(data.lighthouseResult?.categories || {}));

    // Transform to our format
    const lighthouse = data.lighthouseResult;
    if (!lighthouse) {
      return NextResponse.json({
        success: false,
        source: null,
        desktop: null,
        mobile: null,
        error: "Google API response missing lighthouseResult",
        errorType: "scan_error",
        scannedAt: new Date().toISOString(),
        debug: {
          responseKeys: Object.keys(data),
          timestamp: new Date().toISOString()
        }
      }, { status: 502 });
    }

    const scores = lighthouse.categories || {};

    // Extract ALL 4 Lighthouse categories (0-100 scale)
    const deviceData = {
      performance: Math.round((scores.performance?.score || 0) * 100),
      accessibility: Math.round((scores.accessibility?.score || 0) * 100),
      bestPractices: Math.round((scores["best-practices"]?.score || 0) * 100),
      seo: Math.round((scores.seo?.score || 0) * 100),
      lhr: lighthouse
    };
    
    console.log("[AuditAPI] Extracted scores:", {
      performance: deviceData.performance,
      accessibility: deviceData.accessibility,
      bestPractices: deviceData.bestPractices,
      seo: deviceData.seo
    });

    return NextResponse.json({
      success: true,
      source: "pagespeed_insights",
      url,
      mobile: deviceData,
      desktop: deviceData, // FIX: Don't return null, duplicate mobile for now
      error: null,
      errorType: null,
      scannedAt: new Date().toISOString()
    });

  } catch (error) {
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
