export type LighthouseScoreLabel = "Excellent" | "Good" | "Needs Improvement" | "Poor";
export type LighthouseScoreKey = "performance" | "seo" | "accessibility" | "best-practices";
export type LighthouseClientAudit = {
    url: string;
    businessName?: string;
    generatedAt: number;
    source: "pagespeed_insights";
    scores: Record<LighthouseScoreKey, {
        score: number;
        label: LighthouseScoreLabel;
        color: "green" | "yellow" | "red" | "blue";
        shortExplanation: string;
    }>;
    overallExplanation: string;
    keyDiagnostics: {
        lcp?: {
            formatted: string;
            severity: "good" | "warning" | "bad";
        };
        cls?: {
            formatted: string;
            severity: "good" | "warning" | "bad";
        };
        tbt?: {
            formatted: string;
            severity: "good" | "warning" | "bad";
        };
    };
    issuesFound: Array<{
        title: string;
        description: string;
        category: LighthouseScoreKey;
        severity: "info" | "warning" | "critical";
    }>;
    recommendations: Array<{
        title: string;
        explanation: string;
        steps: string[];
        category: LighthouseScoreKey;
    }>;
};
export type LighthouseAdminAudit = {
    client: LighthouseClientAudit;
    rawLhr: unknown;
};
//# sourceMappingURL=types.d.ts.map