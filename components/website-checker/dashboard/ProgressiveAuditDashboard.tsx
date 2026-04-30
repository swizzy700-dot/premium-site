"use client";

import { useMemo } from "react";
import type { LighthouseScoreKey } from "@/lib/website-checker/lighthouse/types";

// Progressive audit state interface
interface ProgressiveAuditState {
  url: string;
  phase: 'starting' | 'fetching' | 'partial' | 'completed' | 'error';
  mobile: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    lhr: object;
  } | null;
  desktop: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    lhr: object;
  } | null;
  meta: {
    startTime: number;
    lastUpdate: number;
    isFullyComplete: boolean;
  };
}

interface ProgressiveAuditDashboardProps {
  audit: ProgressiveAuditState;
  onAnalyzeAnother: () => void;
}

const SCORE_ORDER: LighthouseScoreKey[] = ["performance", "seo", "accessibility", "best-practices"];

// Skeleton component for loading scores
function ScoreSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-16 bg-neutral-200 rounded mb-2" />
      <div className="h-2 w-24 bg-neutral-100 rounded" />
    </div>
  );
}

// Device section with skeleton support
function DeviceSection({ 
  title, 
  subtitle,
  data, 
  isLoading 
}: { 
  title: string;
  subtitle: string;
  data: { performance: number; seo: number; accessibility: number; bestPractices: number } | null;
  isLoading: boolean;
}) {
  const scores = data || { performance: 0, seo: 0, accessibility: 0, bestPractices: 0 };
  
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-500">{subtitle}</p>
        </div>
        {isLoading && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </span>
        )}
        {!isLoading && data && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Complete
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {SCORE_ORDER.map((key) => {
          const score = scores[key === 'best-practices' ? 'bestPractices' : key as keyof typeof scores];
          const isScoreReady = !isLoading && data !== null;
          
          return (
            <div key={key} className="p-3 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-500 mb-1 capitalize">
                {key === 'best-practices' ? 'Best Practices' : key}
              </div>
              {isScoreReady ? (
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${
                    score >= 90 ? 'text-green-600' : 
                    score >= 75 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {score}
                  </span>
                  <span className="text-sm text-neutral-400">/100</span>
                </div>
              ) : (
                <ScoreSkeleton />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Live progress indicator
function LiveProgress({ phase, startTime }: { phase: string; startTime: number }) {
  const elapsed = useMemo(() => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  }, [startTime]);
  
  const getPhaseLabel = () => {
    switch (phase) {
      case 'starting': return 'Initializing scan...';
      case 'fetching': return `Analyzing website (${elapsed}s)...`;
      case 'partial': return 'Finalizing results...';
      case 'completed': return 'Analysis complete!';
      default: return 'Processing...';
    }
  };
  
  const getProgressPercent = () => {
    switch (phase) {
      case 'starting': return 10;
      case 'fetching': return Math.min(30 + (elapsed * 1.5), 70);
      case 'partial': return 85;
      case 'completed': return 100;
      default: return 0;
    }
  };
  
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-neutral-600">{getPhaseLabel()}</span>
        <span className="text-neutral-400">{elapsed}s</span>
      </div>
      <div className="w-full bg-neutral-100 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${getProgressPercent()}%` }}
        />
      </div>
    </div>
  );
}

export default function ProgressiveAuditDashboard({ 
  audit, 
  onAnalyzeAnother 
}: ProgressiveAuditDashboardProps) {
  const hasMobile = audit.mobile !== null;
  const hasDesktop = audit.desktop !== null;
  const isComplete = audit.meta.isFullyComplete;
  
  return (
    <div className="w-full">
      {/* Header with live progress */}
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-7 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">
              {isComplete ? 'Website Analysis Complete' : 'Analysis in Progress'}
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-light text-neutral-950">
              {isComplete ? 'Website Performance Report' : 'Analyzing Your Website'}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              {audit.url}
            </p>
          </div>
          
          <button
            onClick={onAnalyzeAnother}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors"
          >
            Analyze Another Site
          </button>
        </div>
        
        {/* Live progress bar */}
        <LiveProgress phase={audit.phase} startTime={audit.meta.startTime} />
        
        {/* Status message */}
        {!isComplete && (
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Still working:</span>{' '}
              {hasMobile && !hasDesktop 
                ? 'Mobile analysis complete. Desktop analysis in progress...'
                : !hasMobile && hasDesktop
                ? 'Desktop analysis complete. Mobile analysis in progress...'
                : 'Running comprehensive Lighthouse audit. This may take 30-60 seconds...'}
            </p>
          </div>
        )}
      </div>
      
      {/* Device sections - render progressively */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeviceSection
          title="Mobile Performance"
          subtitle="How your site performs on mobile devices"
          data={audit.mobile}
          isLoading={!hasMobile}
        />
        
        <DeviceSection
          title="Desktop Performance"
          subtitle="How your site performs on desktop browsers"
          data={audit.desktop}
          isLoading={!hasDesktop}
        />
      </div>
      
      {/* Summary section - shows when any data available */}
      {(hasMobile || hasDesktop) && (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Quick Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SCORE_ORDER.map((key) => {
              const mobileScore = audit.mobile?.[key === 'best-practices' ? 'bestPractices' : key as keyof typeof audit.mobile] as number | undefined;
              const desktopScore = audit.desktop?.[key === 'best-practices' ? 'bestPractices' : key as keyof typeof audit.desktop] as number | undefined;
              
              // Use available score, prefer mobile if both available
              const score = mobileScore ?? desktopScore ?? 0;
              const hasScore = mobileScore !== undefined || desktopScore !== undefined;
              
              return (
                <div key={key} className="text-center p-3 rounded-xl bg-neutral-50">
                  <div className="text-xs text-neutral-500 mb-1 capitalize">
                    {key === 'best-practices' ? 'Best Practices' : key}
                  </div>
                  {hasScore ? (
                    <div className={`text-xl font-bold ${
                      score >= 90 ? 'text-green-600' : 
                      score >= 75 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {score}
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-neutral-300">-</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
