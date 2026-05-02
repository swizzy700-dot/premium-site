import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { AuditError, ErrorCodes } from '../utils/errorHandler.js';
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

export class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async analyzeAudit(
    url: string,
    scores: DeviceAuditResult,
    pageTitle: string
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();

    try {
      logger.info(`Starting AI analysis for: ${url}`);

      if (!this.openai) {
        logger.warn('OpenAI not configured, returning mock analysis');
        return this.getMockAnalysis(scores);
      }

      const prompt = this.buildPrompt(url, scores, pageTitle);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a web performance and SEO expert. Analyze the Lighthouse audit results and provide structured insights.

Return ONLY a JSON object in this exact format:
{
  "summary": "Brief overall assessment (2-3 sentences)",
  "insights": [
    {
      "category": "performance|seo|accessibility|best-practices|ux",
      "title": "Issue title",
      "description": "Detailed explanation",
      "severity": "high|medium|low",
      "recommendation": "Specific action to take"
    }
  ],
  "strengths": ["List of what's working well"],
  "weaknesses": ["List of critical issues"]
}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new AuditError({
          message: 'AI returned empty response',
          code: ErrorCodes.AI_ANALYSIS_FAILED,
          retryable: true,
        });
      }

      const parsed = JSON.parse(content) as {
        summary: string;
        insights: AIInsight[];
        strengths: string[];
        weaknesses: string[];
      };

      // Sort insights by severity
      const sortedInsights = parsed.insights.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      // Extract high priority fixes
      const priorityFixes = sortedInsights.filter(i => i.severity === 'high').slice(0, 5);

      const duration = Date.now() - startTime;
      logger.info(`AI analysis completed`, { url, duration, insightsCount: sortedInsights.length });

      return {
        insights: sortedInsights,
        summary: parsed.summary,
        priorityFixes,
        strengths: parsed.strengths.slice(0, 5),
        weaknesses: parsed.weaknesses.slice(0, 5),
      };
    } catch (error) {
      if (error instanceof AuditError) {
        throw error;
      }

      if (error instanceof Error && error.message.includes('timeout')) {
        throw new AuditError({
          message: 'AI analysis timeout',
          code: ErrorCodes.AI_TIMEOUT,
          retryable: true,
          cause: error,
        });
      }

      logger.error('AI analysis failed', { url, error: (error as Error).message });

      // Return mock analysis on error
      return this.getMockAnalysis(scores);
    }
  }

  private buildPrompt(url: string, scores: DeviceAuditResult, pageTitle: string): string {
    return `Analyze this website audit:

URL: ${url}
Title: ${pageTitle}

Lighthouse Scores (0-100):
- Performance: ${scores.performance}
- SEO: ${scores.seo}
- Accessibility: ${scores.accessibility}
- Best Practices: ${scores.bestPractices}

Provide insights based on these scores. Score interpretation:
- 90-100: Excellent
- 80-89: Good, minor improvements needed
- 70-79: Fair, noticeable issues
- 50-69: Poor, significant problems
- 0-49: Critical, major overhaul needed`;
  }

  private getMockAnalysis(scores: DeviceAuditResult): AIAnalysisResult {
    const insights: AIInsight[] = [];

    if (scores.performance < 70) {
      insights.push({
        category: 'performance',
        title: 'Slow Performance Detected',
        description: `Performance score of ${scores.performance} indicates slow loading times that may impact user experience and SEO rankings.`,
        severity: scores.performance < 50 ? 'high' : 'medium',
        recommendation: 'Optimize images, minify CSS/JS, enable compression, and implement lazy loading.',
      });
    }

    if (scores.seo < 80) {
      insights.push({
        category: 'seo',
        title: 'SEO Issues Found',
        description: `SEO score of ${scores.seo} suggests missing or incorrect meta tags, structured data issues, or content optimization problems.`,
        severity: scores.seo < 60 ? 'high' : 'medium',
        recommendation: 'Add proper meta descriptions, title tags, and implement schema markup.',
      });
    }

    if (scores.accessibility < 80) {
      insights.push({
        category: 'accessibility',
        title: 'Accessibility Barriers',
        description: `Accessibility score of ${scores.accessibility} indicates the site may be difficult to use for people with disabilities.`,
        severity: scores.accessibility < 60 ? 'high' : 'medium',
        recommendation: 'Add alt text to images, ensure proper color contrast, and improve keyboard navigation.',
      });
    }

    if (scores.bestPractices < 80) {
      insights.push({
        category: 'best-practices',
        title: 'Security & Best Practice Issues',
        description: `Best practices score of ${scores.bestPractices} suggests security vulnerabilities or outdated practices.`,
        severity: 'medium',
        recommendation: 'Update to HTTPS, use secure cookies, and remove console logs.',
      });
    }

    // Add positive insights
    if (scores.performance >= 90) {
      insights.push({
        category: 'performance',
        title: 'Excellent Performance',
        description: 'The site loads quickly and provides a smooth user experience.',
        severity: 'low',
        recommendation: 'Maintain current optimization practices.',
      });
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (scores.performance >= 80) strengths.push('Fast page loading speed');
    else weaknesses.push('Slow performance affecting user experience');

    if (scores.seo >= 80) strengths.push('Good SEO foundation');
    else weaknesses.push('SEO issues limiting search visibility');

    if (scores.accessibility >= 80) strengths.push('Accessible design');
    else weaknesses.push('Accessibility barriers for some users');

    if (scores.bestPractices >= 80) strengths.push('Follows web best practices');
    else weaknesses.push('Security or best practice concerns');

    return {
      insights,
      summary: `This website scores ${scores.performance}/100 for performance, ${scores.seo}/100 for SEO, ${scores.accessibility}/100 for accessibility, and ${scores.bestPractices}/100 for best practices. ${weaknesses.length > 0 ? 'Key issues need attention in ' + weaknesses.join(', ') + '.' : 'Overall, the site follows good practices.'}`,
      priorityFixes: insights.filter(i => i.severity === 'high'),
      strengths,
      weaknesses,
    };
  }
}

export const aiService = new AIService();
