/**
 * Unified Website Checker Types
 * Single source of truth for all audit data structures
 */

export type LighthouseScoreKey = "performance" | "seo" | "accessibility" | "best-practices";
export type LighthouseScoreLabel = "Excellent" | "Good" | "Needs Improvement" | "Poor";

export type AuditErrorType = "config_error" | "scan_error" | "validation_error" | "unknown";

/**
 * Strict data contract for ALL audit responses
 * NEVER returns undefined fields
 * NEVER returns fake/simulated data
 */
export interface AuditResponse {
  success: boolean;
  source: "pagespeed_insights" | null;
  desktop: DeviceAudit | null;
  mobile: DeviceAudit | null;
  error: string | null;
  errorType: AuditErrorType | null;
  scannedAt: string;
}

export interface DeviceAudit {
  scores: AuditScores;
  metrics: CoreWebVitals | null;
  rawLhr: unknown; // Raw Google PageSpeed response
}

export type AuditScores = Record<LighthouseScoreKey, ScoreDetail>;

export interface ScoreDetail {
  score: number; // 0-100
  label: LighthouseScoreLabel;
  color: "green" | "yellow" | "red";
  explanation: string;
}

export interface CoreWebVitals {
  lcp: MetricDetail | null; // Largest Contentful Paint
  cls: MetricDetail | null; // Cumulative Layout Shift
  tbt: MetricDetail | null; // Total Blocking Time
  fcp: MetricDetail | null; // First Contentful Paint
  tti: MetricDetail | null; // Time to Interactive
}

export interface MetricDetail {
  value: number;
  formatted: string;
  severity: "good" | "needs-improvement" | "poor";
}

/**
 * Frontend-safe client audit
 * Processed and validated for UI rendering
 */
export interface ClientAudit {
  url: string;
  businessName?: string;
  scannedAt: number;
  source: "pagespeed_insights";
  desktop: DeviceAudit;
  mobile: DeviceAudit;
  insights: AuditInsights;
}

export interface AuditInsights {
  summary: string;
  criticalIssues: string[];
  recommendations: Recommendation[];
  worstCategory: LighthouseScoreKey | null;
  overallGrade: LighthouseScoreLabel;
}

export interface Recommendation {
  category: LighthouseScoreKey;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

/**
 * Error classification for proper handling
 */
export class AuditError extends Error {
  type: AuditErrorType;
  isUserFacing: boolean;
  userMessage: string;

  constructor(params: {
    message: string;
    type: AuditErrorType;
    userMessage?: string;
    isUserFacing?: boolean;
  }) {
    super(params.message);
    this.type = params.type;
    this.isUserFacing = params.isUserFacing ?? false;
    this.userMessage = params.userMessage ?? "Unable to complete audit";
  }
}

/**
 * Safe empty states - NEVER undefined
 */
export const EMPTY_SCORE_DETAIL: ScoreDetail = {
  score: 0,
  label: "Poor",
  color: "red",
  explanation: "No data available",
};

export const EMPTY_AUDIT_RESPONSE: AuditResponse = {
  success: false,
  source: null,
  desktop: null,
  mobile: null,
  error: null,
  errorType: null,
  scannedAt: new Date().toISOString(),
};

/**
 * Type guards for safe data access
 */
export function isValidAuditResponse(data: unknown): data is AuditResponse {
  if (!data || typeof data !== "object") return false;
  const r = data as AuditResponse;
  return (
    typeof r.success === "boolean" &&
    (r.source === "pagespeed_insights" || r.source === null) &&
    typeof r.scannedAt === "string" &&
    (r.error === null || typeof r.error === "string")
  );
}

export function isValidDeviceAudit(data: unknown): data is DeviceAudit {
  if (!data || typeof data !== "object") return false;
  const d = data as DeviceAudit;
  return (
    d.scores !== null &&
    typeof d.scores === "object" &&
    typeof d.scores.performance?.score === "number"
  );
}

export function hasValidScores(response: AuditResponse): boolean {
  return !!(response.desktop || response.mobile);
}

/**
 * User-facing error messages
 * NEVER expose technical details
 */
export const ERROR_MESSAGES: Record<AuditErrorType, string> = {
  config_error: "Audit service temporarily unavailable",
  scan_error: "Unable to complete scan for this URL",
  validation_error: "Invalid audit results received",
  unknown: "An unexpected error occurred",
};

/**
 * Safe score accessor - NEVER crashes
 */
export function getSafeScore(
  audit: DeviceAudit | null | undefined,
  key: LighthouseScoreKey
): number {
  if (!audit?.scores) return 0;
  return audit.scores[key]?.score ?? 0;
}

/**
 * Safe category accessor - NEVER crashes
 */
export function getSafeCategory(
  audit: DeviceAudit | null | undefined,
  key: LighthouseScoreKey
): ScoreDetail {
  if (!audit?.scores) return EMPTY_SCORE_DETAIL;
  return audit.scores[key] ?? EMPTY_SCORE_DETAIL;
}
