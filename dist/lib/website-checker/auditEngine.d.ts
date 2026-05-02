/**
 * Unified Website Audit Engine - PRODUCTION STABLE
 * SINGLE SOURCE OF TRUTH for all PageSpeed Insights audits
 *
 * PRINCIPLES:
 * - ONLY uses Google PageSpeed Insights API
 * - NEVER generates fake/simulated data
 * - NEVER throws - always returns safe results
 * - ALWAYS returns complete AuditResponse (never undefined fields)
 * - TIMEOUT handling with graceful degradation (25s mobile, 30s desktop)
 * - SEQUENTIAL execution: mobile first, then desktop
 * - RETRY logic: 1 retry max on failure
 * - PARTIAL results: return whatever succeeds
 */
import { AuditResponse, AuditScores, LighthouseScoreKey, LighthouseScoreLabel } from "./types";
/**
 * Main entry point: Run complete audit for a URL
 * PRODUCTION-STABLE: Never throws, always returns AuditResponse
 */
export declare function runWebsiteAudit(url: string): Promise<AuditResponse>;
/**
 * Get worst performing category
 * Safe: returns null if no valid data
 */
export declare function getWorstCategory(scores: AuditScores | null | undefined): LighthouseScoreKey | null;
/**
 * Get overall grade from all scores
 * Safe: returns "Poor" if no valid data
 */
export declare function getOverallGrade(scores: AuditScores | null | undefined): LighthouseScoreLabel;
/**
 * Get safe default scores for empty state
 * NEVER returns undefined
 */
export declare function getDefaultScores(): AuditScores;
//# sourceMappingURL=auditEngine.d.ts.map