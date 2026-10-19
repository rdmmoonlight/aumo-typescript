import { Queue, Worker } from 'bullmq';
import { logger } from './logger.js';
import { redis } from './redis.js';
let reportQueue = null;
let reportWorker = null;
export function initQueueWorkers() {
    try {
        reportQueue = new Queue('reports', { connection: redis });
        reportWorker = new Worker('reports', async (job) => {
            logger.info({ jobId: job.id }, 'Processing report job');
        }, { connection: redis });
        reportWorker.on('ready', () => {
            logger.info('BullMQ Worker berhasil dijalankan');
        });
        reportWorker.on('failed', (job, err) => {
            logger.error({ jobId: job?.id, err }, 'Worker failed processing job');
        });
    }
    catch (e) {
        logger.error({ err: e }, 'Queue initialization failed');
    }
}
export async function closeQueue() {
    try {
        if (reportWorker)
            await reportWorker.close();
        if (reportQueue)
            await reportQueue.close();
        logger.info('Queue connections closed');
    }
    catch (e) {
        logger.error({ err: e }, 'Failed to close queue connections');
    }
}
export { reportQueue };
//# sourceMappingURL=queue.js.map