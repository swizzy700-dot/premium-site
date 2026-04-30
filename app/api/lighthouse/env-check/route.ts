import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/lighthouse/env-check
 * Diagnostic endpoint to verify environment variables in production
 * Safe - does NOT expose actual API key values
 */
export async function GET(): Promise<Response> {
  const possibleKeyNames = [
    "PAGESPEED_API_KEY",
    "VENSA_OIDC_TOKEN",
    "VERCEL_OIDC_TOKEN",
    "VERCEL_API_TOKEN",
    "NEXT_PUBLIC_PAGESPEED_API_KEY",
    "pagespeed_api_key",
    "GOOGLE_PAGESPEED_API_KEY",
    "PAGESPEED_KEY",
  ];

  const results = possibleKeyNames.map((name) => {
    const value = process.env[name];
    return {
      name,
      present: !!value,
      valid: !!(value && value.trim() && !value.includes("your_") && value.length > 20),
      length: value?.length || 0,
      prefix: value ? value.substring(0, 8) + "..." : null,
    };
  });

  const foundKey = results.find((r) => r.valid);

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
    apiKeyStatus: {
      found: !!foundKey,
      variableName: foundKey?.name || null,
    },
    checkedVariables: results,
    timestamp: new Date().toISOString(),
  });
}
