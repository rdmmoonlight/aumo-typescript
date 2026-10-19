import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module.js';
import { configureApp } from '../../app.setup.js';
import { AuthService } from '../../modules/auth/auth.service.js';

export type AuthServiceMock = Record<keyof AuthService, ReturnType<typeof import('vitest').vi.fn>>;

/** Membuat aplikasi Nest utuh (pipeline + filter + guard) dengan AuthService opsional di-mock. */
export async function createTestApp(authServiceMock?: Partial<AuthServiceMock>) {
  if (authServiceMock) {
    (globalThis as typeof globalThis & { __AUTH_SERVICE_MOCK__?: unknown }).__AUTH_SERVICE_MOCK__ =
      authServiceMock;
  }
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (authServiceMock) {
    builder = builder.overrideProvider(AuthService).useValue(authServiceMock);
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app);
  await app.init();
  return app;
}
