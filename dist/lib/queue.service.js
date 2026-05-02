import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../utils/logger.js';
import { AuditError, ErrorCodes } from '../utils/errorHandler.js';
import { puppeteerService } from './puppeteer.service';
// Import from worker to avoid Lighthouse bundling in Next.js
import { lighthouseWorker } from '../workers/lighthouse.worker.js';
import { aiService } from './ai.service';
import { PrismaClient } from '@prisma/client';
// Redis connection
const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});
// Prisma client
const prisma = new PrismaClient();
// Audit Queue
export const auditQueue = new Queue('audit-queue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});
// Process audit job
export async function processAuditJob(job) {
    const { url, auditId, retryCount = 0 } = job.data;
    const startTime = Date.now();
    logger.info(`Processing audit job`, { auditId, url, retryCount, jobId: job.id });
    try {
        // Update audit status to processing
        await prisma.audit.update({
            where: { id: auditId },
            data: { status: 'processing' },
        });
        // Step 1: Load website with Puppeteer
        logger.info(`Step 1: Loading website`, { auditId, url });
        const puppeteerResult = await puppeteerService.loadWebsite(url);
        if (puppeteerResult.blocked) {
            throw new AuditError({
                message: 'Website blocked access',
                code: ErrorCodes.URL_BLOCKED,
                retryable: false,
            });
        }
        if (puppeteerResult.emptyDom) {
            throw new AuditError({
                message: 'Empty DOM detected',
                code: ErrorCodes.EMPTY_DOM,
                retryable: false,
            });
        }
        // Step 2: Run Lighthouse audit (mobile + desktop in parallel)
        logger.info(`Step 2: Running Lighthouse audits`, { auditId, url });
        const lighthouseResult = await lighthouseWorker.runAudit(url);
        const scores = lighthouseWorker.calculateOverallScore(lighthouseResult);
        // Get the best available result for AI analysis (mobile preferred)
        const bestResult = lighthouseWorker.getBestResult(lighthouseResult);
        // Step 3: AI Analysis (only if we have at least one successful result)
        let aiAnalysis = null;
        if (bestResult) {
            logger.info(`Step 3: AI analysis`, { auditId, url, usingDevice: lighthouseResult.mobile ? 'mobile' : 'desktop' });
            aiAnalysis = await aiService.analyzeAudit(url, bestResult, puppeteerResult.title);
        }
        else {
            logger.warn(`Step 3: Skipping AI analysis - no lighthouse data available`, { auditId, url });
        }
        const executionTime = Date.now() - startTime;
        // Determine final status based on lighthouse result
        const auditStatus = lighthouseResult.status === 'complete' ? 'completed' :
            lighthouseResult.status === 'partial' ? 'completed' : 'failed';
        // Step 4: Save results to database
        logger.info(`Step 4: Saving results`, {
            auditId,
            executionTime,
            status: lighthouseResult.status,
            mobile: lighthouseResult.mobile ? 'success' : 'failed',
            desktop: lighthouseResult.desktop ? 'success' : 'failed',
        });
        // Store combined lighthouse data
        const lighthouseData = {
            mobile: lighthouseResult.mobile,
            desktop: lighthouseResult.desktop,
            status: lighthouseResult.status,
        };
        await prisma.audit.update({
            where: { id: auditId },
            data: {
                status: auditStatus,
                performanceScore: scores.performance,
                seoScore: scores.seo,
                accessibilityScore: scores.accessibility,
                bestPracticesScore: scores.bestPractices,
                overallScore: scores.overall,
                grade: scores.grade,
                lighthouseData: lighthouseData,
                aiInsights: aiAnalysis,
                executionTime,
                completedAt: new Date(),
            },
        });
        // Cleanup
        await puppeteerService.close();
        // Build result with both mobile and desktop data
        const result = {
            url,
            auditId,
            status: lighthouseResult.status === 'complete' ? 'success' :
                lighthouseResult.status === 'partial' ? 'partial' : 'failed',
            performance: {
                score: scores.performance,
            },
            seo: {
                score: scores.seo,
            },
            accessibility: {
                score: scores.accessibility,
            },
            bestPractices: {
                score: scores.bestPractices,
            },
            aiInsights: aiAnalysis ? {
                summary: aiAnalysis.summary,
                insights: aiAnalysis.insights,
                priorityFixes: aiAnalysis.priorityFixes,
                strengths: aiAnalysis.strengths,
                weaknesses: aiAnalysis.weaknesses,
            } : undefined,
            overallScore: scores.overall,
            grade: scores.grade,
            executionTime,
        };
        logger.info(`Audit completed successfully`, { auditId, executionTime, grade: scores.grade });
        return result;
    }
    catch (error) {
        await puppeteerService.close();
        const executionTime = Date.now() - startTime;
        // Update audit with error
        await prisma.audit.update({
            where: { id: auditId },
            data: {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime,
            },
        });
        if (error instanceof AuditError) {
            logger.error(`Audit failed with AuditError`, {
                auditId,
                code: error.code,
                message: error.message,
                retryable: error.retryable,
            });
            // Retry if needed
            if (error.retryable && retryCount < 2) {
                logger.info(`Retrying audit`, { auditId, retryCount: retryCount + 1 });
                await auditQueue.add('audit', {
                    url,
                    auditId,
                    retryCount: retryCount + 1,
                });
            }
            return {
                url,
                auditId,
                status: 'failed',
                error: error.message,
                executionTime,
            };
        }
        logger.error(`Audit failed with unexpected error`, {
            auditId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return {
            url,
            auditId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime,
        };
    }
}
// Get job status
export async function getJobStatus(jobId) {
    const job = await auditQueue.getJob(jobId);
    if (!job) {
        throw new AuditError({
            message: 'Job not found',
            code: ErrorCodes.JOB_NOT_FOUND,
            retryable: false,
        });
    }
    const state = await job.getState();
    const progress = await job.progress;
    return {
        status: state,
        progress: typeof progress === 'number' ? progress : 0,
        result: job.returnvalue,
        error: job.failedReason,
    };
}
// Get queue stats
export async function getQueueStats() {
    return {
        waiting: await auditQueue.getWaitingCount(),
        active: await auditQueue.getActiveCount(),
        completed: await auditQueue.getCompletedCount(),
        failed: await auditQueue.getFailedCount(),
        delayed: await auditQueue.getDelayedCount(),
    };
}
logger.info('Queue service initialized');
//# sourceMappingURL=queue.service.js.map