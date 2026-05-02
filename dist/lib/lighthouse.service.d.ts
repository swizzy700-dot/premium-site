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
export interface LighthouseScores {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    overall: number;
    grade: string;
}
export declare class LighthouseService {
    /**
     * Run both mobile and desktop audits in parallel with independent failure handling
     */
    runAudit(url: string): Promise<LighthouseResult>;
    /**
     * Run a single device audit with proper timeout and cleanup
     */
    private runDeviceAudit;
    /**
     * Create a timeout promise that rejects after specified milliseconds
     */
    private createTimeoutPromise;
    /**
     * Safely kill Chrome process
     */
    private killChrome;
    /**
     * Calculate overall score from combined mobile/desktop results
     * Uses mobile as primary for consistency
     */
    calculateOverallScore(result: LighthouseResult): LighthouseScores;
    /**
     * Get the best available result (mobile preferred, then desktop)
     */
    getBestResult(result: LighthouseResult): DeviceAuditResult | null;
}
export declare const lighthouseService: LighthouseService;
//# sourceMappingURL=lighthouse.service.d.ts.map