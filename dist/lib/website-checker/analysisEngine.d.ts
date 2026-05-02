/**
 * Website Analysis Engine
 * Transforms raw Google PageSpeed data into business insights
 * Converts metrics into meaning, problems into opportunities
 */
import { AuditResponse } from "./types";
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
export declare function analyzeBusinessImpact(audit: AuditResponse, url: string): BusinessAnalysis;
//# sourceMappingURL=analysisEngine.d.ts.map