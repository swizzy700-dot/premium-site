import { NextResponse } from "next/server";
import { runWebsiteAudit } from "@/lib/website-checker/auditEngine";
import { analyzeBusinessImpact, type BusinessAnalysis } from "@/lib/website-checker/analysisEngine";
import { isValidAuditResponse, ERROR_MESSAGES, type AuditResponse } from "@/lib/website-checker/types";
import { auditLogger } from "@/lib/logger";

export const runtime = "nodejs";

export interface AnalysisResponse {
  success: boolean;
  audit: AuditResponse | null;
  analysis: BusinessAnalysis | null;
  error: string | null;
  errorType: string | null;
}

/**
 * POST handler for /api/lighthouse/analyze
 * Runs PageSpeed audit AND generates business analysis
 */
export async function POST(req: Request): Promise<Response> {
  let url: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    url = typeof body?.url === "string" ? body.url.trim() : undefined;
  } catch {
    // Invalid JSON
  }

  if (!url) {
    const response: AnalysisResponse = {
      success: false,
      audit: null,
      analysis: null,
      error: ERROR_MESSAGES.validation_error,
      errorType: "validation_error",
    };
    return NextResponse.json(response, { status: 400 });
  }

  // Run audit
  const audit = await runWebsiteAudit(url);

  if (!isValidAuditResponse(audit)) {
    const response: AnalysisResponse = {
      success: false,
      audit: null,
      analysis: null,
      error: ERROR_MESSAGES.validation_error,
      errorType: "validation_error",
    };
    return NextResponse.json(response, { status: 500 });
  }

  // Log result
  if (audit.success) {
    auditLogger.success("AnalysisAPI", url);
  } else {
    auditLogger.scanFailed("AnalysisAPI", url, { errorType: audit.errorType, error: audit.error });
  }

  // If audit succeeded, generate business analysis
  let analysis: BusinessAnalysis | null = null;
  if (audit.success && (audit.desktop || audit.mobile)) {
    try {
      analysis = analyzeBusinessImpact(audit, url);
    } catch (e) {
      auditLogger.crash("AnalysisAPI", e);
    }
  }

  const response: AnalysisResponse = {
    success: audit.success,
    audit,
    analysis,
    error: audit.error,
    errorType: audit.errorType,
  };

  return NextResponse.json(response);
}
