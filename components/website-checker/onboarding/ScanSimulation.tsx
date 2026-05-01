"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AuditResponse } from "@/lib/website-checker/types";

type ScanStep = { label: string; hint: string; stage: ScanStage };
type ScanStage = 'connecting' | 'mobile' | 'desktop' | 'processing' | 'complete' | 'error';

// User-facing error messages - NEVER expose technical details
const USER_ERROR_MESSAGES: Record<string, string> = {
  config_error: "Analysis service temporarily unavailable",
  scan_error: "Unable to complete analysis for this URL",
  validation_error: "Invalid URL or analysis results",
  unknown: "An unexpected error occurred",
};

// Dynamic progressive stages for speed perception
const PROGRESSIVE_STEPS: ScanStep[] = [
  { label: "Connecting...", hint: "Establishing secure connection", stage: 'connecting' },
  { label: "Analyzing mobile...", hint: "Evaluating mobile performance metrics", stage: 'mobile' },
  { label: "Analyzing desktop...", hint: "Evaluating desktop performance metrics", stage: 'desktop' },
  { label: "Compiling insights...", hint: "Building your performance report", stage: 'processing' },
];

// History cache - stores multiple results per URL for history viewing
// Key: URL, Value: array of cached results with timestamps
const historyCache = new Map<string, { data: AuditResponse; timestamp: number; scanId: string }[]>();
const MAX_HISTORY_PER_URL = 10; // Keep last 10 scans per URL
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Get latest history entry for a URL (for history viewing only)
function getLatestHistory(url: string): { data: AuditResponse; timestamp: number; scanId: string } | null {
  const history = historyCache.get(url);
  if (!history || history.length === 0) return null;
  
  // Return most recent
  const sorted = history.sort((a, b) => b.timestamp - a.timestamp);
  return sorted[0];
}

// Get all history for a URL
function getHistory(url: string): { data: AuditResponse; timestamp: number; scanId: string }[] {
  const history = historyCache.get(url) || [];
  return history
    .filter(h => Date.now() - h.timestamp < HISTORY_TTL_MS)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// Add result to history (allows multiple scans per URL)
function addToHistory(url: string, data: AuditResponse, scanId: string): void {
  const existing = historyCache.get(url) || [];
  const newEntry = { data, timestamp: Date.now(), scanId };
  
  // Add to front, keep only MAX_HISTORY_PER_URL entries
  const updated = [newEntry, ...existing].slice(0, MAX_HISTORY_PER_URL);
  historyCache.set(url, updated);
  
  // Also store in localStorage for persistence across sessions
  try {
    const allHistory = Array.from(historyCache.entries());
    localStorage.setItem('lighthouse-history', JSON.stringify(allHistory));
  } catch {
    // Ignore storage errors
  }
}

interface ScanSimulationProps {
  url: string;
  businessName?: string;
  scanId?: string; // Optional: parent can provide scanId for tracking
  useCache?: boolean; // When true, uses history cache instead of calling API (for history viewing)
  onComplete: (result: { 
    success: boolean; 
    url: string; 
    desktop: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object }; 
    mobile: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object }; 
  }, scanId: string) => void; // scanId passed back for race condition validation
  onError?: (error: string, scanId: string) => void; // scanId passed back for race condition validation
  onScanStart?: (scanId: string) => void; // Called when scan starts with generated scanId
}

export default function ScanSimulation(props: ScanSimulationProps) {
  const { url, businessName, onComplete, onError, useCache = false } = props;

  // Use refs for callbacks to prevent infinite loops from parent re-renders
  const { onScanStart } = props;
  const callbacksRef = useRef({ onComplete, onError, onScanStart });
  callbacksRef.current = { onComplete, onError, onScanStart };

  // Track if scan completed (survives re-renders, used for guard logic)
  const hasCompletedRef = useRef(false);

  // Track current scan ID to prevent race conditions from late responses
  const activeScanIdRef = useRef<string | null>(null);

  // Refs for cleanup access to abort controller
  const controllerRef = useRef<AbortController | null>(null);

  // Single source of truth for scan state
  const [scanState, setScanState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [currentStage, setCurrentStage] = useState<ScanStage>('connecting');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to track progress for preventing backward movement
  const progressRef = useRef(0);
  const apiCompletedRef = useRef(false);

  // Reset state when URL changes - only if not currently scanning
  useEffect(() => {
    if (scanState !== 'running') {
      hasCompletedRef.current = false;
      apiCompletedRef.current = false;
      setCurrentStage('connecting');
      progressRef.current = 0;
      setProgress(0);
    }
  }, [url]);

  // Get current step based on stage
  const currentStepIndex = useMemo(() => {
    const index = PROGRESSIVE_STEPS.findIndex(s => s.stage === currentStage);
    return index >= 0 ? index : 0;
  }, [currentStage]);

  // GUIDED PROGRESSION MODEL - synced with API state, no timers
  // 0-30%: initialization, 30-70%: API processing, 70-90%: final analysis, 90-100%: API complete
  useEffect(() => {
    if (scanState === 'idle') {
      progressRef.current = 0;
      setProgress(0);
      return;
    }
    
    if (scanState === 'completed') {
      progressRef.current = 100;
      setProgress(100);
      return;
    }
    
    if (scanState === 'error') {
      // Pause at current progress on error, don't jump
      return;
    }
    
    if (scanState !== 'running') return;

    // Phase-based progress caps - progress can only move forward within each phase
    const phaseCaps: Record<ScanStage, number> = {
      connecting: 30,   // Init phase: 0-30%
      mobile: 55,       // Early API: 30-55%
      desktop: 70,      // Mid API: 55-70%
      processing: 90,   // Final analysis: 70-90%
      complete: 100,    // Done: 100% (set by API completion)
      error: 100
    };

    const cap = phaseCaps[currentStage] ?? 90;
    let cancelled = false;

    // Smooth incremental progress - small steps toward the phase cap
    const animateProgress = () => {
      if (cancelled || scanState !== 'running') return;
      
      const current = progressRef.current;
      
      // Stop if we've hit the phase cap (wait for phase change or API complete)
      if (current >= cap) {
        // Check if API completed while we were waiting
        if (apiCompletedRef.current && current < 100) {
          progressRef.current = 100;
          setProgress(100);
        }
        return;
      }
      
      // Small incremental step - never jump more than 1-2%
      const remaining = cap - current;
      const step = Math.max(remaining * 0.02, 0.3); // 2% of remaining, min 0.3%
      const next = Math.min(current + step, cap);
      
      // Only move forward (never backward)
      if (next > progressRef.current) {
        progressRef.current = next;
        setProgress(Math.floor(next));
      }
      
      // Continue animation with small delay for smooth feel
      setTimeout(() => {
        if (!cancelled) requestAnimationFrame(animateProgress);
      }, 100);
    };

    requestAnimationFrame(animateProgress);

    return () => {
      cancelled = true;
    };
  }, [scanState, currentStage]);

  // Helper to transform API response to legacy format - defined outside useEffect to avoid hoisting issues
  const transformToLegacyFormat = useMemo(() => {
    return (data: AuditResponse, url: string) => {
      const extractScores = (deviceData: unknown) => {
        if (!deviceData || typeof deviceData !== 'object') {
          return { performance: 0, seo: 0, accessibility: 0, bestPractices: 0, lhr: {} };
        }
        const d = deviceData as Record<string, unknown>;

        if (typeof d.performance === 'number') {
          return {
            performance: d.performance,
            seo: (d.seo as number) || 0,
            accessibility: (d.accessibility as number) || 0,
            bestPractices: (d.bestPractices as number) || 0,
            lhr: (d.lhr as object) || {}
          };
        }

        const scores = d.scores as Record<string, { score?: number }> | undefined;
        if (scores) {
          return {
            performance: Math.round((scores.performance?.score || 0) * 100),
            seo: Math.round((scores.seo?.score || 0) * 100),
            accessibility: Math.round((scores.accessibility?.score || 0) * 100),
            bestPractices: Math.round((scores['best-practices']?.score || 0) * 100),
            lhr: (d.lhr as object) || {}
          };
        }

        return { performance: 0, seo: 0, accessibility: 0, bestPractices: 0, lhr: {} };
      };

      const desktopScores = extractScores(data.desktop);
      const mobileScores = extractScores(data.mobile);

      return {
        success: data.success,
        source: data.source || "pagespeed_insights",
        url: url,
        desktop: data.desktop ? {
          performance: desktopScores.performance,
          seo: desktopScores.seo,
          accessibility: desktopScores.accessibility,
          bestPractices: desktopScores.bestPractices,
          lhr: desktopScores.lhr
        } : {
          performance: 0, seo: 0, accessibility: 0, bestPractices: 0, lhr: {}
        },
        mobile: data.mobile ? {
          performance: mobileScores.performance,
          seo: mobileScores.seo,
          accessibility: mobileScores.accessibility,
          bestPractices: mobileScores.bestPractices,
          lhr: mobileScores.lhr
        } : {
          performance: 0, seo: 0, accessibility: 0, bestPractices: 0, lhr: {}
        }
      };
    };
  }, []);

  // Main scan execution with progressive loading
  useEffect(() => {
    // Only run if we're idle and have a valid URL
    if (scanState !== 'idle' || !url) {
      return;
    }

    // Guard against multiple concurrent scans
    if (hasCompletedRef.current) {
      return;
    }
    
    // ONLY use cache when explicitly in history mode (useCache=true)
    // Fresh scans ALWAYS call the API
    if (useCache) {
      const historyEntry = getLatestHistory(url);
      if (historyEntry) {
        // Use cached history result immediately without API call
        const legacyData = transformToLegacyFormat(historyEntry.data, url);
        setScanState('completed');
        setProgress(100);
        setCurrentStage('complete');
        hasCompletedRef.current = true;
        callbacksRef.current.onComplete(legacyData, historyEntry.scanId);
        return;
      }
      // No history found - fall through to API call even in cache mode
    }

    // Generate unique scan ID for this scan instance
    const scanId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${url}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    activeScanIdRef.current = scanId;
    hasCompletedRef.current = false;

    // Notify parent of scan start
    if (callbacksRef.current.onScanStart) {
      callbacksRef.current.onScanStart(scanId);
    }

    // Track completion locally
    let flowState: 'running' | 'completed' | 'error' = 'running';

    // Start the scan
    setScanState('running');
    setCurrentStage('connecting');
    setError(null);
    setProgress(5);

    // Stage progression based on progress, not arbitrary timers
    // This keeps UI stages roughly aligned with progress phases
    const updateStageFromProgress = () => {
      const currentProgress = progressRef.current;
      
      if (currentProgress < 20) {
        setCurrentStage('connecting');
      } else if (currentProgress < 40) {
        setCurrentStage('mobile');
      } else if (currentProgress < 60) {
        setCurrentStage('desktop');
      } else if (currentProgress < 90) {
        setCurrentStage('processing');
      }
    };
    
    // Subscribe to progress changes to update stage
    const intervalId = setInterval(() => {
      if (flowState === 'running') {
        updateStageFromProgress();
      }
    }, 500);

    const clearStageTracking = () => clearInterval(intervalId);

    (async () => {
      try {
        // Create AbortController for cleanup only
        controllerRef.current = new AbortController();

        const res = await fetch("/api/lighthouse/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, businessName }),
          signal: controllerRef.current.signal,
        });

        // RACE CONDITION GUARD
        if (activeScanIdRef.current !== scanId) {
          return;
        }

        // Always parse response - backend now returns 200 with structured error data
        let data: AuditResponse;
        try {
          data = (await res.json()) as AuditResponse;
        } catch {
          // Only fail if we can't parse the response at all
          flowState = 'error';
          hasCompletedRef.current = true;
          setCurrentStage('error');
          const errorMessage = "Invalid response from server";
          setError(errorMessage);
          setScanState('error');
          if (activeScanIdRef.current === scanId && callbacksRef.current.onError) {
            callbacksRef.current.onError(errorMessage, scanId);
          }
          return;
        }

        // Validate API response structure
        if (!data || typeof data !== 'object') {
          throw new Error("Invalid API response");
        }

        // Check for complete failure (both mobile AND desktop null)
        const hasMobile = data.mobile !== null && data.mobile !== undefined;
        const hasDesktop = data.desktop !== null && data.desktop !== undefined;
        const hasAnyData = hasMobile || hasDesktop;

        // Only fail if we have NO data at all
        if (!hasAnyData) {
          const errorMessage = data.errors?.mobile || data.errors?.desktop || "Analysis failed - no data available";
          flowState = 'error';
          hasCompletedRef.current = true;
          setCurrentStage('error');
          setScanState('error');
          setError(errorMessage);
          if (activeScanIdRef.current === scanId && callbacksRef.current.onError) {
            callbacksRef.current.onError(errorMessage, scanId);
          }
          return;
        }

        // Store result in history (supports multiple scans per URL)
        addToHistory(url, data, scanId);

        // Mark API as completed - this will trigger final progress to 100%
        apiCompletedRef.current = true;
        flowState = 'completed';
        hasCompletedRef.current = true;
        setCurrentStage('complete');
        setScanState('completed');
        
        // Final progress will be set by the progress effect when it sees apiCompletedRef
        const legacyData = transformToLegacyFormat(data, url);

        if (activeScanIdRef.current === scanId) {
          callbacksRef.current.onComplete(legacyData, scanId);
        }
      } catch (e) {
        if (activeScanIdRef.current !== scanId) {
          return;
        }

        const isAbort = e instanceof Error && e.name === 'AbortError';
        if (isAbort) {
          return;
        }

        const message = e instanceof Error ? e.message : "Analysis failed";

        flowState = 'error';
        hasCompletedRef.current = true;
        setCurrentStage('error');
        setError(message);
        setScanState('error');

        if (activeScanIdRef.current === scanId && callbacksRef.current.onError) {
          callbacksRef.current.onError(message, scanId);
        }
      }
    })();

    return () => {
      clearStageTracking();
      if (flowState === 'running' && !hasCompletedRef.current && controllerRef.current) {
        controllerRef.current.abort();
      }
      controllerRef.current = null;
    };
  }, [url, transformToLegacyFormat, businessName]);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-sm text-neutral-700 font-light">Performance Analysis Engine</div>
          <h2 className="mt-2 text-2xl font-light text-neutral-950">
            {scanState === 'idle' && 'Ready to analyze your website'}
            {scanState === 'running' && PROGRESSIVE_STEPS[currentStepIndex]?.label || 'Processing...'}
            {scanState === 'completed' && 'Analysis complete'}
            {scanState === 'error' && 'Unable to complete analysis'}
          </h2>
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
            {scanState === 'idle' && 'Initiate a comprehensive performance evaluation of your website.'}
            {scanState === 'running' && (
              <span className="block">{PROGRESSIVE_STEPS[currentStepIndex]?.hint || 'Processing...'}</span>
            )}
            {scanState === 'completed' && 'Your performance report is ready. Review your insights below.'}
            {scanState === 'error' && (error || 'An error occurred during analysis. Please try again.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/10 to-cyan-400/10 blur-[10px]" />
            <div className="relative h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">Analysis</div>
          <div className="text-sm text-neutral-800 font-light">{progress}%</div>
        </div>

        <div className="h-3 w-full rounded-full bg-neutral-100 overflow-hidden border border-neutral-200">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 grid gap-3">
          {PROGRESSIVE_STEPS.map((s, idx) => {
            const isDone = idx < currentStepIndex;
            const isActive = idx === currentStepIndex && scanState === 'running';
            const isUpcoming = idx > currentStepIndex;
            
            return (
              <div
                key={s.label}
                className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 transition-all duration-300 ${
                  isActive ? 'border-blue-300 bg-blue-50/50' : 
                  isDone ? 'border-green-200 bg-green-50/30' : 
                  'border-neutral-200 bg-white'
                }`}
              >
                <div>
                  <div className={`text-sm font-light ${isActive ? 'text-blue-700' : isDone ? 'text-green-700' : 'text-neutral-950'}`}>
                    {s.label}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">{s.hint}</div>
                </div>
                <div className="mt-1">
                  {isActive ? (
                    <div className="flex items-center gap-2 text-xs text-blue-600 font-light">
                      <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      in progress
                    </div>
                  ) : isDone ? (
                    <div className="inline-flex items-center justify-center h-7 w-7 rounded-xl bg-green-100 border border-green-300">
                      <svg className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.415l-7.1 7.2a1 1 0 0 1-1.423-.014l-3.39-3.45a1 1 0 1 1 1.434-1.4l2.673 2.724 6.39-6.48a1 1 0 0 1 1.41.006Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center h-7 w-7 rounded-xl bg-neutral-100 border border-neutral-200">
                      <span className="text-xs text-neutral-400">{idx + 1}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
