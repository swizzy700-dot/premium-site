/**
 * Website Analysis Engine
 * Transforms raw Google PageSpeed data into business insights
 * Converts metrics into meaning, problems into opportunities
 */

import {
  AuditResponse,
  DeviceAudit,
  AuditScores,
  ScoreDetail,
  LighthouseScoreKey,
  CoreWebVitals,
  MetricDetail,
} from "./types";

/**
 * Business impact levels
 */
export type ImpactLevel = "critical" | "high" | "medium" | "low";

/**
 * Priority categories for fixes
 */
export type FixCategory = "speed" | "seo" | "mobile" | "ux" | "technical";

/**
 * Complete business analysis report
 */
export interface BusinessAnalysis {
  executiveSummary: ExecutiveSummary;
  performanceAnalysis: PerformanceAnalysis;
  businessImpact: BusinessImpact;
  fixRoadmap: FixRoadmap;
  competitiveContext: CompetitiveContext;
  generatedAt: string;
  url: string;
}

/**
 * High-level summary for decision makers
 */
export interface ExecutiveSummary {
  headline: string;
  subheadline: string;
  overallGrade: string;
  criticalIssues: number;
  opportunities: number;
  estimatedImpact: string;
  keyTakeaway: string;
}

/**
 * Deep performance analysis
 */
export interface PerformanceAnalysis {
  speed: CategoryAnalysis;
  seo: CategoryAnalysis;
  accessibility: CategoryAnalysis;
  bestPractices: CategoryAnalysis;
  mobileExperience: MobileAnalysis;
}

/**
 * Per-category analysis
 */
export interface CategoryAnalysis {
  score: number;
  grade: string;
  status: "excellent" | "good" | "needs-improvement" | "poor";
  businessMeaning: string;
  userImpact: string;
  revenueImpact: string;
  topIssues: IssueDetail[];
}

/**
 * Mobile-specific analysis
 */
export interface MobileAnalysis {
  score: number;
  vsDesktop: "better" | "worse" | "similar";
  businessCritical: boolean;
  mobileRevenueRisk: string;
  keyProblems: string[];
}

/**
 * Issue with business context
 */
export interface IssueDetail {
  title: string;
  description: string;
  technicalDetail: string;
  businessImpact: string;
  impactLevel: ImpactLevel;
  fixCategory: FixCategory;
  estimatedFixTime: string;
  potentialUplift: string;
}

/**
 * Business impact calculations
 */
export interface BusinessImpact {
  conversionRisk: ImpactAssessment;
  seoVisibilityRisk: ImpactAssessment;
  userExperienceRisk: ImpactAssessment;
  mobileRevenueRisk: ImpactAssessment;
  overallRiskLevel: "low" | "moderate" | "high" | "critical";
  opportunitySummary: string;
}

/**
 * Single impact assessment
 */
export interface ImpactAssessment {
  level: ImpactLevel;
  explanation: string;
  estimatedLoss?: string;
  potentialGain?: string;
}

/**
 * Actionable fix roadmap
 */
export interface FixRoadmap {
  quickWins: FixItem[];
  shortTerm: FixItem[];
  strategic: FixItem[];
  estimatedTimeline: string;
  totalInvestmentEstimate: string;
  expectedROI: string;
}

/**
 * Single fix item
 */
export interface FixItem {
  id: string;
  title: string;
  description: string;
  category: FixCategory;
  impact: ImpactLevel;
  effort: "small" | "medium" | "large";
  estimatedTime: string;
  businessValue: string;
  technicalSteps: string[];
}

/**
 * Competitive positioning
 */
export interface CompetitiveContext {
  performancePercentile: string;
  vsIndustryAverage: "above" | "below" | "at";
  mobileRanking: string;
  seoCompetitiveness: string;
  competitiveAdvantage: string[];
  competitiveGaps: string[];
}

/**
 * Transform raw audit into business analysis
 */
export function analyzeBusinessImpact(
  audit: AuditResponse,
  url: string
): BusinessAnalysis {
  const desktop = audit.desktop;
  const mobile = audit.mobile;

  // Use best available data (prefer mobile for business impact)
  const primary = mobile || desktop;
  const secondary = desktop || mobile;

  if (!primary) {
    // Return safe fallback analysis instead of crashing
    return createFallbackAnalysis(url);
  }

  return {
    executiveSummary: generateExecutiveSummary(primary, secondary, url),
    performanceAnalysis: generatePerformanceAnalysis(primary, secondary),
    businessImpact: calculateBusinessImpact(primary, secondary),
    fixRoadmap: generateFixRoadmap(primary),
    competitiveContext: generateCompetitiveContext(primary, secondary),
    generatedAt: new Date().toISOString(),
    url,
  };
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(
  primary: DeviceAudit,
  secondary: DeviceAudit | null,
  url: string
): ExecutiveSummary {
  const scores = primary.scores;
  const worstScore = Math.min(
    scores.performance.score,
    scores.seo.score,
    scores.accessibility.score,
    scores["best-practices"].score
  );

  const criticalCount = countCriticalIssues(primary);
  const domain = new URL(url).hostname.replace(/^www\./, "");

  let headline: string;
  let subheadline: string;
  let takeaway: string;

  if (worstScore < 50) {
    headline = `${domain} is losing qualified visitors due to critical performance issues`;
    subheadline = "Your website's technical problems are directly impacting revenue and search visibility";
    takeaway = "Immediate action required: fixing the top 3 issues could improve conversions by 15-25%";
  } else if (worstScore < 75) {
    headline = `${domain} has significant room for improvement to maximize conversions`;
    subheadline = "While functional, your website is underperforming compared to competitors in key areas";
    takeaway = "Strategic improvements could increase qualified leads by 20-35% within 60 days";
  } else if (worstScore < 90) {
    headline = `${domain} is performing well but missing key optimization opportunities`;
    subheadline = "Your foundation is solid, but targeted improvements can push you ahead of competitors";
    takeaway = "Fine-tuning specific areas could improve user experience and capture more market share";
  } else {
    headline = `${domain} is excelling across all key performance areas`;
    subheadline = "Your website meets high standards - maintain and leverage this competitive advantage";
    takeaway = "Focus on continuous optimization to stay ahead as standards evolve";
  }

  return {
    headline,
    subheadline,
    overallGrade: calculateOverallGrade(scores),
    criticalIssues: criticalCount,
    opportunities: countOpportunities(primary),
    estimatedImpact: calculateEstimatedImpact(scores),
    keyTakeaway: takeaway,
  };
}

/**
 * Generate detailed performance analysis
 */
function generatePerformanceAnalysis(
  primary: DeviceAudit,
  secondary: DeviceAudit | null
): PerformanceAnalysis {
  return {
    speed: analyzeSpeed(primary.scores.performance, primary.metrics),
    seo: analyzeSEO(primary.scores.seo),
    accessibility: analyzeAccessibility(primary.scores.accessibility),
    bestPractices: analyzeBestPractices(primary.scores["best-practices"]),
    mobileExperience: analyzeMobile(primary, secondary),
  };
}

/**
 * Analyze speed metrics
 */
function analyzeSpeed(score: ScoreDetail, metrics: CoreWebVitals | null): CategoryAnalysis {
  const lcp = metrics?.lcp;
  const cls = metrics?.cls;
  const tbt = metrics?.tbt;

  const issues: IssueDetail[] = [];

  if (lcp && lcp.severity !== "good") {
    issues.push({
      title: "Slow Largest Contentful Paint",
      description: "Your main content takes too long to become visible",
      technicalDetail: `LCP: ${lcp.formatted} (should be < 2.5s)`,
      businessImpact: "Users leave before seeing your offer. 53% abandon after 3s.",
      impactLevel: lcp.severity === "poor" ? "critical" : "high",
      fixCategory: "speed",
      estimatedFixTime: "2-4 hours",
      potentialUplift: "15-20% conversion improvement",
    });
  }

  if (cls && cls.severity !== "good") {
    issues.push({
      title: "Layout Shift Problems",
      description: "Page elements jump around while loading",
      technicalDetail: `CLS: ${cls.formatted} (should be < 0.1)`,
      businessImpact: "Users lose trust, especially during checkout. Reduces form completions by 20%.",
      impactLevel: cls.severity === "poor" ? "high" : "medium",
      fixCategory: "ux",
      estimatedFixTime: "3-6 hours",
      potentialUplift: "10-15% form completion increase",
    });
  }

  if (tbt && tbt.severity !== "good") {
    issues.push({
      title: "JavaScript Blocking Interactions",
      description: "Heavy scripts prevent user interaction",
      technicalDetail: `TBT: ${tbt.formatted}`,
      businessImpact: "Users think your site is broken. Increases bounce rate significantly.",
      impactLevel: tbt.severity === "poor" ? "high" : "medium",
      fixCategory: "technical",
      estimatedFixTime: "4-8 hours",
      potentialUplift: "12-18% engagement improvement",
    });
  }

  return {
    score: score.score,
    grade: score.label,
    status: getStatusFromScore(score.score),
    businessMeaning: getSpeedBusinessMeaning(score.score),
    userImpact: getSpeedUserImpact(score.score),
    revenueImpact: getSpeedRevenueImpact(score.score),
    topIssues: issues.slice(0, 3),
  };
}

/**
 * Analyze SEO metrics
 */
function analyzeSEO(score: ScoreDetail): CategoryAnalysis {
  return {
    score: score.score,
    grade: score.label,
    status: getStatusFromScore(score.score),
    businessMeaning: getSEOBusinessMeaning(score.score),
    userImpact: getSEOUserImpact(score.score),
    revenueImpact: getSEORevenueImpact(score.score),
    topIssues: [], // Would be populated from detailed SEO audit
  };
}

/**
 * Analyze accessibility
 */
function analyzeAccessibility(score: ScoreDetail): CategoryAnalysis {
  return {
    score: score.score,
    grade: score.label,
    status: getStatusFromScore(score.score),
    businessMeaning: getAccessibilityBusinessMeaning(score.score),
    userImpact: getAccessibilityUserImpact(score.score),
    revenueImpact: getAccessibilityRevenueImpact(score.score),
    topIssues: [],
  };
}

/**
 * Analyze best practices
 */
function analyzeBestPractices(score: ScoreDetail): CategoryAnalysis {
  return {
    score: score.score,
    grade: score.label,
    status: getStatusFromScore(score.score),
    businessMeaning: getBestPracticesBusinessMeaning(score.score),
    userImpact: getBestPracticesUserImpact(score.score),
    revenueImpact: getBestPracticesRevenueImpact(score.score),
    topIssues: [],
  };
}

/**
 * Analyze mobile experience
 */
function analyzeMobile(
  primary: DeviceAudit,
  secondary: DeviceAudit | null
): MobileAnalysis {
  const isMobilePrimary = primary === secondary; // Simplified check

  if (!secondary) {
    return {
      score: primary.scores.performance.score,
      vsDesktop: "similar",
      businessCritical: true,
      mobileRevenueRisk: "60-70% of traffic is mobile. Poor mobile = lost revenue.",
      keyProblems: ["Mobile performance directly impacts conversion rates"],
    };
  }

  const mobileScore = primary.scores.performance.score;
  const desktopScore = secondary.scores.performance.score;
  const diff = mobileScore - desktopScore;

  return {
    score: mobileScore,
    vsDesktop: diff > 10 ? "better" : diff < -10 ? "worse" : "similar",
    businessCritical: mobileScore < 75,
    mobileRevenueRisk: mobileScore < 60
      ? "Critical: Mobile users abandoning due to slow load times"
      : mobileScore < 75
      ? "High: Mobile experience suboptimal, losing qualified leads"
      : "Moderate: Mobile functional but not optimized",
    keyProblems: diff < -15
      ? ["Mobile significantly slower than desktop", "Mobile users getting degraded experience"]
      : ["Mobile performance needs optimization"],
  };
}

/**
 * Calculate overall business impact
 */
function calculateBusinessImpact(
  primary: DeviceAudit,
  secondary: DeviceAudit | null
): BusinessImpact {
  const scores = primary.scores;
  const perf = scores.performance.score;
  const seo = scores.seo.score;

  let overallRisk: "low" | "moderate" | "high" | "critical" = "low";
  if (perf < 50 || seo < 50) overallRisk = "critical";
  else if (perf < 75 || seo < 75) overallRisk = "high";
  else if (perf < 90 || seo < 90) overallRisk = "moderate";

  return {
    conversionRisk: assessConversionRisk(perf),
    seoVisibilityRisk: assessSEOVisibilityRisk(seo),
    userExperienceRisk: assessUXRisk(scores.accessibility.score, perf),
    mobileRevenueRisk: assessMobileRevenueRisk(
      primary.scores.performance.score,
      secondary?.scores.performance.score
    ),
    overallRiskLevel: overallRisk,
    opportunitySummary: generateOpportunitySummary(overallRisk),
  };
}

/**
 * Generate fix roadmap
 */
function generateFixRoadmap(primary: DeviceAudit): FixRoadmap {
  const quickWins: FixItem[] = [];
  const shortTerm: FixItem[] = [];
  const strategic: FixItem[] = [];

  // Analyze metrics and populate fixes
  const metrics = primary.metrics;

  if (metrics?.lcp?.severity !== "good") {
    quickWins.push({
      id: "optimize-images",
      title: "Optimize Images",
      description: "Compress and properly size images",
      category: "speed",
      impact: "high",
      effort: "small",
      estimatedTime: "2-4 hours",
      businessValue: "15-20% faster load times",
      technicalSteps: [
        "Compress all images to WebP format",
        "Implement lazy loading",
        "Add responsive image sizes",
      ],
    });
  }

  if (metrics?.cls?.severity !== "good") {
    shortTerm.push({
      id: "fix-layout-shifts",
      title: "Fix Layout Stability",
      description: "Prevent content from jumping during load",
      category: "ux",
      impact: "high",
      effort: "medium",
      estimatedTime: "4-6 hours",
      businessValue: "10-15% improvement in user trust",
      technicalSteps: [
        "Add size attributes to images",
        "Reserve space for ads/embeds",
        "Load fonts properly",
      ],
    });
  }

  if (metrics?.tbt?.severity !== "good") {
    strategic.push({
      id: "reduce-javascript",
      title: "Reduce JavaScript Blocking",
      description: "Optimize script loading and execution",
      category: "technical",
      impact: "medium",
      effort: "large",
      estimatedTime: "1-2 weeks",
      businessValue: "12-18% better interactivity",
      technicalSteps: [
        "Code split bundles",
        "Defer non-critical scripts",
        "Implement tree shaking",
      ],
    });
  }

  return {
    quickWins,
    shortTerm,
    strategic,
    estimatedTimeline: calculateTimeline(quickWins, shortTerm, strategic),
    totalInvestmentEstimate: calculateInvestment(quickWins, shortTerm, strategic),
    expectedROI: calculateROI(quickWins, shortTerm, strategic),
  };
}

/**
 * Generate competitive context
 */
function generateCompetitiveContext(
  primary: DeviceAudit,
  secondary: DeviceAudit | null
): CompetitiveContext {
  const perf = primary.scores.performance.score;

  return {
    performancePercentile: perf > 90 ? "Top 10%" : perf > 75 ? "Top 25%" : perf > 50 ? "Top 50%" : "Bottom 50%",
    vsIndustryAverage: perf > 75 ? "above" : perf > 50 ? "at" : "below",
    mobileRanking: "Mobile-first indexing required",
    seoCompetitiveness: primary.scores.seo.score > 80 ? "Strong" : "Needs improvement",
    competitiveAdvantage: perf > 85
      ? ["Fast load times", "Good user experience", "Strong technical foundation"]
      : [],
    competitiveGaps: perf < 75
      ? ["Slower than competitors", "Poor mobile experience", "Technical debt"]
      : [],
  };
}

// Helper functions

function getStatusFromScore(score: number): "excellent" | "good" | "needs-improvement" | "poor" {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 50) return "needs-improvement";
  return "poor";
}

function calculateOverallGrade(scores: AuditScores): string {
  const avg = Object.values(scores).reduce((sum, s) => sum + s.score, 0) / 4;
  if (avg >= 90) return "A";
  if (avg >= 80) return "B";
  if (avg >= 70) return "C";
  if (avg >= 60) return "D";
  return "F";
}

function countCriticalIssues(audit: DeviceAudit): number {
  let count = 0;
  Object.values(audit.scores).forEach((score) => {
    if (score.score < 50) count++;
  });
  if (audit.metrics?.lcp?.severity === "poor") count++;
  if (audit.metrics?.cls?.severity === "poor") count++;
  return count;
}

function countOpportunities(audit: DeviceAudit): number {
  let count = 0;
  Object.values(audit.scores).forEach((score) => {
    if (score.score < 90) count++;
  });
  return count;
}

function calculateEstimatedImpact(scores: AuditScores): string {
  const min = Math.min(
    scores.performance.score,
    scores.seo.score,
    scores.accessibility.score,
    scores["best-practices"].score
  );

  if (min < 50) return "Potential 25-40% improvement in conversions";
  if (min < 75) return "Potential 15-25% improvement in conversions";
  if (min < 90) return "Potential 5-15% improvement in conversions";
  return "Maintain current performance to preserve advantage";
}

function getSpeedBusinessMeaning(score: number): string {
  if (score >= 90) return "Your website loads instantly, keeping users engaged";
  if (score >= 75) return "Good speed, but faster sites capture more market share";
  if (score >= 50) return "Slow loading is causing visitors to leave before converting";
  return "Critical speed issues are severely impacting your business";
}

function getSpeedUserImpact(score: number): string {
  if (score >= 90) return "Users can interact immediately - zero friction";
  if (score >= 75) return "Minor delays may cause some impatience";
  if (score >= 50) return "Users experience noticeable frustration waiting for content";
  return "Most users abandon before the page finishes loading";
}

function getSpeedRevenueImpact(score: number): string {
  if (score >= 90) return "Maximized conversion potential - every millisecond optimized";
  if (score >= 75) return "Losing 5-10% of potential revenue to slow load times";
  if (score >= 50) return "Losing 20-30% of potential revenue to poor performance";
  return "Critical revenue loss - 40%+ of mobile users never see your offer";
}

function getSEOBusinessMeaning(score: number): string {
  if (score >= 90) return "Excellent search visibility - capturing maximum organic traffic";
  if (score >= 75) return "Good SEO foundation with room to outrank competitors";
  if (score >= 50) return "SEO gaps limiting organic reach and discoverability";
  return "Critical SEO issues preventing search engine visibility";
}

function getSEOUserImpact(score: number): string {
  if (score >= 90) return "Users find you easily through search";
  if (score >= 75) return "Decent visibility but missing opportunities";
  if (score >= 50) return "Harder to find = fewer qualified visitors";
  return "Essentially invisible to search engines";
}

function getSEORevenueImpact(score: number): string {
  if (score >= 90) return "Capturing maximum qualified organic traffic";
  if (score >= 75) return "Missing 20-30% of potential organic revenue";
  if (score >= 50) return "Losing 40-60% of search-driven revenue opportunities";
  return "Near-zero organic traffic = massive revenue loss";
}

function getAccessibilityBusinessMeaning(score: number): string {
  if (score >= 90) return "Inclusive design expands your market reach";
  if (score >= 75) return "Good accessibility with minor barriers";
  if (score >= 50) return "Accessibility barriers excluding potential customers";
  return "Significant accessibility issues limiting audience";
}

function getAccessibilityUserImpact(score: number): string {
  if (score >= 90) return "All users can access your services equally";
  if (score >= 75) return "Most users can navigate, some face challenges";
  if (score >= 50) return "Users with disabilities struggle to complete actions";
  return "Many users completely unable to use your site";
}

function getAccessibilityRevenueImpact(score: number): string {
  if (score >= 90) return "Maximum market reach - no exclusions";
  if (score >= 75) return "Missing 10-15% of potential market (disabilities)";
  if (score >= 50) return "Excluding 20-25% of potential customers";
  return "Significant market exclusion - legal risk in many jurisdictions";
}

function getBestPracticesBusinessMeaning(score: number): string {
  if (score >= 90) return "Industry-leading technical implementation";
  if (score >= 75) return "Solid technical foundation";
  if (score >= 50) return "Technical debt accumulating";
  return "Outdated practices causing security/reliability issues";
}

function getBestPracticesUserImpact(score: number): string {
  if (score >= 90) return "Secure, reliable, modern experience";
  if (score >= 75) return "Generally secure with minor issues";
  if (score >= 50) return "Users may encounter security warnings";
  return "Users at risk - security vulnerabilities present";
}

function getBestPracticesRevenueImpact(score: number): string {
  if (score >= 90) return "Maximum trust and credibility";
  if (score >= 75) return "Good trust signals";
  if (score >= 50) return "Trust erosion affecting conversions";
  return "Security issues directly impacting credibility and sales";
}

function assessConversionRisk(perfScore: number): ImpactAssessment {
  if (perfScore >= 90) {
    return {
      level: "low",
      explanation: "Fast site maximizes conversion potential",
    };
  }
  if (perfScore >= 75) {
    return {
      level: "medium",
      explanation: "Some users abandoning due to wait times",
      estimatedLoss: "5-10% of potential conversions",
      potentialGain: "Could improve conversions by 10-15%",
    };
  }
  if (perfScore >= 50) {
    return {
      level: "high",
      explanation: "Significant abandonment during load",
      estimatedLoss: "20-30% of potential conversions",
      potentialGain: "Could improve conversions by 25-35%",
    };
  }
  return {
    level: "critical",
    explanation: "Most users never see your offer",
    estimatedLoss: "40-50% of potential conversions",
    potentialGain: "Could double conversion rates",
  };
}

function assessSEOVisibilityRisk(seoScore: number): ImpactAssessment {
  if (seoScore >= 90) {
    return {
      level: "low",
      explanation: "Excellent search visibility",
    };
  }
  if (seoScore >= 75) {
    return {
      level: "medium",
      explanation: "Missing some ranking opportunities",
      estimatedLoss: "20-30% of organic traffic potential",
    };
  }
  if (seoScore >= 50) {
    return {
      level: "high",
      explanation: "Poor visibility in search results",
      estimatedLoss: "50-70% of organic traffic potential",
    };
  }
  return {
    level: "critical",
    explanation: "Essentially invisible to search engines",
    estimatedLoss: "80%+ of organic traffic potential",
  };
}

function assessUXRisk(accessibilityScore: number, perfScore: number): ImpactAssessment {
  const min = Math.min(accessibilityScore, perfScore);
  if (min >= 90) {
    return {
      level: "low",
      explanation: "Excellent user experience across all audiences",
    };
  }
  if (min >= 75) {
    return {
      level: "medium",
      explanation: "Minor friction points affecting some users",
    };
  }
  if (min >= 50) {
    return {
      level: "high",
      explanation: "Significant barriers for many users",
      estimatedLoss: "20-25% of potential engagement",
    };
  }
  return {
    level: "critical",
    explanation: "Severe experience issues preventing usage",
    estimatedLoss: "40%+ of potential users excluded",
  };
}

function assessMobileRevenueRisk(
  mobileScore: number,
  desktopScore?: number
): ImpactAssessment {
  if (mobileScore >= 90) {
    return {
      level: "low",
      explanation: "Mobile experience optimized for conversions",
    };
  }
  if (mobileScore >= 75) {
    return {
      level: "medium",
      explanation: "Mobile functional but not competitive",
      estimatedLoss: "15-20% of mobile revenue potential",
    };
  }
  if (mobileScore >= 50) {
    return {
      level: "high",
      explanation: "Poor mobile experience driving away customers",
      estimatedLoss: "30-45% of mobile revenue potential",
    };
  }
  return {
    level: "critical",
    explanation: "Mobile users abandoning immediately",
    estimatedLoss: "60-70% of mobile traffic (majority of users)",
  };
}

function generateOpportunitySummary(riskLevel: string): string {
  const summaries: Record<string, string> = {
    low: "Maintain and optimize to stay competitive",
    moderate: "Strategic improvements can capture significant market share",
    high: "Major opportunity to outpace competitors and increase revenue",
    critical: "Immediate action required to prevent continued revenue loss",
  };
  return summaries[riskLevel] || "Opportunity assessment required";
}

function calculateTimeline(
  quickWins: FixItem[],
  shortTerm: FixItem[],
  strategic: FixItem[]
): string {
  const weeks = Math.ceil(
    (quickWins.length * 0.5 + shortTerm.length * 1 + strategic.length * 2) / 5
  );
  return weeks <= 1 ? "1 week" : `${weeks} weeks`;
}

function calculateInvestment(
  quickWins: FixItem[],
  shortTerm: FixItem[],
  strategic: FixItem[]
): string {
  const hours =
    quickWins.reduce((sum, f) => sum + (f.effort === "small" ? 4 : 8), 0) +
    shortTerm.reduce((sum, f) => sum + (f.effort === "medium" ? 16 : 24), 0) +
    strategic.reduce((sum, f) => sum + (f.effort === "large" ? 40 : 60), 0);

  const cost = hours * 150; // $150/hour estimate
  return `$${cost.toLocaleString()} - $${(cost * 1.3).toLocaleString()}`;
}

function calculateROI(
  quickWins: FixItem[],
  shortTerm: FixItem[],
  strategic: FixItem[]
): string {
  const totalItems = quickWins.length + shortTerm.length + strategic.length;
  if (totalItems === 0) return "N/A - No fixes required";
  return "300-500% within 6 months";
}

/**
 * Safe fallback analysis when no audit data is available
 * NEVER crashes - always returns valid BusinessAnalysis
 */
function createFallbackAnalysis(url: string): BusinessAnalysis {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  
  return {
    executiveSummary: {
      headline: `${domain} analysis temporarily unavailable`,
      subheadline: "We couldn't retrieve performance data at this time",
      overallGrade: "N/A",
      criticalIssues: 0,
      opportunities: 0,
      estimatedImpact: "Analysis unavailable",
      keyTakeaway: "Please try again in a few moments",
    },
    performanceAnalysis: {
      speed: {
        score: 0,
        grade: "N/A",
        status: "poor",
        businessMeaning: "Performance data unavailable",
        userImpact: "Unable to assess user impact",
        revenueImpact: "Unable to assess revenue impact",
        topIssues: [],
      },
      seo: {
        score: 0,
        grade: "N/A",
        status: "poor",
        businessMeaning: "SEO data unavailable",
        userImpact: "Unable to assess user impact",
        revenueImpact: "Unable to assess revenue impact",
        topIssues: [],
      },
      accessibility: {
        score: 0,
        grade: "N/A",
        status: "poor",
        businessMeaning: "Accessibility data unavailable",
        userImpact: "Unable to assess user impact",
        revenueImpact: "Unable to assess revenue impact",
        topIssues: [],
      },
      bestPractices: {
        score: 0,
        grade: "N/A",
        status: "poor",
        businessMeaning: "Best practices data unavailable",
        userImpact: "Unable to assess user impact",
        revenueImpact: "Unable to assess revenue impact",
        topIssues: [],
      },
      mobileExperience: {
        score: 0,
        vsDesktop: "similar",
        businessCritical: true,
        mobileRevenueRisk: "Unable to assess - data unavailable",
        keyProblems: ["Mobile analysis failed"],
      },
    },
    businessImpact: {
      conversionRisk: {
        level: "medium",
        explanation: "Unable to assess conversion risk - analysis incomplete",
      },
      seoVisibilityRisk: {
        level: "medium",
        explanation: "Unable to assess SEO risk - analysis incomplete",
      },
      userExperienceRisk: {
        level: "medium",
        explanation: "Unable to assess UX risk - analysis incomplete",
      },
      mobileRevenueRisk: {
        level: "medium",
        explanation: "Unable to assess mobile risk - analysis incomplete",
      },
      overallRiskLevel: "moderate",
      opportunitySummary: "Analysis temporarily unavailable - please retry",
    },
    fixRoadmap: {
      quickWins: [],
      shortTerm: [],
      strategic: [],
      estimatedTimeline: "Unable to estimate",
      totalInvestmentEstimate: "Unable to estimate",
      expectedROI: "Unable to calculate",
    },
    competitiveContext: {
      performancePercentile: "Unable to determine",
      vsIndustryAverage: "at",
      mobileRanking: "Unable to determine",
      seoCompetitiveness: "Unable to determine",
      competitiveAdvantage: [],
      competitiveGaps: ["Analysis data unavailable"],
    },
    generatedAt: new Date().toISOString(),
    url,
  };
}
