import { Global, Module, type Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { vi, type Mock } from 'vitest';
import { GlobalExceptionFilter } from '../../common/filters/global-exception.filter.js';
import { UserIdGuard } from '../../common/guards/user-id.guard.js';
import { DRIZZLE_DEV } from '../../modules/drizzle/drizzle.constants.js';

export interface FakeDb {
    select: Mock;
    update: Mock;
    execute: Mock;
    builder: { limit: Mock; where: Mock; set: Mock; returning: Mock };
}

/**
 * DB palsu. Objek akarnya sengaja BUKAN thenable (Nest akan meng-await provider thenable);
 * builder query yang dikembalikan select()/update() yang dapat di-await.
 */
export function createFakeDb(result: unknown[] = []) {
    const builder: Record<string, Mock | ((...args: never[]) => unknown)> = {};
    for (const m of ['from', 'where', 'orderBy', 'limit', 'set']) {
        builder[m] = vi.fn(() => builder);
    }
    builder.returning = vi.fn(() => Promise.resolve(result));
    builder.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(result).then(res, rej);

    return {
        select: vi.fn(() => builder),
        update: vi.fn(() => builder),
        execute: vi.fn().mockResolvedValue([]),
        builder,
    } as FakeDb;
}

/** Membuat aplikasi Nest dari modul tertentu saja, lengkap dengan guard dan filter global. */
export async function createModuleApp(modules: Type[], db: unknown = createFakeDb()) {
    @Global()
    @Module({ providers: [{ provide: DRIZZLE_DEV, useValue: db }], exports: [DRIZZLE_DEV] })
    class FakeDrizzleModule { }

    const moduleRef = await Test.createTestingModule({
        imports: [ConfigModule.forRoot({ isGlobal: true }), FakeDrizzleModule, ...modules],
        providers: [
            { provide: APP_GUARD, useClass: UserIdGuard },
            { provide: APP_FILTER, useClass: GlobalExceptionFilter },
        ],
    }).compile();

    const app = moduleRef.createNestApplication<NestExpressApplication>();
    await app.init();
    return app;
}
