/**
 * WebIntel Intelligence Engine v2
 * Expert-level website analysis with business-aware insights
 * Mobile-first intelligence platform
 */

import type { DeviceAuditResult } from '../workers/lighthouse.worker';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

export interface IntelligenceAnalysis {
  riskLevel: RiskLevel;
  businessImpact: BusinessInsight[];
  technicalIssues: TechnicalInsight[];
  mobileFirst: MobileInsight;
  strategicRecommendations: StrategicRecommendation[];
  executiveSummary: string;
}

export interface BusinessInsight {
  category: 'conversion' | 'seo' | 'trust' | 'retention' | 'accessibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  finding: string;
  impact: string;
  opportunity: string;
}

export interface TechnicalInsight {
  category: 'performance' | 'security' | 'ux' | 'seo';
  issue: string;
  metric: string;
  threshold: string;
  current: string;
  fix: string;
}

export interface MobileInsight {
  priority: 'primary' | 'secondary';
  score: number;
  coreIssues: string[];
  userExperienceImpact: string;
}

export interface StrategicRecommendation {
  priority: number;
  title: string;
  rationale: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'immediate' | 'short-term' | 'long-term';
  action: string;
}

interface ScoreSummary {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  overall: number;
  grade: string;
}

// Business-aware thresholds based on real conversion data
const CONVERSION_THRESHOLDS = {
  performance: { critical: 25, poor: 50, fair: 70, good: 85, excellent: 95 },
  accessibility: { critical: 50, poor: 70, fair: 80, good: 90, excellent: 98 },
  seo: { critical: 40, poor: 60, fair: 75, good: 85, excellent: 95 },
};

/**
 * Primary analysis function - Mobile-first intelligence
 */
export function analyzeIntelligenceV2(
  mobile: DeviceAuditResult | null,
  desktop: DeviceAuditResult | null
): IntelligenceAnalysis {
  const mobileScores = extractScores(mobile);
  const desktopScores = extractScores(desktop);
  
  // Use mobile as primary indicator
  const primaryScores = mobileScores;
  const secondaryScores = desktopScores;
  
  const riskLevel = determineRiskLevelV2(primaryScores, secondaryScores);
  const businessImpact = analyzeBusinessImpactV2(primaryScores, secondaryScores, mobile, desktop);
  const technicalIssues = identifyTechnicalIssuesV2(mobile, desktop);
  const mobileFirst = analyzeMobileFirstV2(mobile, mobileScores);
  const strategicRecommendations = generateStrategicRecommendationsV2(
    primaryScores, 
    secondaryScores, 
    mobile, 
    desktop,
    businessImpact
  );
  const executiveSummary = generateExecutiveSummaryV2(
    riskLevel, 
    primaryScores, 
    businessImpact,
    mobileFirst
  );

  return {
    riskLevel,
    businessImpact,
    technicalIssues,
    mobileFirst,
    strategicRecommendations,
    executiveSummary,
  };
}

function extractScores(result: DeviceAuditResult | null): ScoreSummary {
  if (!result) {
    return { performance: 0, seo: 0, accessibility: 0, bestPractices: 0, overall: 0, grade: 'F' };
  }

  const scores = {
    performance: Math.round((result.performance || 0) * 100),
    seo: Math.round((result.seo || 0) * 100),
    accessibility: Math.round((result.accessibility || 0) * 100),
    bestPractices: Math.round((result.bestPractices || 0) * 100),
  };

  const overall = Math.round(
    (scores.performance * 0.4 + scores.seo * 0.25 + scores.accessibility * 0.25 + scores.bestPractices * 0.1)
  );

  return {
    ...scores,
    overall,
    grade: calculateGrade(overall),
  };
}

function calculateGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function determineRiskLevelV2(mobile: ScoreSummary, desktop: ScoreSummary): RiskLevel {
  // Mobile-first assessment
  const mobileCritical = mobile.performance < 30 || mobile.overall < 40;
  const mobileHigh = mobile.performance < 50 || mobile.accessibility < 60 || mobile.overall < 60;
  const mobileMedium = mobile.performance < 70 || mobile.seo < 70 || mobile.overall < 75;

  // Cross-device severity
  const bothPoor = mobile.overall < 60 && desktop.overall < 60;
  
  if (mobileCritical || bothPoor) return 'CRITICAL';
  if (mobileHigh) return 'HIGH';
  if (mobileMedium) return 'MEDIUM';
  return 'LOW';
}

function analyzeBusinessImpactV2(
  mobile: ScoreSummary,
  desktop: ScoreSummary,
  mobileData: DeviceAuditResult | null,
  desktopData: DeviceAuditResult | null
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  // Performance impact on conversion
  if (mobile.performance < 50) {
    insights.push({
      category: 'conversion',
      severity: 'critical',
      finding: `Mobile load time critically slow (${mobile.performance}/100)`,
      impact: '53% of mobile users abandon sites taking over 3 seconds. Current performance likely costing 40-60% of potential conversions.',
      opportunity: 'Prioritize Core Web Vitals optimization to recover lost revenue before competitors capture mobile traffic.',
    });
  } else if (mobile.performance < 75) {
    insights.push({
      category: 'conversion',
      severity: 'high',
      finding: `Suboptimal mobile performance (${mobile.performance}/100)`,
      impact: 'Every 1-second delay reduces conversions by 7%. Current state limiting mobile revenue potential.',
      opportunity: 'Image optimization and JavaScript deferral can improve scores 15-25 points quickly.',
    });
  }

  // Accessibility = market reach + legal
  if (mobile.accessibility < 70) {
    insights.push({
      category: 'accessibility',
      severity: 'high',
      finding: `Accessibility barriers blocking 15% of users`,
      impact: 'WCAG violations exclude users with disabilities and create ADA compliance risk. Estimated 15-20% audience loss.',
      opportunity: 'Fix contrast ratios and alt text to unlock enterprise and government contract eligibility.',
    });
  }

  // SEO visibility
  if (mobile.seo < 60) {
    insights.push({
      category: 'seo',
      severity: 'critical',
      finding: `Search visibility severely compromised`,
      impact: 'Google mobile-first indexing penalizing poor SEO. Likely ranking below competitors for key terms.',
      opportunity: 'Technical SEO fixes (meta tags, structured data) can improve visibility within 2-4 weeks.',
    });
  }

  // Trust signals
  const hasSecurityIssues = !mobileData?.bestPractices || mobile.bestPractices < 70;
  if (hasSecurityIssues) {
    insights.push({
      category: 'trust',
      severity: 'medium',
      finding: 'Security best practices incomplete',
      impact: 'Missing HTTPS headers and security policies reduce user trust. 84% of users abandon sites marked "not secure".',
      opportunity: 'Implement security headers and CSP to build user confidence and improve trust metrics.',
    });
  }

  // Retention prediction
  if (mobile.performance < 60 && mobile.accessibility < 60) {
    insights.push({
      category: 'retention',
      severity: 'high',
      finding: 'User experience friction across core metrics',
      impact: 'Combined performance and accessibility issues predict 35-45% bounce rate increase. Users unlikely to return.',
      opportunity: 'Fix foundational UX issues before investing in traffic acquisition - retention costs 5x less than acquisition.',
    });
  }

  return insights;
}

function identifyTechnicalIssuesV2(
  mobile: DeviceAuditResult | null,
  desktop: DeviceAuditResult | null
): TechnicalInsight[] {
  const issues: TechnicalInsight[] = [];

  // Extract detailed audit data
  const rawLhr = mobile?.rawLhr as { audits?: Record<string, { numericValue?: number; details?: { items?: unknown[] } }> } | undefined;
  const audits = rawLhr?.audits || {};

  // Core Web Vitals
  const lcp = audits['largest-contentful-paint'];
  if (lcp && lcp.numericValue && lcp.numericValue > 2500) {
    issues.push({
      category: 'performance',
      issue: 'Largest Contentful Paint (LCP) too slow',
      metric: 'LCP',
      threshold: '< 2.5s',
      current: `${(lcp.numericValue / 1000).toFixed(2)}s`,
      fix: 'Optimize hero image: convert to WebP/AVIF, implement responsive srcset, add fetchpriority="high"',
    });
  }

  const cls = audits['cumulative-layout-shift'];
  if (cls && cls.numericValue && cls.numericValue > 0.1) {
    issues.push({
      category: 'ux',
      issue: 'Layout shift causing visual instability',
      metric: 'CLS',
      threshold: '< 0.1',
      current: cls.numericValue.toFixed(3),
      fix: 'Reserve space for images with width/height attributes. Avoid injecting content above existing content.',
    });
  }

  const inp = audits['interaction-to-next-paint'];
  if (inp && inp.numericValue && inp.numericValue > 200) {
    issues.push({
      category: 'ux',
      issue: 'Slow interaction response',
      metric: 'INP',
      threshold: '< 200ms',
      current: `${Math.round(inp.numericValue)}ms`,
      fix: 'Break up long JavaScript tasks, defer non-critical scripts, use web workers for heavy computation.',
    });
  }

  // Resource optimization
  const renderBlocking = audits['render-blocking-resources'];
  const renderBlockingCount = renderBlocking?.details?.items?.length ?? 0;
  if (renderBlockingCount > 0) {
    issues.push({
      category: 'performance',
      issue: `${renderBlockingCount} render-blocking resources`,
      metric: 'Blocking Time',
      threshold: '0',
      current: `${renderBlockingCount} files`,
      fix: 'Add defer/async to scripts, inline critical CSS, preload key resources.',
    });
  }

  // Image optimization
  const modernFormats = audits['modern-image-formats'];
  const modernFormatsCount = modernFormats?.details?.items?.length ?? 0;
  if (modernFormatsCount > 0) {
    issues.push({
      category: 'performance',
      issue: 'Images not using modern formats',
      metric: 'Image Size',
      threshold: 'WebP/AVIF',
      current: `${modernFormatsCount} images`,
      fix: 'Convert PNG/JPEG to WebP (25-35% smaller) or AVIF (50% smaller). Implement picture element with fallbacks.',
    });
  }

  return issues;
}

function analyzeMobileFirstV2(
  mobile: DeviceAuditResult | null,
  scores: ScoreSummary
): MobileInsight {
  const coreIssues: string[] = [];
  
  if (scores.performance < 60) coreIssues.push('Critical load speed deficit');
  if (scores.accessibility < 70) coreIssues.push('Accessibility barriers blocking users');
  if (scores.seo < 70) coreIssues.push('Search visibility compromised');
  
  // Determine if mobile is primary concern
  const isPrimary = scores.overall < 75 || scores.performance < 60;
  
  let uxImpact: string;
  if (scores.performance < 40) {
    uxImpact = 'Users experience 4+ second load times. 53% abandonment rate expected. Immediate intervention required.';
  } else if (scores.performance < 70) {
    uxImpact = '3-4 second load times create friction. Users may tolerate but conversion rates suppressed 20-30%.';
  } else {
    uxImpact = 'Sub-3 second experience meets user expectations. Minor optimizations can push to excellent tier.';
  }

  return {
    priority: isPrimary ? 'primary' : 'secondary',
    score: scores.overall,
    coreIssues: coreIssues.length > 0 ? coreIssues : ['Mobile experience meets baseline standards'],
    userExperienceImpact: uxImpact,
  };
}

function generateStrategicRecommendationsV2(
  mobile: ScoreSummary,
  desktop: ScoreSummary,
  mobileData: DeviceAuditResult | null,
  desktopData: DeviceAuditResult | null,
  businessImpact: BusinessInsight[]
): StrategicRecommendation[] {
  const recommendations: StrategicRecommendation[] = [];
  let priority = 1;

  // Priority 1: Critical performance fixes
  if (mobile.performance < 50) {
    recommendations.push({
      priority: priority++,
      title: 'Emergency Mobile Performance Optimization',
      rationale: 'Mobile traffic represents 60%+ of web visits. Current load times hemorrhaging conversions.',
      effort: 'medium',
      impact: 'immediate',
      action: 'Compress images, defer non-critical JavaScript, implement lazy loading for below-fold content.',
    });
  }

  // Priority 2: Core Web Vitals
  const hasCWVIssues = mobile.performance < 75;
  if (hasCWVIssues) {
    recommendations.push({
      priority: priority++,
      title: 'Core Web Vitals Compliance',
      rationale: 'Google uses CWV as ranking factor. Poor scores directly impact search visibility.',
      effort: 'medium',
      impact: 'short-term',
      action: 'Fix LCP via image optimization, eliminate layout shifts, reduce JavaScript execution time.',
    });
  }

  // Priority 3: Accessibility
  const hasAccessibilityIssues = mobile.accessibility < 70;
  if (hasAccessibilityIssues) {
    recommendations.push({
      priority: priority++,
      title: 'Accessibility Barrier Removal',
      rationale: '15% of users have disabilities. Accessibility failures exclude market segment and create legal exposure.',
      effort: 'low',
      impact: 'immediate',
      action: 'Fix color contrast ratios, add alt text to images, ensure keyboard navigation works.',
    });
  }

  // Priority 4: SEO technical foundation
  if (mobile.seo < 70) {
    recommendations.push({
      priority: priority++,
      title: 'Technical SEO Foundation',
      rationale: 'Search visibility drives organic acquisition. Poor technical SEO limits growth ceiling.',
      effort: 'medium',
      impact: 'short-term',
      action: 'Add structured data markup, optimize meta descriptions, fix crawl errors, implement XML sitemap.',
    });
  }

  // Priority 5: Security hardening
  recommendations.push({
    priority: priority++,
    title: 'Security & Trust Signal Enhancement',
    rationale: 'Security headers and HTTPS implementation required for user trust and modern browser features.',
    effort: 'low',
    impact: 'immediate',
    action: 'Implement Content Security Policy, HSTS header, secure cookies, and referrer policy.',
  });

  return recommendations;
}

function generateExecutiveSummaryV2(
  riskLevel: RiskLevel,
  scores: ScoreSummary,
  businessImpact: BusinessInsight[],
  mobileFirst: MobileInsight
): string {
  const criticalCount = businessImpact.filter(i => i.severity === 'critical').length;
  const highCount = businessImpact.filter(i => i.severity === 'high').length;

  const parts: string[] = [];
  
  // Risk statement
  if (riskLevel === 'CRITICAL') {
    parts.push(`Your website is experiencing critical performance degradation that's actively costing conversions.`);
  } else if (riskLevel === 'HIGH') {
    parts.push(`Significant technical issues are suppressing your website's business potential.`);
  } else if (riskLevel === 'MEDIUM') {
    parts.push(`Your website performs adequately but has clear optimization opportunities.`);
  } else {
    parts.push(`Your website demonstrates strong technical fundamentals with minor refinement opportunities.`);
  }

  // Mobile-first context
  parts.push(`Mobile performance score: ${scores.performance}/100. ${mobileFirst.userExperienceImpact}`);

  // Issue summary
  if (criticalCount > 0 || highCount > 0) {
    parts.push(`${criticalCount} critical and ${highCount} high-priority issues identified.`);
  }

  // Action orientation
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    parts.push(`Immediate action recommended. Addressing top 3 issues can improve overall score 20-35 points.`);
  } else {
    parts.push(`Strategic optimizations can push performance to excellent tier (90+).`);
  }

  return parts.join(' ');
}

/**
 * Check if analysis requires immediate attention
 */
export function needsAttentionV2(analysis: IntelligenceAnalysis): boolean {
  return analysis.riskLevel === 'CRITICAL' || analysis.riskLevel === 'HIGH';
}

/**
 * Format intelligence for API response with mobile-first emphasis
 */
export function formatIntelligenceForResponseV2(
  analysis: IntelligenceAnalysis
): Record<string, unknown> {
  return {
    riskLevel: analysis.riskLevel,
    executiveSummary: analysis.executiveSummary,
    mobileFirst: {
      priority: analysis.mobileFirst.priority,
      score: analysis.mobileFirst.score,
      issues: analysis.mobileFirst.coreIssues,
      experienceImpact: analysis.mobileFirst.userExperienceImpact,
    },
    businessImpact: analysis.businessImpact.map(insight => ({
      category: insight.category,
      severity: insight.severity,
      finding: insight.finding,
      impact: insight.impact,
      opportunity: insight.opportunity,
    })),
    technicalIssues: analysis.technicalIssues.map(issue => ({
      category: issue.category,
      issue: issue.issue,
      metric: issue.metric,
      current: issue.current,
      threshold: issue.threshold,
      fix: issue.fix,
    })),
    strategicRecommendations: analysis.strategicRecommendations.map(rec => ({
      priority: rec.priority,
      title: rec.title,
      rationale: rec.rationale,
      effort: rec.effort,
      impact: rec.impact,
      action: rec.action,
    })),
  };
}
