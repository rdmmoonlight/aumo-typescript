import { Queue } from 'bullmq';
import { redis } from './redis.js';

export const defaultQueue = new Queue('default', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

export async function addTransactionAnalyticsJob(data: { date: string; amount: number }) {
  await defaultQueue.add('transaction-analytics', data);
}