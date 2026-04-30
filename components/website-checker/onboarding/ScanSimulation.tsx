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
  scanId?: string; // Optional: parent can provide scanId for tracking
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
  const { url, businessName, onComplete, onError } = props;

  // Use refs for callbacks to prevent infinite loops from parent re-renders
  const { onScanStart } = props;
  const callbacksRef = useRef({ onComplete, onError, onScanStart });
  callbacksRef.current = { onComplete, onError, onScanStart };

  // Track if scan completed (survives re-renders, used for guard logic)
  const hasCompletedRef = useRef(false);
  
  // Track current scan ID to prevent race conditions from late responses
  const activeScanIdRef = useRef<string | null>(null);
  
  // Refs for cleanup access to abort controller and timeout
  const controllerRef = useRef<AbortController | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Single source of truth for scan state
  const [scanState, setScanState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null); // Soft timeout warning for slow scans

  // Reset completion flag when URL changes
  useEffect(() => {
    hasCompletedRef.current = false;
  }, [url]);

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
    if (scanState !== 'idle' || !url) {
      return;
    }

    // Guard against multiple concurrent scans for the SAME URL
    // Use URL-only as key (no timestamp) so guard actually works
    const scanLockKey = url;
    const existingLock = (window as unknown as Record<string, { url: string; timestamp: number } | undefined>).__activeScan;
    
    if (existingLock?.url === url) {
      const age = Date.now() - existingLock.timestamp;
      if (age < 60000) { // 60 second lock timeout
        frontendLogger.warn(`Scan already in progress for: ${url} (age: ${age}ms)`);
        return;
      }
      frontendLogger.debug(`Clearing stale scan lock for: ${url} (age: ${age}ms)`);
    }

    // Set new scan lock
    (window as unknown as Record<string, { url: string; timestamp: number }>).__activeScan = {
      url,
      timestamp: Date.now()
    };

    frontendLogger.info(`Starting scan for URL: ${url}`);

    // Generate unique scan ID for this scan instance
    // Use crypto.randomUUID() if available, fallback to timestamp-based ID
    const scanId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${url}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    activeScanIdRef.current = scanId; // Set as active scan for race protection
    hasCompletedRef.current = false; // Reset completion flag for new scan
    
    frontendLogger.info(`[ScanSimulation] Starting scan ${scanId} for: ${url}`);
    
    // Notify parent of scan start with scanId
    if (callbacksRef.current.onScanStart) {
      callbacksRef.current.onScanStart(scanId);
    }
    
    // Track completion locally - don't use React state for flow control
    let flowState: 'running' | 'completed' | 'error' = 'running';
    let progressInterval: NodeJS.Timeout | null = null;
    let hardTimeout: NodeJS.Timeout | null = null;

    // Start the scan
    setScanState('running');
    setError(null);
    setProgress(0);

    (async () => {
      try {
        frontendLogger.debug(`[Scan ${scanId}] Making API call to /api/lighthouse/audit`);
        
        // Create AbortController ONLY for user cancellation or component unmount
        // NO automatic time-based abort - PageSpeed API can legitimately take 10-60s
        controllerRef.current = new AbortController();
        
        // Progress simulation: gradually increase from 0 to 90% while waiting
        // Real progress completes when API returns
        let simulatedProgress = 0;
        progressInterval = setInterval(() => {
          if (flowState !== 'running') {
            clearInterval(progressInterval!);
            return;
          }
          // Slow progress: 0-90% over ~60 seconds
          if (simulatedProgress < 90) {
            simulatedProgress += Math.random() * 2;
            setProgress(Math.min(simulatedProgress, 90));
          }
        }, 1000);
        
        // Soft timeout: Warn user after 30s
        warningTimeoutRef.current = setTimeout(() => {
          frontendLogger.warn(`[Scan ${scanId}] Taking longer than expected (>30s)`);
          setWarning("This scan is taking longer than usual... Google PageSpeed is still analyzing your site.");
        }, 30000);
        
        // HARD TIMEOUT: Force completion after 120 seconds (2 minutes)
        // PageSpeed API should never take longer than this
        hardTimeout = setTimeout(() => {
          if (flowState === 'running') {
            frontendLogger.error(`[Scan ${scanId}] HARD TIMEOUT - forcing error after 120s`);
            controllerRef.current?.abort();
            flowState = 'error';
            setScanState('error');
            setProgress(0);
            setError('Scan timed out. Please try again.');
            if (activeScanIdRef.current === scanId && callbacksRef.current.onError) {
              callbacksRef.current.onError('Scan timed out after 120 seconds', scanId);
            }
          }
        }, 120000);
        
        const res = await fetch("/api/lighthouse/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, businessName, deviceMode: "desktop" }),
          signal: controllerRef.current.signal, // Only aborted on user cancel or unmount
        });
        
        // Clear warning timeout once response arrives
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
          warningTimeoutRef.current = null;
        }
        setWarning(null); // Clear any warning message

        frontendLogger.debug(`[Scan ${scanId}] API response status: ${res.status}`);

        // RACE CONDITION GUARD: Ignore response if this is not the active scan anymore
        if (activeScanIdRef.current !== scanId) {
          frontendLogger.debug(`[Scan ${scanId}] Ignoring stale response - newer scan active`);
          return;
        }

        // SOFT FAILURE HANDLING: Parse error response without throwing
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as { error?: string; errorType?: string } | null;
          frontendLogger.warn(`[Scan ${scanId}] API error response (status ${res.status})`, payload);
          
          // Classify error: config_error is hard failure, others are soft (might retry)
          const isHardFailure = payload?.errorType === "config_error" || res.status === 401 || res.status === 403;
          
          if (isHardFailure) {
            // Hard failure: API key missing, auth error - show error state
            flowState = 'error';
            hasCompletedRef.current = true;
            const errorMessage = payload?.errorType === "config_error" 
              ? USER_ERROR_MESSAGES.config_error 
              : (payload?.error || "Authentication failed.");
            setError(errorMessage);
            setScanState('error');
            // RACE CONDITION GUARD: Only call callback if this is still the active scan
            if (activeScanIdRef.current === scanId) {
              if (callbacksRef.current.onError) {
                callbacksRef.current.onError(errorMessage, scanId);
              }
            }
          } else {
            // Soft failure: temporary 500, timeout, etc. - show error but allow retry
            flowState = 'error';
            hasCompletedRef.current = true;
            const errorMessage = payload?.error || `Audit service temporarily unavailable (${res.status}). Please try again.`;
            setError(errorMessage);
            setScanState('error');
            // RACE CONDITION GUARD: Only call callback if this is still the active scan
            if (activeScanIdRef.current === scanId) {
              if (callbacksRef.current.onError) {
                callbacksRef.current.onError(errorMessage, scanId);
              }
            }
          }
          return; // Graceful exit - scan completed with error state
        }

        const data = (await res.json()) as AuditResponse;
        frontendLogger.debug(`[Scan ${scanId}] API response data`, { 
          success: data.success, 
          hasError: !!data.error,
          hasDesktop: !!data.desktop,
          hasMobile: !!data.mobile 
        });

        // Safe validation with PARTIAL SUCCESS support
        let isValid = true;
        let errorMessage = '';

        // Validate API response structure
        if (!data || typeof data !== 'object') {
          frontendLogger.warn(`[Scan ${scanId}] Invalid API response format`, data);
          isValid = false;
          errorMessage = "Invalid API response format.";
        } else if (data.success === false) {
          // API explicitly returned failure
          frontendLogger.warn(`[Scan ${scanId}] API returned success: false`, data);
          isValid = false;
          errorMessage = data.error || data.errorType 
            ? USER_ERROR_MESSAGES[data.errorType as keyof typeof USER_ERROR_MESSAGES] 
            : "Unable to complete audit";
        } else if (data.errorType === "config_error") {
          // Config errors are expected when API key is missing - HARD FAILURE
          frontendLogger.expectedFailure("config_error", data.error || "API not configured");
          isValid = false;
          errorMessage = USER_ERROR_MESSAGES.config_error;
        } else if (data.error) {
          // API returned error field - SOFT FAILURE (might succeed on retry)
          frontendLogger.warn(`[Scan ${scanId}] API reported failure`, data.error);
          isValid = false;
          errorMessage = data.errorType 
            ? USER_ERROR_MESSAGES[data.errorType] 
            : (data.error || "Unable to complete audit");
        }
        // NOTE: Partial success - accept if we have at least desktop OR mobile data
        // This handles cases where Google API returns one device but not the other

        if (!isValid) {
          frontendLogger.debug(`[Scan ${scanId}] Validation failed: ${errorMessage}`);
          // CRITICAL: Always update state - never silent fail
          flowState = 'error';
          hasCompletedRef.current = true;
          setWarning(null); // Clear any warning
          setScanState('error');
          setError(errorMessage);
          // RACE CONDITION GUARD: Only call callback if this is still the active scan
          if (activeScanIdRef.current === scanId) {
            if (callbacksRef.current.onError) {
              callbacksRef.current.onError(errorMessage, scanId);
            }
          } else {
            frontendLogger.debug(`[Scan ${scanId}] Skipping error callback - scan is no longer active`);
          }
          return;
        }
        
        // CRITICAL SUCCESS PATH: This MUST execute when API returns valid data
        frontendLogger.info(`[Scan ${scanId}] Completed successfully for: ${url}`);
        flowState = 'completed';
        hasCompletedRef.current = true;
        
        // Clear any warning - scan completed successfully
        setWarning(null);
        
        // CRITICAL: Update React state to 'completed' - this triggers UI change
        setScanState('completed');
        
        // Transform API response to legacy format - handles BOTH new flat format AND old nested format
        // New API: { mobile: { performance: 85, seo: 90, ... } }
        // Old API: { mobile: { scores: { performance: { score: 0.85 }, ... } } }
        const { onComplete: completeCallback } = callbacksRef.current;
        
        const extractScores = (deviceData: unknown) => {
          if (!deviceData || typeof deviceData !== 'object') {
            return { performance: 0, seo: 0, accessibility: 0, bestPractices: 0, lhr: {} };
          }
          const d = deviceData as Record<string, unknown>;
          
          // New flat format (API returns 0-100 numbers directly)
          if (typeof d.performance === 'number') {
            return {
              performance: d.performance,
              seo: (d.seo as number) || 0,
              accessibility: (d.accessibility as number) || 0,
              bestPractices: (d.bestPractices as number) || 0,
              lhr: (d.lhr as object) || (d.rawLhr as object) || {}
            };
          }
          
          // Old nested format (scores.performance.score was 0-1)
          const scores = d.scores as Record<string, { score?: number }> | undefined;
          if (scores) {
            return {
              performance: Math.round((scores.performance?.score || 0) * 100),
              seo: Math.round((scores.seo?.score || 0) * 100),
              accessibility: Math.round((scores.accessibility?.score || 0) * 100),
              bestPractices: Math.round((scores['best-practices']?.score || 0) * 100),
              lhr: (d.rawLhr as object) || {}
            };
          }
          
          return { performance: 0, seo: 0, accessibility: 0, bestPractices: 0, lhr: {} };
        };
        
        const desktopScores = extractScores(data.desktop);
        const mobileScores = extractScores(data.mobile);
        
        const legacyData = {
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
            performance: 0,
            seo: 0,
            accessibility: 0,
            bestPractices: 0,
            lhr: {}
          },
          mobile: data.mobile ? {
            performance: mobileScores.performance,
            seo: mobileScores.seo,
            accessibility: mobileScores.accessibility,
            bestPractices: mobileScores.bestPractices,
            lhr: mobileScores.lhr
          } : {
            performance: 0,
            seo: 0,
            accessibility: 0,
            bestPractices: 0,
            lhr: {}
          }
        };
        
        // RACE CONDITION GUARD: Only call callback if this is still the active scan
        if (activeScanIdRef.current === scanId) {
          frontendLogger.info(`[Scan ${scanId}] Calling onComplete callback`);
          completeCallback(legacyData, scanId);
        } else {
          frontendLogger.debug(`[Scan ${scanId}] Skipping onComplete callback - scan is no longer active`);
        }
      } catch (e) {
        // RACE CONDITION GUARD: Don't update state if this is not the active scan anymore
        if (activeScanIdRef.current !== scanId) {
          frontendLogger.debug(`[Scan ${scanId}] Ignoring stale error - newer scan active`);
          return;
        }
        
        // Check if this is an abort (user cancelled or component unmounted)
        const isAbort = e instanceof Error && e.name === 'AbortError';
        
        if (isAbort) {
          frontendLogger.info(`[Scan ${scanId}] Scan was cancelled by user or component unmount`);
          // Don't update state - the new scan or unmount will handle it
          return;
        }
        
        // CRITICAL: Handle unexpected errors - always transition to error state, never get stuck
        const message = e instanceof Error ? e.message : "Failed to run Lighthouse audit.";
        
        frontendLogger.error(`[Scan ${scanId}] Unexpected error:`, e);
        
        // CRITICAL: Always update state - never leave in 'running'
        flowState = 'error';
        hasCompletedRef.current = true;
        setWarning(null); // Clear any warning
        setError(message);
        setScanState('error');
        
        // RACE CONDITION GUARD: Only call callback if this is still the active scan
        if (activeScanIdRef.current === scanId) {
          // Use ref to call callback without dependency issues
          if (callbacksRef.current.onError) {
            callbacksRef.current.onError(message, scanId);
          }
        } else {
          frontendLogger.debug(`[Scan ${scanId}] Skipping error callback - scan is no longer active`);
        }
      }
    })();

    return () => {
      // Cleanup: Clear all timers and intervals
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (hardTimeout) {
        clearTimeout(hardTimeout);
        hardTimeout = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      
      // Abort any in-flight fetch (this triggers AbortError in catch block)
      // Only if scan hasn't completed - completed scans don't need cleanup
      if (flowState === 'running' && !hasCompletedRef.current && controllerRef.current) {
        frontendLogger.debug(`[Scan ${scanId}] Cleanup - aborting in-flight request`);
        controllerRef.current.abort(); // Triggers AbortError which is handled gracefully
        
        // Clear scan lock
        const active = (window as unknown as Record<string, { url: string } | undefined>).__activeScan;
        if (active?.url === url) {
          (window as unknown as Record<string, unknown>).__activeScan = undefined;
        }
      }
      
      // Clear refs
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // CRITICAL: Only re-run when URL changes - NOT businessName

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
            {scanState === 'error' && (error || 'An error occurred during the analysis. Please try again.')}
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

