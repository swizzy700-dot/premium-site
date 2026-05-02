export interface DeviceAudit {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    lhr: object;
}
export interface ProgressiveAuditState {
    url: string;
    phase: 'idle' | 'starting' | 'fetching' | 'partial' | 'completed' | 'error';
    mobile: DeviceAudit | null;
    desktop: DeviceAudit | null;
    error: string | null;
    meta: {
        startTime: number;
        lastUpdate: number;
        isFullyComplete: boolean;
    };
}
interface UseProgressiveAuditOptions {
    url: string;
    businessName?: string;
    onComplete?: (state: ProgressiveAuditState) => void;
    onError?: (error: string) => void;
    onPartial?: (state: ProgressiveAuditState) => void;
}
export declare function useProgressiveAudit(options: UseProgressiveAuditOptions): {
    state: ProgressiveAuditState;
    isLoading: boolean;
    startAudit: () => Promise<void>;
    cancelAudit: () => void;
    hasPartialResults: boolean;
    isFullyComplete: boolean;
};
export {};
//# sourceMappingURL=useProgressiveAudit.d.ts.map