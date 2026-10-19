import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL;

let redis: Redis;

if (!redisUrl) {
  console.error('REDIS: REDIS_URL missing, using mock');
  redis = {
    quit: async () => { },
    on: () => { },
    ping: async () => { },
  } as unknown as Redis;
} else {
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 5000,
      lazyConnect: true,
    });
  } catch (e: unknown) {
    console.error('REDIS: creation failed', e);
    redis = {
      quit: async () => { },
      on: () => { },
      ping: async () => { },
    } as unknown as Redis;
  }
}

export { redis };

