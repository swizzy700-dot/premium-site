import { NextResponse } from "next/server";
import { runWebsiteAudit } from "@/lib/website-checker/auditEngine";
import { isValidAuditResponse, ERROR_MESSAGES, type AuditResponse } from "@/lib/website-checker/types";
import { auditLogger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * POST handler for /api/lighthouse/audit
 * Unified audit endpoint using single audit engine
 * NEVER returns fake/simulated data
 */
export async function POST(req: Request): Promise<Response> {
  // Parse request
  let url: string | undefined;
  
  try {
    const body = await req.json().catch(() => ({}));
    url = typeof body?.url === "string" ? body.url.trim() : undefined;
  } catch {
    // Invalid JSON body
  }

  // Validate URL
  if (!url) {
    const errorResponse: AuditResponse = {
      success: false,
      source: null,
      desktop: null,
      mobile: null,
      error: ERROR_MESSAGES.validation_error,
      errorType: "validation_error",
      scannedAt: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  // Run unified audit
  const result = await runWebsiteAudit(url);

  // Validate response structure
  if (!isValidAuditResponse(result)) {
    const errorResponse: AuditResponse = {
      success: false,
      source: null,
      desktop: null,
      mobile: null,
      error: ERROR_MESSAGES.validation_error,
      errorType: "validation_error",
      scannedAt: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }

  // Log for monitoring - expected failures are warnings, not errors
  if (result.success) {
    auditLogger.success("AuditAPI", url);
  } else if (result.errorType && result.errorType !== "unknown") {
    // Expected failures (config_error, scan_error, validation_error) logged as warnings
    auditLogger.scanFailed("AuditAPI", url, { errorType: result.errorType, message: result.error });
  } else {
    // Only true crashes logged as errors
    auditLogger.crash("AuditAPI", result.error);
  }

  return NextResponse.json(result);
}
