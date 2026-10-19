import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module.js';
import { configureApp } from '../../app.setup.js';

/** Membuat aplikasi Nest utuh (pipeline + filter + guard) untuk pengujian. */
export async function createTestApp() {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureApp(app);
    await app.init();
    return app;
}