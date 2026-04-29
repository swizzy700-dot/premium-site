"use client";

import { useState, useEffect } from "react";
import type { BusinessAnalysis, ExecutiveSummary, PerformanceAnalysis, BusinessImpact, FixRoadmap } from "@/lib/website-checker/analysisEngine";

interface BusinessAnalysisReportProps {
  url: string;
  onError?: (error: string) => void;
}

export default function BusinessAnalysisReport({ url, onError }: BusinessAnalysisReportProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<BusinessAnalysis | null>(null);

  useEffect(() => {
    if (!url) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/lighthouse/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const data = await res.json();

        if (!data.success || !data.analysis) {
          const errMsg = data.error || "Unable to complete analysis";
          setError(errMsg);
          onError?.(errMsg);
          return;
        }

        setAnalysis(data.analysis);
      } catch (e) {
        const errMsg = "Failed to load analysis";
        setError(errMsg);
        onError?.(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [url, onError]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
        <p className="mt-4 text-gray-600">Analyzing your website...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="p-8 text-center text-red-600">
        <p className="text-lg font-semibold">Analysis Unavailable</p>
        <p className="text-gray-600 mt-2">{error || "Unable to complete analysis"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <ExecutiveSummarySection summary={analysis.executiveSummary} />

      {/* Business Impact */}
      <BusinessImpactSection impact={analysis.businessImpact} />

      {/* Performance Breakdown */}
      <PerformanceSection performance={analysis.performanceAnalysis} />

      {/* Fix Roadmap */}
      <RoadmapSection roadmap={analysis.fixRoadmap} />

      {/* Competitive Context */}
      <CompetitiveSection context={analysis.competitiveContext} />
    </div>
  );
}

function ExecutiveSummarySection({ summary }: { summary: ExecutiveSummary }) {
  const getGradeColor = (grade: string) => {
    if (grade === "A") return "text-green-600 bg-green-50";
    if (grade === "B") return "text-blue-600 bg-blue-50";
    if (grade === "C") return "text-yellow-600 bg-yellow-50";
    if (grade === "D") return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        <div className={`text-4xl font-bold rounded-lg px-4 py-2 ${getGradeColor(summary.overallGrade)}`}>
          {summary.overallGrade}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{summary.headline}</h2>
          <p className="text-gray-600 mb-4">{summary.subheadline}</p>
          <div className="flex gap-4 text-sm">
            <span className="text-red-600 font-medium">
              {summary.criticalIssues} Critical Issues
            </span>
            <span className="text-blue-600 font-medium">
              {summary.opportunities} Opportunities
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
        <p className="text-gray-800 font-medium">{summary.keyTakeaway}</p>
      </div>

      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <p className="text-green-800 font-semibold">
          💰 {summary.estimatedImpact}
        </p>
      </div>
    </section>
  );
}

function BusinessImpactSection({ impact }: { impact: BusinessImpact }) {
  const getRiskBadge = (level: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Business Impact Assessment</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ImpactCard
          title="Conversion Risk"
          level={impact.conversionRisk.level}
          explanation={impact.conversionRisk.explanation}
          estimate={impact.conversionRisk.estimatedLoss}
        />
        <ImpactCard
          title="SEO Visibility"
          level={impact.seoVisibilityRisk.level}
          explanation={impact.seoVisibilityRisk.explanation}
          estimate={impact.seoVisibilityRisk.estimatedLoss}
        />
        <ImpactCard
          title="User Experience"
          level={impact.userExperienceRisk.level}
          explanation={impact.userExperienceRisk.explanation}
          estimate={impact.userExperienceRisk.estimatedLoss}
        />
        <ImpactCard
          title="Mobile Revenue"
          level={impact.mobileRevenueRisk.level}
          explanation={impact.mobileRevenueRisk.explanation}
          estimate={impact.mobileRevenueRisk.estimatedLoss}
        />
      </div>

      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">Overall Risk:</span>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskBadge(impact.overallRiskLevel)}`}>
          {impact.overallRiskLevel.toUpperCase()}
        </span>
        <span className="text-gray-700">{impact.opportunitySummary}</span>
      </div>
    </section>
  );
}

function ImpactCard({
  title,
  level,
  explanation,
  estimate,
}: {
  title: string;
  level: string;
  explanation: string;
  estimate?: string;
}) {
  const getColor = (l: string) => {
    if (l === "critical" || l === "high") return "border-red-200 bg-red-50";
    if (l === "medium") return "border-yellow-200 bg-yellow-50";
    return "border-green-200 bg-green-50";
  };

  return (
    <div className={`p-4 rounded-lg border ${getColor(level)}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <span className={`text-xs uppercase font-bold ${
          level === "critical" || level === "high" ? "text-red-600" :
          level === "medium" ? "text-yellow-600" : "text-green-600"
        }`}>
          {level}
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-2">{explanation}</p>
      {estimate && (
        <p className="text-sm font-medium text-red-600">📉 {estimate}</p>
      )}
    </div>
  );
}

function PerformanceSection({ performance }: { performance: PerformanceAnalysis }) {
  const categories = [
    { key: "speed", label: "Speed", data: performance.speed },
    { key: "seo", label: "SEO", data: performance.seo },
    { key: "accessibility", label: "Accessibility", data: performance.accessibility },
    { key: "bestPractices", label: "Best Practices", data: performance.bestPractices },
  ];

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Breakdown</h3>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.key} className="border-b border-gray-100 pb-4 last:border-0">
            <div className="flex items-center gap-4 mb-2">
              <div className={`text-2xl font-bold ${
                cat.data.score >= 90 ? "text-green-600" :
                cat.data.score >= 75 ? "text-blue-600" :
                cat.data.score >= 50 ? "text-yellow-600" : "text-red-600"
              }`}>
                {cat.data.score}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{cat.label}</h4>
                <p className="text-sm text-gray-600">{cat.data.grade}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-1">{cat.data.businessMeaning}</p>
            <p className="text-sm text-gray-500">{cat.data.userImpact}</p>

            {cat.data.topIssues.length > 0 && (
              <div className="mt-3 space-y-2">
                {cat.data.topIssues.map((issue, idx) => (
                  <div key={idx} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <p className="font-medium text-red-900">{issue.title}</p>
                    <p className="text-sm text-red-700">{issue.businessImpact}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Analysis */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">📱 Mobile Experience</h4>
        <p className="text-sm text-blue-800 mb-2">{performance.mobileExperience.mobileRevenueRisk}</p>
        {performance.mobileExperience.keyProblems.map((problem, idx) => (
          <p key={idx} className="text-sm text-blue-700">• {problem}</p>
        ))}
      </div>
    </section>
  );
}

function RoadmapSection({ roadmap }: { roadmap: FixRoadmap }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Fix Roadmap</h3>

      {/* Timeline Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{roadmap.quickWins.length}</p>
          <p className="text-sm text-green-800">Quick Wins</p>
          <p className="text-xs text-green-600">Hours to days</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{roadmap.shortTerm.length}</p>
          <p className="text-sm text-blue-800">Short Term</p>
          <p className="text-xs text-blue-600">Days to weeks</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{roadmap.strategic.length}</p>
          <p className="text-sm text-purple-800">Strategic</p>
          <p className="text-xs text-purple-600">Weeks to months</p>
        </div>
      </div>

      {/* Investment & ROI */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Estimated Investment</p>
          <p className="text-xl font-bold text-gray-900">{roadmap.totalInvestmentEstimate}</p>
        </div>
        <div className="flex-1 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600">Expected ROI</p>
          <p className="text-xl font-bold text-green-700">{roadmap.expectedROI}</p>
        </div>
      </div>

      {/* Fix Items */}
      <div className="space-y-4">
        {[...roadmap.quickWins, ...roadmap.shortTerm].map((fix) => (
          <div key={fix.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">{fix.title}</h4>
              <span className={`text-xs px-2 py-1 rounded ${
                fix.impact === "critical" ? "bg-red-100 text-red-800" :
                fix.impact === "high" ? "bg-orange-100 text-orange-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                {fix.impact}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{fix.description}</p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>⏱️ {fix.estimatedTime}</span>
              <span>💰 {fix.businessValue}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompetitiveSection({ context }: { context: import("@/lib/website-checker/analysisEngine").CompetitiveContext }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Competitive Position</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-3xl font-bold text-gray-900">{context.performancePercentile}</p>
          <p className="text-sm text-gray-600">Performance Ranking</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className={`text-3xl font-bold ${
            context.vsIndustryAverage === "above" ? "text-green-600" :
            context.vsIndustryAverage === "below" ? "text-red-600" : "text-yellow-600"
          }`}>
            {context.vsIndustryAverage === "above" ? "↑ Above" :
             context.vsIndustryAverage === "below" ? "↓ Below" : "→ At"}
          </p>
          <p className="text-sm text-gray-600">Industry Average</p>
        </div>
      </div>

      {context.competitiveGaps.length > 0 && (
        <div className="p-4 bg-red-50 rounded-lg mb-4">
          <h4 className="font-semibold text-red-900 mb-2">⚠️ Competitive Gaps</h4>
          <ul className="space-y-1">
            {context.competitiveGaps.map((gap, idx) => (
              <li key={idx} className="text-sm text-red-700">• {gap}</li>
            ))}
          </ul>
        </div>
      )}

      {context.competitiveAdvantage.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">✅ Competitive Advantages</h4>
          <ul className="space-y-1">
            {context.competitiveAdvantage.map((adv, idx) => (
              <li key={idx} className="text-sm text-green-700">• {adv}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
