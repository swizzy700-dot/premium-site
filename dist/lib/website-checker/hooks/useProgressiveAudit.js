"use client";
import { useState, useCallback, useRef, useEffect } from 'react';
import { frontendLogger } from '@/lib/logger';
// Initial state factory
const createInitialState = (url) => ({
    url,
    phase: 'idle',
    mobile: null,
    desktop: null,
    error: null,
    meta: {
        startTime: 0,
        lastUpdate: 0,
        isFullyComplete: false,
    },
});
export function useProgressiveAudit(options) {
    const { url, businessName, onComplete, onError, onPartial } = options;
    // State
    const [state, setState] = useState(() => createInitialState(url));
    const [isLoading, setIsLoading] = useState(false);
    // Refs for race condition protection
    const activeScanIdRef = useRef(null);
    const controllerRef = useRef(null);
    // Update state helper with logging
    const updateState = useCallback((updater) => {
        setState(prev => {
            const next = updater(prev);
            frontendLogger.debug('[ProgressiveAudit] State update', {
                component: 'useProgressiveAudit',
                phase: next.phase,
                hasMobile: !!next.mobile,
                hasDesktop: !!next.desktop,
                isComplete: next.meta.isFullyComplete
            });
            return next;
        });
    }, []);
    // Start progressive audit
    const startAudit = useCallback(async () => {
        if (!url || isLoading)
            return;
        const scanId = `${url}-${Date.now()}`;
        activeScanIdRef.current = scanId;
        frontendLogger.info(`[ProgressiveAudit] Starting audit: ${url}`);
        // Reset state and set to starting
        setState(createInitialState(url));
        setIsLoading(true);
        // Phase 1: Starting
        updateState(prev => ({
            ...prev,
            phase: 'starting',
            meta: { ...prev.meta, startTime: Date.now() }
        }));
        // Small delay to show starting state
        await new Promise(r => setTimeout(r, 300));
        // Phase 2: Fetching
        updateState(prev => ({
            ...prev,
            phase: 'fetching',
            meta: { ...prev.meta, lastUpdate: Date.now() }
        }));
        // Create abort controller
        controllerRef.current = new AbortController();
        try {
            const res = await fetch('/api/lighthouse/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, businessName, deviceMode: 'all' }),
                signal: controllerRef.current.signal,
            });
            // Race check
            if (activeScanIdRef.current !== scanId) {
                frontendLogger.debug('[ProgressiveAudit] Stale response ignored', { component: 'useProgressiveAudit' });
                return;
            }
            const data = await res.json();
            if (!res.ok || !data.success) {
                const errorMsg = data.error || 'Audit failed';
                updateState(prev => ({
                    ...prev,
                    phase: 'error',
                    error: errorMsg,
                    meta: { ...prev.meta, lastUpdate: Date.now() }
                }));
                onError?.(errorMsg);
                return;
            }
            // Extract device data
            const mobileData = data.mobile ? {
                performance: data.mobile.performance,
                seo: data.mobile.seo,
                accessibility: data.mobile.accessibility,
                bestPractices: data.mobile.bestPractices,
                lhr: data.mobile.lhr,
            } : null;
            const desktopData = data.desktop ? {
                performance: data.desktop.performance,
                seo: data.desktop.seo,
                accessibility: data.desktop.accessibility,
                bestPractices: data.desktop.bestPractices,
                lhr: data.desktop.lhr,
            } : null;
            const hasMobile = mobileData !== null;
            const hasDesktop = desktopData !== null;
            const isFullyComplete = hasMobile && hasDesktop;
            // Determine phase based on what we have
            const phase = isFullyComplete
                ? 'completed'
                : (hasMobile || hasDesktop)
                    ? 'partial'
                    : 'fetching';
            // Update state with results
            const newState = {
                url,
                phase,
                mobile: mobileData,
                desktop: desktopData,
                error: null,
                meta: {
                    startTime: state.meta.startTime,
                    lastUpdate: Date.now(),
                    isFullyComplete,
                },
            };
            setState(newState);
            // Callbacks
            if (isFullyComplete) {
                frontendLogger.info('[ProgressiveAudit] Audit fully complete');
                onComplete?.(newState);
            }
            else {
                frontendLogger.info('[ProgressiveAudit] Partial results available');
                onPartial?.(newState);
            }
        }
        catch (e) {
            if (activeScanIdRef.current !== scanId)
                return;
            const isAbort = e instanceof Error && e.name === 'AbortError';
            if (isAbort) {
                frontendLogger.info('[ProgressiveAudit] Scan cancelled');
                return;
            }
            const errorMsg = e instanceof Error ? e.message : 'Unknown error';
            frontendLogger.error('[ProgressiveAudit] Error', { component: 'useProgressiveAudit', error: e instanceof Error ? e.message : String(e) });
            updateState(prev => ({
                ...prev,
                phase: 'error',
                error: errorMsg,
                meta: { ...prev.meta, lastUpdate: Date.now() }
            }));
            onError?.(errorMsg);
        }
        finally {
            setIsLoading(false);
            controllerRef.current = null;
        }
    }, [url, businessName, isLoading, onComplete, onError, onPartial, state.meta.startTime, updateState]);
    // Cancel audit
    const cancelAudit = useCallback(() => {
        frontendLogger.info('[ProgressiveAudit] Cancelling audit');
        controllerRef.current?.abort();
        activeScanIdRef.current = null;
        setIsLoading(false);
    }, []);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            controllerRef.current?.abort();
        };
    }, []);
    return {
        state,
        isLoading,
        startAudit,
        cancelAudit,
        hasPartialResults: state.mobile !== null || state.desktop !== null,
        isFullyComplete: state.meta.isFullyComplete,
    };
}
//# sourceMappingURL=useProgressiveAudit.js.map