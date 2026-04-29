"use client";

import Link from "next/link";
import type { LighthouseScoreKey } from "@/lib/website-checker/lighthouse/types";

const SCORE_ORDER: LighthouseScoreKey[] = ["performance", "seo", "accessibility", "best-practices"];

function badgeColor(color: "green" | "yellow" | "red" | "blue") {
  switch (color) {
    case "green":
      return {
        label: "Excellent / Good",
        className: "bg-green-50 text-green-800 border-green-200",
      };
    case "yellow":
      return {
        label: "Needs Improvement",
        className: "bg-yellow-50 text-yellow-800 border-yellow-200",
      };
    case "red":
      return {
        label: "Poor / Issues",
        className: "bg-red-50 text-red-800 border-red-200",
      };
    case "blue":
    default:
      return {
        label: "Info",
        className: "bg-blue-50 text-blue-800 border-blue-200",
      };
  }
}

function scoreHeading(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}

function niceKeyLabel(key: LighthouseScoreKey) {
  switch (key) {
    case "best-practices":
      return "Best Practices";
    default:
      return key[0].toUpperCase() + key.slice(1);
  }
}

function severityPill(sev: "info" | "warning" | "critical") {
  switch (sev) {
    case "info":
      return badgeColor("blue");
    case "warning":
      return badgeColor("yellow");
    case "critical":
      return badgeColor("red");
  }
}

function getScoreColor(score: number): "green" | "yellow" | "red" | "blue" {
  if (score >= 90) return "green";
  if (score >= 75) return "yellow";
  if (score >= 50) return "red";
  return "red";
}

export default function LighthouseResultsDashboard(props: {
  audit: { 
    success: boolean; 
    url: string; 
    desktop: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object }; 
    mobile: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object }; 
  };
  onAnalyzeAnother: () => void;
}) {
  const { audit, onAnalyzeAnother } = props;

  // Create a scores object from desktop data for compatibility
  const scores = {
    performance: audit.desktop.performance,
    seo: audit.desktop.seo,
    accessibility: audit.desktop.accessibility,
    "best-practices": audit.desktop.bestPractices
  };

  const underperformingKey = SCORE_ORDER
    .slice()
    .sort((a, b) => (scores[a] ?? 0) - (scores[b] ?? 0))[0];

  const underScore = scores[underperformingKey];
  const underHeading = scoreHeading(underScore);

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">Website Analysis Complete</div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-light text-neutral-950">Website Performance Report</h2>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              Results for <span className="text-neutral-900 font-medium">{audit.url}</span>
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {SCORE_ORDER.map((key) => {
                const score = scores[key];
                const color = getScoreColor(score);
                return (
                  <div
                    key={key}
                    className={`rounded-full border px-3 py-1 text-sm font-medium ${badgeColor(color).className}`}
                  >
                    {niceKeyLabel(key)} {score}/100
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <button
              onClick={onAnalyzeAnother}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Analyze Another
            </button>
          </div>
        </div>

        {/* Score Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SCORE_ORDER.map((key) => {
            const score = scores[key];
            const color = getScoreColor(score);
            const heading = scoreHeading(score);
            const tone = badgeColor(color);
            return (
              <div
                key={key}
                className="rounded-2xl border border-neutral-200 bg-white p-4 text-center"
              >
                <div className="text-sm text-neutral-600">{niceKeyLabel(key)}</div>
                <div className="mt-1 text-4xl font-light text-neutral-950">{score}</div>
                <div className="mt-1 text-sm text-neutral-700">{heading}</div>
                <div className={`rounded-full border px-3 py-1 text-[11px] ${tone.className}`}>{tone.label}</div>
              </div>
            );
          })}
        </div>

        {/* Mobile vs Desktop Comparison */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="text-lg font-medium text-neutral-950">Desktop Performance</h3>
            <div className="mt-4 space-y-3">
              {SCORE_ORDER.map((key) => {
                const score = audit.desktop[key === "best-practices" ? "bestPractices" : key as keyof typeof audit.desktop] as number;
                const color = getScoreColor(score);
                return (
                  <div key={`desktop-${key}`} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700">{niceKeyLabel(key)}</span>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-neutral-900">{score}/100</div>
                      <div className={`rounded-full border px-2 py-1 text-[10px] ${badgeColor(color).className}`}>
                        {badgeColor(color).label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="text-lg font-medium text-neutral-950">Mobile Performance</h3>
            <div className="mt-4 space-y-3">
              {SCORE_ORDER.map((key) => {
                const score = audit.mobile[key === "best-practices" ? "bestPractices" : key as keyof typeof audit.mobile] as number;
                const color = getScoreColor(score);
                return (
                  <div key={`mobile-${key}`} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700">{niceKeyLabel(key)}</span>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-neutral-900">{score}/100</div>
                      <div className={`rounded-full border px-2 py-1 text-[10px] ${badgeColor(color).className}`}>
                        {badgeColor(color).label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="text-lg font-medium text-neutral-950">Key Insights</h3>
          <div className="mt-4 text-sm text-neutral-700 leading-relaxed">
            <p className="mb-3">
              Your website's <strong>{niceKeyLabel(underperformingKey)}</strong> performance is {underHeading} ({underScore}/100). 
              This area presents the biggest opportunity for improvement.
            </p>
            <p>
              Focus on optimizing {niceKeyLabel(underperformingKey)} to achieve better user engagement, 
              higher conversion rates, and improved business outcomes.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/website-checker/quotation"
            className="rounded-full bg-blue-600 px-6 py-3 text-center text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Request Optimization Quote
          </Link>
          <Link
            href="/website-checker/contact"
            className="rounded-full border border-neutral-200 bg-white px-6 py-3 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Talk to Expert
          </Link>
        </div>
      </div>
    </div>
  );
}
