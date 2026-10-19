import { vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
process.env.JWT_SIGNING_KEY = 'mock-jwt-signing-key-super-secret';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.AUTH_RATE_LIMIT_MAX = '100';
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

// Better Auth tidak menyentuh database saat testing
vi.mock('../lib/auth.js', () => ({
  auth: {
    handler: vi.fn(async (req: Request) =>
      Response.json({ handledBy: 'better-auth', path: new URL(req.url).pathname })
    ),
    $context: Promise.resolve({ internalAdapter: { findUserByEmail: vi.fn() } }),
    api: {
      getSession: vi.fn(),
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
      signOut: vi.fn(),
      changePassword: vi.fn(),
      listSessions: vi.fn(),
      revokeSession: vi.fn(),
      revokeOtherSessions: vi.fn(),
    },
  },
}));

// TODO: ensure 413 handler returns {success:false, message:'Ukuran request terlalu besar'}
