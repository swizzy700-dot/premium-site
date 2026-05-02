import type { DeviceAuditResult } from '../workers/lighthouse.worker.js';
export interface AIInsight {
    category: 'performance' | 'seo' | 'accessibility' | 'best-practices' | 'ux';
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
}
export interface AIAnalysisResult {
    insights: AIInsight[];
    summary: string;
    priorityFixes: AIInsight[];
    strengths: string[];
    weaknesses: string[];
}
export declare class AIService {
    private openai;
    constructor();
    analyzeAudit(url: string, scores: DeviceAuditResult, pageTitle: string): Promise<AIAnalysisResult>;
    private buildPrompt;
    private getMockAnalysis;
}
export declare const aiService: AIService;
//# sourceMappingURL=ai.service.d.ts.map