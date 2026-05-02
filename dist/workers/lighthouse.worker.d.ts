/**
 * Dedicated Lighthouse Worker
 * Runs outside Next bundling context to avoid @paulirish/trace_engine errors
 */
export interface DeviceAuditResult {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    rawLhr: unknown;
    error?: string;
}
export interface LighthouseResult {
    mobile: DeviceAuditResult | null;
    desktop: DeviceAuditResult | null;
    status: 'complete' | 'partial' | 'failed';
}
declare class LighthouseWorker {
    /**
     * Run both mobile and desktop audits in parallel
     */
    runAudit(url: string): Promise<LighthouseResult>;
    private runDeviceAudit;
    private createTimeoutPromise;
    private killChrome;
    /**
     * Calculate overall score from Lighthouse results
     * Uses mobile as primary, falls back to desktop
     */
    calculateOverallScore(result: LighthouseResult): {
        performance: number;
        seo: number;
        accessibility: number;
        bestPractices: number;
        overall: number;
        grade: string;
    };
    /**
     * Get the best available result (mobile preferred, then desktop)
     */
    getBestResult(result: LighthouseResult): DeviceAuditResult | null;
}
export declare const lighthouseWorker: LighthouseWorker;
export {};
//# sourceMappingURL=lighthouse.worker.d.ts.map