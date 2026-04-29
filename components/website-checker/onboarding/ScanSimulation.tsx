"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AuditResponse, AuditErrorType, ERROR_MESSAGES } from "@/lib/website-checker/types";
import { frontendLogger } from "@/lib/logger";

type ScanStep = { label: string; hint: string };

type ScanState = "idle" | "scanning" | "success" | "unavailable";

// User-facing error messages - NEVER expose technical details
const USER_ERROR_MESSAGES: Record<AuditErrorType, string> = {
  config_error: "Audit service temporarily unavailable",
  scan_error: "Unable to complete scan for this URL",
  validation_error: "Invalid URL or audit results",
  unknown: "An unexpected error occurred",
};

const STEPS: ScanStep[] = [
  {
    label: "Scanning URL…",
    hint: "Preparing the Lighthouse audit environment",
  },
  {
    label: "Running Lighthouse audit…",
    hint: "Collecting performance, SEO, accessibility, best practices signals",
  },
  {
    label: "Analyzing performance…",
    hint: "Extracting key web vitals and responsiveness insights",
  },
  {
    label: "Analyzing SEO & usability…",
    hint: "Summarizing discoverability, accessibility, and reliability",
  },
];

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface ScanSimulationProps {
  url: string;
  businessName?: string;
  onComplete: (result: { 
    success: boolean; 
    url: string; 
    desktop: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object }; 
    mobile: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object }; 
  }) => void;
  onError?: (error: string) => void;
}

export default function ScanSimulation(props: ScanSimulationProps) {
  const { url, businessName, onComplete, onError } = props;

  // Use refs for callbacks to prevent infinite loops from parent re-renders
  const callbacksRef = useRef({ onComplete, onError });
  callbacksRef.current = { onComplete, onError };

  // Single source of truth for scan state
  const [scanState, setScanState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Phase index based on scan state, not progress
  const phaseIndex = useMemo(() => {
    if (scanState === 'idle') return 0;
    if (scanState === 'running') return Math.min(Math.floor(progress / 25), 3);
    return 3;
  }, [scanState, progress]);

  // Progress animation - purely visual, does NOT control scan completion
  useEffect(() => {
    if (scanState !== 'running') {
      // Reset progress when not running
      if (scanState === 'idle') setProgress(0);
      if (scanState === 'completed') setProgress(100);
      return;
    }

    let cancelled = false;
    const start = performance.now();
    const durationMs = 8000; // Longer duration to accommodate real scans

    const tick = (now: number) => {
      if (cancelled || scanState !== 'running') return;
      const elapsed = now - start;
      const t = clamp(elapsed / durationMs, 0, 1);
      const eased = easeOutCubic(t);
      const next = Math.floor(eased * 100);
      setProgress((prev) => (next > prev ? next : prev));
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    return () => {
      cancelled = true;
    };
  }, [scanState]);

  // Main scan execution - completely separate from progress animation
  useEffect(() => {
    // Auto-start scan when component mounts or URL changes
    // Only run if we're idle and have a valid URL
    // NOTE: scanOnceGuard prevents duplicate concurrent scans
    if (scanState !== 'idle' || !url) {
      return;
    }

    // Guard against multiple concurrent scans
    const scanKey = `${url}-${Date.now()}`;
    if ((window as unknown as Record<string, unknown>).__activeScan === scanKey) {
      frontendLogger.debug(`Duplicate scan prevented for: ${url}`);
      return;
    }
    (window as unknown as Record<string, unknown>).__activeScan = scanKey;

    frontendLogger.info(`Starting scan for URL: ${url}`);

    let cancelled = false;
    let currentScanState: 'idle' | 'running' | 'completed' | 'error' = 'running';

    // Start the scan
    setScanState('running');
    setError(null);
    setProgress(0);

    (async () => {
      try {
        frontendLogger.debug(`Making API call to /api/lighthouse/audit for: ${url}`);
        const res = await fetch("/api/lighthouse/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, businessName, deviceMode: "desktop" }),
        });

        frontendLogger.debug(`API response status: ${res.status}`);

        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as { error?: string } | null;
          frontendLogger.warn("API error response", payload);
          throw new Error(payload?.error || "Lighthouse audit failed.");
        }

        const data = (await res.json()) as AuditResponse;
        frontendLogger.debug("API response data", data);
        
        if (cancelled || currentScanState !== 'running') return;

        // Safe validation - don't throw errors, handle gracefully
        let isValid = true;
        let errorMessage = '';

        // Validate API response structure
        if (!data || typeof data !== 'object') {
          frontendLogger.warn("Invalid API response format", data);
          isValid = false;
          errorMessage = "Invalid API response format.";
        } else if (!data.success || data.error) {
          // Unified error handling based on errorType
          // Expected failures are warnings, not errors
          if (data.errorType && data.errorType !== "unknown") {
            frontendLogger.expectedFailure(data.errorType, data.error || "Unknown error");
          } else {
            frontendLogger.warn("API reported failure", data.error);
          }
          isValid = false;
          errorMessage = data.errorType 
            ? USER_ERROR_MESSAGES[data.errorType] 
            : (data.error || "Unable to complete audit");
        } else if (!data.desktop && !data.mobile) {
          frontendLogger.warn("Missing data in response", { success: data.success, desktop: !!data.desktop, mobile: !!data.mobile });
          isValid = false;
          errorMessage = USER_ERROR_MESSAGES.scan_error;
        } else if (data.source !== "pagespeed_insights") {
          // Only accept real PageSpeed data
          frontendLogger.warn("Invalid or unverified data source", { source: data.source });
          isValid = false;
          errorMessage = USER_ERROR_MESSAGES.scan_error;
        }

        if (!isValid) {
          frontendLogger.debug(`Validation failed for ${url}: ${errorMessage}`);
          // Don't throw error - handle gracefully with state update
          currentScanState = 'error';
          setScanState('error');
          setError(errorMessage);
          // Use ref to call callback without dependency issues
          if (callbacksRef.current.onError) {
            callbacksRef.current.onError(errorMessage);
          }
          return;
        }
        
        frontendLogger.info(`Scan completed successfully for: ${url}`);
        currentScanState = 'completed';
        setScanState('completed');
        
        // Transform new API response to legacy format for compatibility
        // Use ref to call callback without dependency issues
        const { onComplete: completeCallback } = callbacksRef.current;
        const legacyData = {
          success: data.success,
          source: data.source,  // ✅ Include source for validation
          url: url,
          desktop: data.desktop ? {
            performance: data.desktop.scores.performance.score,
            seo: data.desktop.scores.seo.score,
            accessibility: data.desktop.scores.accessibility.score,
            bestPractices: data.desktop.scores['best-practices'].score,
            lhr: (data.desktop.rawLhr as object) ?? {}
          } : {
            performance: 0,
            seo: 0,
            accessibility: 0,
            bestPractices: 0,
            lhr: {}
          },
          mobile: data.mobile ? {
            performance: data.mobile.scores.performance.score,
            seo: data.mobile.scores.seo.score,
            accessibility: data.mobile.scores.accessibility.score,
            bestPractices: data.mobile.scores['best-practices'].score,
            lhr: (data.mobile.rawLhr as object) ?? {}
          } : {
            performance: 0,
            seo: 0,
            accessibility: 0,
            bestPractices: 0,
            lhr: {}
          }
        };
        
        completeCallback(legacyData);
      } catch (e) {
        // Handle any unexpected errors gracefully
        if (cancelled || currentScanState !== 'running') return;
        const message = e instanceof Error ? e.message : "Failed to run Lighthouse audit.";
        frontendLogger.error(`Unexpected error for ${url}`, e);
        setError(message);
        currentScanState = 'error';
        setScanState('error');
        // Use ref to call callback without dependency issues
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(message);
        }
      }
    })();

    return () => {
      cancelled = true;
      // Clear scan guard on cleanup
      (window as unknown as Record<string, unknown>).__activeScan = undefined;
      // Note: Do NOT reset state here - let component handle its own state
      // Resetting state in cleanup can cause race conditions
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, businessName]); // Only re-run when URL changes, NOT when callbacks change

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-sm text-neutral-700 font-light">Lighthouse powered analysis</div>
          <h2 className="mt-2 text-2xl font-light text-neutral-950">
            {scanState === 'idle' && 'Ready to start analysis…'}
            {scanState === 'running' && 'Analyzing website performance…'}
            {scanState === 'completed' && 'Analysis completed successfully!'}
            {scanState === 'error' && 'Analysis encountered an issue'}
          </h2>
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
            {scanState === 'idle' && 'Click to start a comprehensive Lighthouse audit of your website.'}
            {scanState === 'running' && 'Running comprehensive Lighthouse analysis and collecting performance metrics...'}
            {scanState === 'completed' && 'Analysis complete! Preparing your detailed performance report.'}
            {scanState === 'error' && error || 'An error occurred during the analysis. Please try again.'}
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
          {STEPS.map((s, idx) => {
            const state = idx < phaseIndex ? "done" : idx === phaseIndex ? "active" : "upcoming";
            return (
              <div
                key={s.label}
                className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition-colors"
              >
                <div>
                  <div className="text-sm text-neutral-950 font-light">{s.label}</div>
                  <div className="text-xs text-neutral-500 mt-1">{s.hint}</div>
                </div>
                <div className="mt-1">
                  {state === "active" ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-600 font-light">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                      running
                    </div>
                  ) : state === "done" ? (
                    <div className="inline-flex items-center justify-center h-7 w-7 rounded-xl bg-green-50 border border-green-200">
                      <svg className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.29a1 1 0 0 1 .006 1.415l-7.1 7.2a1 1 0 0 1-1.423-.014l-3.39-3.45a1 1 0 1 1 1.434-1.4l2.673 2.724 6.39-6.48a1 1 0 0 1 1.41.006Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center h-7 w-7 rounded-xl bg-neutral-50 border border-neutral-200">
                      <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M7 5h6v2H7V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M6 8h8v7H6V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}

