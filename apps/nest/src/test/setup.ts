import { vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.BODY_LIMIT_BYTES = '1024';
process.env.REDIS_URL = 'redis://localhost:6379';

// Redis tidak pernah dihubungi saat testing
vi.mock('../lib/redis.js', () => {
  const exec = vi.fn().mockResolvedValue([
    [null, 1],
    [null, 60_000],
  ]);
  const chain = { incr: vi.fn(), pttl: vi.fn(), exec };
  chain.incr.mockReturnValue(chain);
  chain.pttl.mockReturnValue(chain);
  return {
    redis: { pipeline: vi.fn(() => chain), pexpire: vi.fn(), quit: vi.fn(), on: vi.fn() },
  };
});
