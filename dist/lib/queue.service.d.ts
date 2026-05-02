import { Queue, Job } from 'bullmq';
export interface AuditJob {
    url: string;
    auditId: string;
    retryCount?: number;
}
export interface AuditResult {
    url: string;
    auditId: string;
    status: 'success' | 'partial' | 'failed';
    performance?: {
        score: number;
        metrics?: Record<string, unknown>;
    };
    seo?: {
        score: number;
        issues?: string[];
    };
    accessibility?: {
        score: number;
        violations?: string[];
    };
    bestPractices?: {
        score: number;
        warnings?: string[];
    };
    aiInsights?: {
        summary: string;
        insights: Array<{
            category: string;
            title: string;
            description: string;
            severity: string;
            recommendation: string;
        }>;
        priorityFixes: Array<unknown>;
        strengths: string[];
        weaknesses: string[];
    };
    overallScore?: number;
    grade?: string;
    error?: string;
    executionTime?: number;
}
export declare const auditQueue: Queue<any, any, string, any, any, string>;
export declare function processAuditJob(job: Job<AuditJob>): Promise<AuditResult>;
export declare function getJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    result?: AuditResult;
    error?: string;
}>;
export declare function getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}>;
//# sourceMappingURL=queue.service.d.ts.map