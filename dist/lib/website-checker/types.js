/**
 * Unified Website Checker Types
 * Single source of truth for all audit data structures
 */
/**
 * Error classification for proper handling
 */
export class AuditError extends Error {
    type;
    isUserFacing;
    userMessage;
    constructor(params) {
        super(params.message);
        this.type = params.type;
        this.isUserFacing = params.isUserFacing ?? false;
        this.userMessage = params.userMessage ?? "Unable to complete audit";
    }
}
/**
 * Safe empty states - NEVER undefined
 */
export const EMPTY_SCORE_DETAIL = {
    score: 0,
    label: "Poor",
    color: "red",
    explanation: "No data available",
};
export const EMPTY_AUDIT_RESPONSE = {
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
export function isValidAuditResponse(data) {
    if (!data || typeof data !== "object")
        return false;
    const r = data;
    return (typeof r.success === "boolean" &&
        (r.source === "pagespeed_insights" || r.source === null) &&
        typeof r.scannedAt === "string" &&
        (r.error === null || typeof r.error === "string"));
}
export function isValidDeviceAudit(data) {
    if (!data || typeof data !== "object")
        return false;
    const d = data;
    return (d.scores !== null &&
        typeof d.scores === "object" &&
        typeof d.scores.performance?.score === "number");
}
export function hasValidScores(response) {
    return !!(response.desktop || response.mobile);
}
/**
 * User-facing error messages
 * NEVER expose technical details
 */
export const ERROR_MESSAGES = {
    config_error: "Audit service temporarily unavailable",
    scan_error: "Unable to complete scan for this URL",
    validation_error: "Invalid audit results received",
    unknown: "An unexpected error occurred",
};
/**
 * Safe score accessor - NEVER crashes
 */
export function getSafeScore(audit, key) {
    if (!audit?.scores)
        return 0;
    return audit.scores[key]?.score ?? 0;
}
/**
 * Safe category accessor - NEVER crashes
 */
export function getSafeCategory(audit, key) {
    if (!audit?.scores)
        return EMPTY_SCORE_DETAIL;
    return audit.scores[key] ?? EMPTY_SCORE_DETAIL;
}
//# sourceMappingURL=types.js.map