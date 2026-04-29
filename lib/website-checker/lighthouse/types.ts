export type LighthouseScoreLabel = "Excellent" | "Good" | "Needs Improvement" | "Poor";

export type LighthouseScoreKey = "performance" | "seo" | "accessibility" | "best-practices";

export type LighthouseClientAudit = {
  url: string;
  businessName?: string;
  generatedAt: number;
  source: "pagespeed_insights"; // Strict: only real Google PageSpeed data
  scores: Record<
    LighthouseScoreKey,
    {
      score: number; // 0-100
      label: LighthouseScoreLabel;
      color: "green" | "yellow" | "red" | "blue";
      shortExplanation: string;
    }
  >;
  overallExplanation: string;
  keyDiagnostics: {
    lcp?: { formatted: string; severity: "good" | "warning" | "bad" };
    cls?: { formatted: string; severity: "good" | "warning" | "bad" };
    tbt?: { formatted: string; severity: "good" | "warning" | "bad" };
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
  // Raw lighthouse data should only ever be returned to an authenticated owner view.
  rawLhr: unknown;
};

