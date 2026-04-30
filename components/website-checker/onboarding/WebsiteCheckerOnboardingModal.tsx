"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ScanSimulation from "./ScanSimulation";
import LighthouseResultsDashboard from "@/components/website-checker/dashboard/LighthouseResultsDashboard";
import type { LighthouseClientAudit } from "@/lib/website-checker/lighthouse/types";
import { frontendLogger } from "@/lib/logger";

const LAST_AUDIT_KEY = "website-checker:last-audit";

type Step = 1 | 2 | 3 | 4;

function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function isValidUrl(raw: string) {
  try {
    const u = new URL(normalizeUrl(raw));
    return u.hostname.includes(".");
  } catch {
    return false;
  }
}

export default function WebsiteCheckerOnboardingModal(props: {
  isOpen: boolean;
  onRequestClose: () => void;
  initialUrl?: string;
}) {
  const { isOpen, onRequestClose, initialUrl } = props;

  const [step, setStep] = useState<Step>(1);
  const [url, setUrl] = useState<string>(initialUrl ?? "");
  const [scanError, setScanError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  // Unified scan session state - single source of truth for scan lifecycle
  const [scanSession, setScanSession] = useState<{
    scanId: string | null;
    status: 'idle' | 'running' | 'completed' | 'error';
    audit: {
      success: boolean; 
      url: string; 
      desktop: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object }; 
      mobile: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object }; 
    } | null;
    error: string | null;
  }>({
    scanId: null,
    status: 'idle',
    audit: null,
    error: null,
  });
  
  // Legacy state for backward compatibility during transition
  const [audit, setAudit] = useState<typeof scanSession.audit>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const canProceedUrl = useMemo(() => isValidUrl(url), [url]);
  
  // UNIFIED SCAN STATUS: Single source of truth for UI state
  // Priority: scanning > completed > error > idle
  const scanStatus = useMemo(() => {
    if (isScanning) return "scanning";
    if (audit) return "completed";
    if (scanError) return "error";
    return "idle";
  }, [isScanning, audit, scanError]);

  // Stable callbacks for ScanSimulation - MUST be at top level (not inside JSX!)
  // CRITICAL: Includes scanId parameter for race condition protection
  const handleScanComplete = useCallback((result: { success: boolean; url: string; desktop: object; mobile: object }, scanId: string) => {
    console.log("[Onboarding] ONCOMPLETE CALLED", {
      scanId,
      hasResult: !!result,
      resultUrl: result?.url,
      hasDesktop: !!result?.desktop,
      hasMobile: !!result?.mobile
    });
    
    // RACE CONDITION GUARD: Validate scanId matches current scan session
    setScanSession(prev => {
      if (prev.scanId !== scanId) {
        console.log("[Onboarding] IGNORING STALE SCAN RESULT", { 
          incomingScanId: scanId, 
          currentScanId: prev.scanId 
        });
        return prev; // Ignore stale response
      }
      
      // Update unified state atomically
      return {
        ...prev,
        status: 'completed',
        audit: result as typeof prev.audit,
        error: null,
      };
    });
    
    // Legacy state updates for backward compatibility
    setAudit(result as typeof audit);
    setScanError(null);
    setIsScanning(false);
    setStep(4);
    
    // Debug: Verify state was set (will show in next render)
    console.log("[Onboarding] STATE UPDATES CALLED", {
      scanId,
    });
  }, [setAudit, setScanError, setIsScanning, setStep, setScanSession]);

  const handleScanError = useCallback((error: string, scanId?: string) => {
    console.log("[Onboarding] onError called:", { error, scanId });
    
    // RACE CONDITION GUARD: Only update if scanId matches (or no scanId provided for backward compat)
    if (scanId) {
      setScanSession(prev => {
        if (prev.scanId !== scanId) {
          console.log("[Onboarding] IGNORING STALE SCAN ERROR", { 
            incomingScanId: scanId, 
            currentScanId: prev.scanId 
        });
          return prev;
        }
        return {
          ...prev,
          status: 'error',
          error,
        };
      });
    }
    
    setScanError(error);
    setIsScanning(false);
    setStep(4);
  }, [setScanError, setIsScanning, setStep, setScanSession]);

  const handleScanStart = useCallback((scanId: string) => {
    console.log("[Onboarding] onScanStart called:", { scanId });
    
    // Store scanId and set scanning state
    setScanSession(prev => ({
      ...prev,
      scanId,
      status: 'running',
      error: null,
    }));
    
    // Legacy state updates
    setIsScanning(true);
    setScanError(null);
    
    console.log("[Onboarding] SCAN STARTED:", { scanId, isScanning: true });
  }, [setScanSession, setIsScanning, setScanError]);

  // Debug: Log state changes including scanSession
  useEffect(() => {
    console.log("[Onboarding] STATE CHANGE:", { 
      step, 
      scanSession: {
        scanId: scanSession.scanId,
        status: scanSession.status,
        hasAudit: !!scanSession.audit,
      },
      legacy: {
        isScanning, 
        hasAudit: !!audit,
        auditUrl: audit?.url,
        hasScanError: !!scanError,
      },
      canProceedUrl, 
      url 
    });
  }, [step, scanSession, isScanning, audit, scanError, canProceedUrl, url]);
  
  // FINAL STATE GUARANTEE: A scan MUST ALWAYS end in either success OR error
  // This useEffect detects the illegal "empty state" and forces an error
  // CRITICAL: Add small delay to allow state updates to propagate first
  useEffect(() => {
    // Only check when scan appears to be complete (not scanning)
    if (!isScanning && step === 4) {
      const hasAudit = !!audit;
      const hasScanError = !!scanError;
      
      // Illegal state: neither success nor error
      if (!hasAudit && !hasScanError) {
        console.warn("[Onboarding] POTENTIAL INVALID STATE - waiting for state propagation...", {
          isScanning,
          hasAudit,
          hasScanError,
          step
        });
        
        // Give state 500ms to propagate before forcing error
        const timeoutId = setTimeout(() => {
          // Re-check after delay - state might have updated
          const stillNoAudit = !audit;
          const stillNoError = !scanError;
          
          if (stillNoAudit && stillNoError) {
            console.error("[Onboarding] INVALID STATE CONFIRMED → forcing error", {
              audit: !!audit,
              scanError: !!scanError,
              step
            });
            
            // Force error state
            setScanError("Scan failed to return results. Please try again.");
            setScanSession(prev => ({
              ...prev,
              status: 'error',
              error: "Scan failed to return results. Please try again."
            }));
          }
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isScanning, audit, scanError, step, scanSession.status, setScanError, setScanSession]);

  useEffect(() => {
    if (!isOpen) return;
    // Reset to the correct start screen each time the modal opens.
    const t = window.setTimeout(() => {
      setStep(initialUrl ? 2 : 1);
      setAudit(null);
      setScanError(null);
      setIsScanning(false);
      if (initialUrl) setUrl(initialUrl);
    }, 0);
    return () => window.clearTimeout(t);
  }, [isOpen, initialUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onRequestClose]);

  // Safety effect to ensure isScanning is always reset
  useEffect(() => {
    if (step !== 3) {
      setIsScanning(false);
    }
  }, [step]);

  function persistAudit(result: { 
    success: boolean; 
    source?: "pagespeed_insights" | "config_error" | "error" | null;
    errorType?: "config_error" | "scan_error" | "validation_error" | "unknown" | null;
    url: string; 
    desktop: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object } | null; 
    mobile: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object } | null; 
  }) {
    try {
      // STRICT VALIDATION: Must have valid data from Google PageSpeed Insights
      if (!result || typeof result !== 'object' || !result.success) {
        frontendLogger.warn('Invalid audit data received', result);
        setScanError('Invalid audit data received.');
        setIsScanning(false);
        setStep(4);
        return;
      }
      
      // CRITICAL: Verify data came from real Google PageSpeed API
      // Check errorType for config errors (source is only "pagespeed_insights" | null)
      if (result.errorType === "config_error") {
        frontendLogger.expectedFailure('config_error', 'API not configured');
        setScanError('API not configured. Please contact support.');
        setIsScanning(false);
        setStep(4);
        return;
      }
      
      // Accept data if it has valid scores, regardless of exact source string
      if (!result.source && (result.desktop || result.mobile)) {
        // Allow through if we have actual data even if source is null
        frontendLogger.info('Accepting audit data with null source but valid scores');
      } else if (!result.source) {
        frontendLogger.warn('Unverified data source rejected', { source: result.source });
        setScanError('Unverified audit data - results must come from Google PageSpeed Insights.');
        setIsScanning(false);
        setStep(4);
        return;
      }
      
      if (!result.desktop || !result.mobile) {
        frontendLogger.warn('Missing desktop or mobile data', result);
        setScanError('Incomplete audit data received.');
        setIsScanning(false);
        setStep(4);
        return;
      }
      
      // At this point we have valid PageSpeed data with non-null desktop and mobile
      window.localStorage.setItem(LAST_AUDIT_KEY, JSON.stringify(result));
      setAudit(result as { success: boolean; url: string; desktop: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object }; mobile: { performance: number; seo: number; accessibility: number; bestPractices: number; lhr: object }; });
    } catch (error) {
      frontendLogger.error('Failed to persist audit', error);
      setScanError('Failed to save audit results.');
      setIsScanning(false);
      setStep(4);
    }
  }

  function handleAnalyzeAnother() {
    setStep(2);
    setAudit(null);
    setScanError(null);
    setIsScanning(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Backdrop: z-0, click outside to close */}
      <div 
        className="absolute inset-0 z-0 bg-neutral-900/10 backdrop-blur-sm" 
        onClick={onRequestClose} 
      />

      {/* Content container: z-10 so it's above backdrop and clickable */}
      <div className="relative z-10 h-full pt-24 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pb-10">
          <div
            className={[
              "rounded-3xl border border-neutral-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.10)]",
              "transition-all duration-500",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-6 px-5 sm:px-7 py-5 border-b border-neutral-200">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                  Website analysis + lead conversion
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
                  {step === 1
                    ? "Website Analysis"
                    : step === 2
                      ? "Enter your details"
                      : step === 3
                        ? "Analyzing…"
                        : scanStatus === "completed"
                          ? "Your website report is ready"
                          : scanStatus === "error"
                            ? "Analysis failed"
                            : "Website Analysis"}
                </h1>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  {step === 1
                    ? "Enter your website URL to get a comprehensive performance and SEO analysis."
                    : step === 2
                      ? "We'll scan your website and show you how to improve performance, SEO, accessibility, and best practices."
                      : step === 3
                        ? "Running comprehensive website audit across all metrics…"
                        : scanStatus === "completed"
                          ? "Your comprehensive website analysis is complete."
                          : scanStatus === "error"
                            ? "We couldn't complete the analysis. Please try again."
                            : "Preparing your analysis…"}
                </p>
              </div>

              <button
                type="button"
                onClick={onRequestClose}
                className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-neutral-500 hover:bg-neutral-50 transition-colors"
                aria-label="Close onboarding"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Step indicator */}
            <div className="px-5 sm:px-7 py-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((n) => {
                  const active = step === (n as Step);
                  const done = step > (n as Step);
                  return (
                    <div key={n} className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            "h-2.5 w-2.5 rounded-full ring-1 ring-white/10",
                            done ? "bg-green-500/80" : active ? "bg-blue-500/90" : "bg-neutral-200",
                          ].join(" ")}
                        />
                        <div className={active ? "text-xs text-neutral-700" : "text-xs text-neutral-400"}>
                          {n === 1 ? "Welcome" : n === 2 ? "Input" : n === 3 ? "Scan" : "Results"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step content */}
            <div className="px-5 sm:px-7 py-7">
              <div
                className={[
                  "transition-all duration-500 ease-out",
                  step === 1 ? "opacity-100" : "opacity-100",
                ].join(" ")}
              >
                {step === 1 ? (
                  <div className="flex flex-col items-start gap-6">
                    <div className="max-w-2xl">
                      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <div className="text-sm text-neutral-700">
                          You'll receive a comprehensive analysis of your website:
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {["Performance", "SEO", "Accessibility", "Best Practices"].map((label) => (
                            <div
                              key={label}
                              className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
                            >
                              {label} insights
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        console.log("[Onboarding] Start Analysis clicked, current step:", step);
                        setStep(2);
                      }}
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-8 py-4 text-sm font-medium text-neutral-950 hover:opacity-95 transition-opacity cursor-pointer"
                    >
                      Start Analysis
                    </button>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] items-start">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="url" className="block text-sm text-neutral-700">
                          Website URL <span className="text-neutral-400">(required)</span>
                        </label>
                        <input
                          id="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15 transition-colors"
                        />
                        {!url.trim() ? null : canProceedUrl ? (
                          <div className="text-xs text-green-700">Looks good. We'll analyze this safely.</div>
                        ) : (
                          <div className="text-xs text-red-700">Please enter a valid website URL.</div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="business" className="block text-sm text-neutral-700">
                          Business Name <span className="text-neutral-400">(optional)</span>
                        </label>
                        <input
                          id="business"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Acme Digital Agency"
                          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15 transition-colors"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={!canProceedUrl || isScanning}
                        onClick={() => {
                          setIsScanning(true);
                          setStep(3);
                        }}
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-8 py-4 text-sm font-medium text-neutral-950 hover:opacity-95 transition-opacity disabled:opacity-50 disabled:hover:opacity-50"
                      >
                        {isScanning ? "Analyzing…" : "Analyze Website"}
                      </button>
                    </div>

                    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
                      <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">What you'll get</div>
                      <div className="mt-3 space-y-4">
                        <div className="text-sm text-neutral-700 leading-relaxed">
                          A dashboard that explains what's holding your site back and what to fix first.
                        </div>
                        <div className="space-y-2">
                          {[
                            "SEO breakdown with actionable improvements",
                            "Performance + responsiveness insights that reduce drop-off",
                            "Accessibility and best-practice recommendations for trust",
                          ].map((t) => (
                            <div key={t} className="flex gap-3 items-start">
                              <span className="mt-2 h-2 w-2 rounded-full bg-blue-500/30" />
                              <div className="text-sm text-neutral-700">{t}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="min-h-[420px]">
                    <ScanSimulation
                      url={normalizeUrl(url)}
                      businessName={businessName.trim() || undefined}
                      onScanStart={handleScanStart}
                      onComplete={handleScanComplete}
                      onError={handleScanError}
                    />
                  </div>
                ) : null}

                {/* DEBUG: Log render decision */}
                {(() => {
                  const shouldShowReport = step === 4 && !!audit;
                  const shouldShowError = step === 4 && !!scanError && !audit;
                  const shouldShowMissing = step === 4 && !audit && !scanError;
                  
                  console.log("[Onboarding] RENDER DECISION:", {
                    step,
                    hasAudit: !!audit,
                    auditUrl: audit?.url,
                    hasScanError: !!scanError,
                    isScanning,
                    shouldShowReport,
                    shouldShowError,
                    shouldShowMissing
                  });
                  return null;
                })()}
                
                {step === 4 && audit ? (
                  <LighthouseResultsDashboard audit={audit} onAnalyzeAnother={handleAnalyzeAnother} />
                ) : step === 4 && scanError ? (
                  <div className="text-center py-8">
                    <div className="text-red-600 mb-4">
                      {scanError || "Failed to generate results."}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setScanError(null);
                        setAudit(null); // Reset audit on retry
                        setStep(2);
                      }}
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-6 py-3 text-sm font-medium text-neutral-950 hover:opacity-95 transition-opacity"
                    >
                      Try Again
                    </button>
                  </div>
                ) : step === 4 ? (
                  // SAFETY: If we reach step 4 without audit or error, show error and allow retry
                  <div className="text-center py-8">
                    <div className="text-red-600 mb-4">
                      Report data is missing. Please try again.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAudit(null);
                        setScanError(null);
                        setStep(2);
                      }}
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-6 py-3 text-sm font-medium text-neutral-950 hover:opacity-95 transition-opacity"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="text-neutral-600">
                    {scanStatus === "scanning"
                      ? "Analyzing website performance…"
                      : scanStatus === "error"
                        ? "Analysis failed. Please try again."
                        : "Preparing results…"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

