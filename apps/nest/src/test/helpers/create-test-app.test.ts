import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module.js';
import { configureApp } from '../../app.setup.js';
import { DRIZZLE_DEV } from '../../modules/drizzle/drizzle.constants.js';
import { createFakeDb } from './create-module-app.js';

/** Membuat aplikasi Nest utuh (pipeline + filter + guard) untuk pengujian. */
export async function createTestApp() {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
    })
        // /health menjalankan SELECT 1; tes pipeline tidak butuh PostgreSQL sungguhan.
        .overrideProvider(DRIZZLE_DEV)
        .useValue(createFakeDb())
        .compile();

    const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureApp(app);
    await app.init();
    return app;
}