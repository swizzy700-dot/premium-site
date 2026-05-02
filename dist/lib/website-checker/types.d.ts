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
    status?: "complete" | "partial_failure" | "failed";
    source: "pagespeed_insights" | null;
    desktop: DeviceAudit | null;
    mobile: DeviceAudit | null;
    error: string | null;
    errorType: AuditErrorType | null;
    scannedAt: string;
    errors?: {
        mobile?: string;
        desktop?: string;
    };
}
export interface DeviceAudit {
    scores: AuditScores;
    metrics: CoreWebVitals | null;
    rawLhr: unknown;
}
export type AuditScores = Record<LighthouseScoreKey, ScoreDetail>;
export interface ScoreDetail {
    score: number;
    label: LighthouseScoreLabel;
    color: "green" | "yellow" | "red";
    explanation: string;
}
export interface CoreWebVitals {
    lcp: MetricDetail | null;
    cls: MetricDetail | null;
    tbt: MetricDetail | null;
    fcp: MetricDetail | null;
    tti: MetricDetail | null;
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
export declare class AuditError extends Error {
    type: AuditErrorType;
    isUserFacing: boolean;
    userMessage: string;
    constructor(params: {
        message: string;
        type: AuditErrorType;
        userMessage?: string;
        isUserFacing?: boolean;
    });
}
/**
 * Safe empty states - NEVER undefined
 */
export declare const EMPTY_SCORE_DETAIL: ScoreDetail;
export declare const EMPTY_AUDIT_RESPONSE: AuditResponse;
/**
 * Type guards for safe data access
 */
export declare function isValidAuditResponse(data: unknown): data is AuditResponse;
export declare function isValidDeviceAudit(data: unknown): data is DeviceAudit;
export declare function hasValidScores(response: AuditResponse): boolean;
/**
 * User-facing error messages
 * NEVER expose technical details
 */
export declare const ERROR_MESSAGES: Record<AuditErrorType, string>;
/**
 * Safe score accessor - NEVER crashes
 */
export declare function getSafeScore(audit: DeviceAudit | null | undefined, key: LighthouseScoreKey): number;
/**
 * Safe category accessor - NEVER crashes
 */
export declare function getSafeCategory(audit: DeviceAudit | null | undefined, key: LighthouseScoreKey): ScoreDetail;
//# sourceMappingURL=types.d.ts.map