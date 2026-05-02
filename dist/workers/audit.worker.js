import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processAuditJob } from '../lib/queue.service.js';
import { logger } from '../utils/logger.js';
// Redis connection
const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});
// Create worker
export const auditWorker = new Worker('audit-queue', async (job) => {
    logger.info(`Worker processing job ${job.id}`, {
        jobId: job.id,
        url: job.data.url,
        auditId: job.data.auditId,
    });
    try {
        const result = await processAuditJob(job);
        logger.info(`Worker completed job ${job.id}`, { auditId: job.data.auditId });
        return result;
    }
    catch (error) {
        logger.error(`Worker failed job ${job.id}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            auditId: job.data.auditId,
        });
        throw error;
    }
}, {
    connection: redisConnection,
    concurrency: 3, // Process 3 audits concurrently
});
// Event handlers
auditWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
});
auditWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed`, {
        error: err.message,
        stack: err.stack,
    });
});
auditWorker.on('error', (err) => {
    logger.error('Worker error', { error: err.message });
});
logger.info('Audit worker started');
//# sourceMappingURL=audit.worker.js.map