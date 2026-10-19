import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { closeQueue, initQueueWorkers } from './lib/queue.js';
import { redis } from './lib/redis.js';
process.on('uncaughtException', (err) => {
    try {
        logger.fatal({ err }, 'Uncaught Exception');
    }
    catch { }
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    try {
        logger.error({ reason }, 'Unhandled Rejection');
    }
    catch { }
});
async function bootstrap() {
    try {
        initQueueWorkers();
        const app = await NestFactory.create(AppModule, {
            logger: false,
            bodyParser: false,
            abortOnError: false,
        });
        configureApp(app);
        const config = new DocumentBuilder()
            .setTitle('Aumone API')
            .setDescription('Dokumentasi API')
            .setVersion('2.0.0')
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('openapi', app, document, { ui: false, jsonDocumentUrl: 'openapi.json' });
        app.use('/reference', apiReference({ spec: { content: document } }));
        const host = '0.0.0.0';
        await app.listen(env.PORT, host);
        const displayHost = host === '0.0.0.0' ? 'localhost' : host;
        logger.info(`Server berjalan di http://${displayHost}:${env.PORT}`);
        let isShuttingDown = false;
        const shutdown = async (signal) => {
            if (isShuttingDown)
                return;
            isShuttingDown = true;
            logger.info(`${signal} diterima, menutup server...`);
            const forceExit = setTimeout(() => {
                logger.error('Penutupan paksa karena batas waktu graceful shutdown terlampaui.');
                process.exit(1);
            }, 10_000);
            forceExit.unref();
            try {
                await app.close();
                logger.info('Server HTTP berhasil ditutup.');
                await closeQueue();
                await redis.quit();
                logger.info('Koneksi Redis berhasil ditutup.');
                process.exit(0);
            }
            catch (err) {
                logger.error({ err }, 'Gagal menutup koneksi server/Redis/Queue');
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => void shutdown('SIGTERM'));
        process.on('SIGINT', () => void shutdown('SIGINT'));
    }
    catch (err) {
        try {
            logger.fatal({ err }, 'Bootstrap failed');
        }
        catch { }
        setTimeout(() => process.exit(1), 500);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map