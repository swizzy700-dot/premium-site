/**
 * Intelligence Engine
 * Transforms raw Lighthouse data into structured SaaS intelligence
 * Internal-only analysis - no AI exposed in UI
 */

import type { DeviceAuditResult } from '../workers/lighthouse.worker';

// Risk level type until Prisma generates
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

interface InternalLighthouseResult {
  lhr?: {
    categories?: Record<string, { score: number }>;
    audits?: Record<string, { score: number; details?: { items?: unknown[] } }>;
  };
}

// Intelligence analysis result
export interface IntelligenceAnalysis {
  riskLevel: RiskLevel;
  businessImpact: string[];
  technicalIssues: string[];
  conversionBlockers: string[];
  priorityFixes: string[];
}

interface ScoreSummary {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  overall: number;
  grade: string;
}

const RISK_THRESHOLDS = {
  CRITICAL: 0,
  HIGH: 50,
  MEDIUM: 70,
  LOW: 85,
};

/**
 * Analyze Lighthouse results and generate intelligence
 */
export function analyzeIntelligence(
  mobile: DeviceAuditResult | null,
  desktop: DeviceAuditResult | null
): IntelligenceAnalysis {
  const mobileScores = extractScores(mobile);
  const desktopScores = extractScores(desktop);
  const bestScores = getBestScores(mobileScores, desktopScores);

  return {
    riskLevel: determineRiskLevel(bestScores),
    businessImpact: analyzeBusinessImpact(bestScores, mobile, desktop),
    technicalIssues: identifyTechnicalIssues(mobile, desktop),
    conversionBlockers: identifyConversionBlockers(mobile, desktop),
    priorityFixes: generatePriorityFixes(mobile, desktop, bestScores),
  };
}

/**
 * Extract scores from DeviceAuditResult
 */
function extractScores(result: DeviceAuditResult | null): ScoreSummary {
  if (!result) {
    return { performance: 0, seo: 0, accessibility: 0, bestPractices: 0, overall: 0, grade: 'F' };
  }

  const perf = result.performance ?? 0;
  const seo = result.seo ?? 0;
  const a11y = result.accessibility ?? 0;
  const bp = result.bestPractices ?? 0;
  const overall = Math.round((perf + seo + a11y + bp) / 4);

  return {
    performance: perf,
    seo: seo,
    accessibility: a11y,
    bestPractices: bp,
    overall,
    grade: calculateGrade(overall),
  };
}

/**
 * Get best scores from mobile and desktop
 */
function getBestScores(mobile: ScoreSummary, desktop: ScoreSummary): ScoreSummary {
  return {
    performance: Math.max(mobile.performance, desktop.performance),
    seo: Math.max(mobile.seo, desktop.seo),
    accessibility: Math.max(mobile.accessibility, desktop.accessibility),
    bestPractices: Math.max(mobile.bestPractices, desktop.bestPractices),
    overall: Math.max(mobile.overall, desktop.overall),
    grade: mobile.overall > desktop.overall ? mobile.grade : desktop.grade,
  };
}

/**
 * Calculate grade from score
 */
function calculateGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Determine risk level from scores
 */
function determineRiskLevel(scores: ScoreSummary): RiskLevel {
  if (scores.performance < RISK_THRESHOLDS.CRITICAL ||
      scores.overall < RISK_THRESHOLDS.CRITICAL) {
    return 'CRITICAL';
  }
  if (scores.performance < RISK_THRESHOLDS.HIGH ||
      scores.overall < RISK_THRESHOLDS.HIGH) {
    return 'HIGH';
  }
  if (scores.performance < RISK_THRESHOLDS.MEDIUM ||
      scores.overall < RISK_THRESHOLDS.MEDIUM) {
    return 'MEDIUM';
  }
  if (scores.overall >= RISK_THRESHOLDS.LOW) {
    return 'LOW';
  }
  return 'MEDIUM';
}

/**
 * Analyze business impact from scores
 */
function analyzeBusinessImpact(
  scores: ScoreSummary,
  mobile: DeviceAuditResult | null,
  desktop: DeviceAuditResult | null
): string[] {
  const impacts: string[] = [];

  if (scores.performance < 50) {
    impacts.push('Critical: Slow loading likely causing high bounce rates and lost revenue');
  } else if (scores.performance < 70) {
    impacts.push('High: Page speed issues affecting user experience and conversion rates');
  } else if (scores.performance < 90) {
    impacts.push('Medium: Performance optimization could improve user engagement');
  }

  if (scores.seo < 70) {
    impacts.push('Critical: Poor SEO visibility limiting organic traffic growth');
  } else if (scores.seo < 90) {
    impacts.push('Medium: SEO improvements could increase search rankings');
  }

  if (scores.accessibility < 70) {
    impacts.push('High: Accessibility issues may exclude users and create legal risk');
  }

  if (!mobile || scores.performance < 60) {
    impacts.push('Critical: Poor mobile experience losing majority of potential customers');
  }

  return impacts.length > 0 ? impacts : ['Low: Site meets basic performance standards'];
}

/**
 * Identify technical issues
 */
function identifyTechnicalIssues(
  mobile: DeviceAuditResult | null,
  desktop: DeviceAuditResult | null
): string[] {
  const issues: string[] = [];
  
  // Get the raw LHR data from either mobile or desktop
  const rawLhr = mobile?.rawLhr || desktop?.rawLhr;
  if (!rawLhr || typeof rawLhr !== 'object') {
    return ['Unable to analyze - insufficient audit data'];
  }
  
  const lhr = rawLhr as { audits?: Record<string, { score: number; details?: { items?: unknown[] } }> };
  const audits = lhr.audits;
  
  if (!audits) {
    return ['Unable to analyze - insufficient audit data'];
  }

  // Core Web Vitals
  if (audits['largest-contentful-paint']?.score && audits['largest-contentful-paint'].score < 0.5) {
    issues.push('LCP: Main content loads too slowly');
  }
  if (audits['first-input-delay']?.score && audits['first-input-delay'].score < 0.5) {
    issues.push('FID: Page responds slowly to user interactions');
  }
  if (audits['cumulative-layout-shift']?.score && audits['cumulative-layout-shift'].score < 0.5) {
    issues.push('CLS: Layout shifts causing poor user experience');
  }

  // Resource issues
  if (audits['unused-javascript']?.details?.items && 
      audits['unused-javascript'].details!.items!.length > 0) {
    issues.push('JavaScript: Unused code bloating bundle size');
  }
  if (audits['unused-css-rules']?.details?.items && 
      audits['unused-css-rules'].details!.items!.length > 0) {
    issues.push('CSS: Unused styles increasing download size');
  }
  if (audits['render-blocking-resources']?.details?.items && 
      audits['render-blocking-resources'].details!.items!.length > 0) {
    issues.push('Resources: Render-blocking assets delaying first paint');
  }

  // Image issues
  if (audits['uses-responsive-images']?.score && audits['uses-responsive-images'].score < 0.5) {
    issues.push('Images: Not using responsive images for different screen sizes');
  }
  if (audits['modern-image-formats']?.score && audits['modern-image-formats'].score < 0.5) {
    issues.push('Images: Not using modern formats (WebP, AVIF)');
  }

  return issues.length > 0 ? issues : ['No major technical issues detected'];
}

/**
 * Identify conversion blockers
 */
function identifyConversionBlockers(
  mobile: DeviceAuditResult | null,
  desktop: DeviceAuditResult | null
): string[] {
  const blockers: string[] = [];
  
  // Get the raw LHR data from either mobile or desktop
  const rawLhr = mobile?.rawLhr || desktop?.rawLhr;
  if (!rawLhr || typeof rawLhr !== 'object') {
    return [];
  }
  
  const lhr = rawLhr as { 
    audits?: Record<string, { score: number }>;
    categories?: { performance?: { score: number } };
  };
  const audits = lhr.audits;

  if (!audits) {
    return [];
  }

  // Speed blockers
  if (audits['speed-index']?.score && audits['speed-index'].score < 0.5) {
    blockers.push('Speed: Slow content visible to users, increasing bounce rate');
  }
  if (audits['server-response-time']?.score && audits['server-response-time'].score < 0.5) {
    blockers.push('Server: Slow backend response delaying page start');
  }

  // Mobile blockers
  if (mobile?.performance && mobile.performance < 30) {
    blockers.push('Mobile: Critical mobile performance issues losing mobile traffic');
  }

  // Form issues
  if (audits['label']?.score && audits['label'].score < 0.9) {
    blockers.push('Forms: Missing labels on form inputs reducing accessibility');
  }

  // Trust signals
  if (audits['is-on-https']?.score === 0) {
    blockers.push('Security: Not using HTTPS - major trust issue for users');
  }

  return blockers.length > 0 ? blockers : ['No major conversion blockers detected'];
}

/**
 * Generate prioritized fixes
 */
function generatePriorityFixes(
  mobile: DeviceAuditResult | null,
  desktop: DeviceAuditResult | null,
  scores: ScoreSummary
): string[] {
  const fixes: string[] = [];

  // Critical fixes first
  if (scores.performance < 50) {
    fixes.push('CRITICAL: Optimize images - compress, use WebP, implement lazy loading');
    fixes.push('CRITICAL: Minimize JavaScript - remove unused code, defer non-critical scripts');
    fixes.push('CRITICAL: Enable compression (gzip/brotli) for text-based assets');
  }

  if (scores.seo < 70) {
    fixes.push('HIGH: Add meta descriptions to all pages');
    fixes.push('HIGH: Fix title tags - ensure unique, descriptive titles');
    fixes.push('HIGH: Add proper heading hierarchy (H1-H6)');
  }

  if (scores.accessibility < 70) {
    fixes.push('HIGH: Add alt text to all images');
    fixes.push('HIGH: Ensure sufficient color contrast ratios');
    fixes.push('HIGH: Add labels to all form inputs');
  }

  // Medium priority
  if (scores.bestPractices < 80) {
    fixes.push('MEDIUM: Update to HTTPS if not already enabled');
    fixes.push('MEDIUM: Fix console errors and deprecated API usage');
  }

  if (scores.performance < 80) {
    fixes.push('MEDIUM: Implement browser caching headers');
    fixes.push('MEDIUM: Preload critical resources');
    fixes.push('MEDIUM: Use CDN for static assets');
  }

  // Low priority optimizations
  if (scores.overall >= 80) {
    fixes.push('LOW: Fine-tune Core Web Vitals for perfect scores');
    fixes.push('LOW: Implement advanced caching strategies');
    fixes.push('LOW: Optimize font loading strategy');
  }

  return fixes.length > 0 ? fixes : ['Site is well-optimized, focus on monitoring'];
}

/**
 * Generate summary metrics for dashboard display
 */
export function generateSummaryMetrics(
  mobile: DeviceAuditResult | null,
  desktop: DeviceAuditResult | null
): Record<string, unknown> {
  const intelligence = analyzeIntelligence(mobile, desktop);
  const mobileScores = extractScores(mobile);
  const desktopScores = extractScores(desktop);

  return {
    // Device comparison
    mobile: mobileScores,
    desktop: desktopScores,
    best: getBestScores(mobileScores, desktopScores),
    
    // Intelligence
    riskLevel: intelligence.riskLevel,
    issueCount: intelligence.technicalIssues.length,
    blockerCount: intelligence.conversionBlockers.length,
    
    // Quick insights
    topIssue: intelligence.technicalIssues[0] || 'No critical issues',
    topFix: intelligence.priorityFixes[0] || 'Continue monitoring',
    
    // Performance indicators
    isFast: mobileScores.performance >= 90 || desktopScores.performance >= 90,
    isMobileFriendly: mobileScores.overall >= 70,
    seoReady: Math.max(mobileScores.seo, desktopScores.seo) >= 80,
  };
}

/**
 * Determine if audit needs immediate attention
 */
export function needsAttention(analysis: IntelligenceAnalysis): boolean {
  return analysis.riskLevel === 'CRITICAL' || analysis.riskLevel === 'HIGH';
}

/**
 * Format intelligence for API response (clean, no AI references)
 */
export function formatIntelligenceForResponse(
  analysis: IntelligenceAnalysis
): Record<string, unknown> {
  return {
    risk: analysis.riskLevel,
    impact: analysis.businessImpact.slice(0, 3), // Top 3 impacts
    issues: analysis.technicalIssues.slice(0, 5), // Top 5 issues
    blockers: analysis.conversionBlockers.slice(0, 3), // Top 3 blockers
    fixes: analysis.priorityFixes.slice(0, 5), // Top 5 fixes
    urgency: needsAttention(analysis) ? 'immediate' : 'monitor',
  };
}
