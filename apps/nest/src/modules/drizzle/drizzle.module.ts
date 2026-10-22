import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DRIZZLE_DEV } from './drizzle.constants.js';

@Global()
@Module({})
export class DrizzleModule {
    static register(): DynamicModule {
        return {
            module: DrizzleModule,
            providers: [
                {
                    provide: DRIZZLE_DEV,
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => {
                        const connectionString = configService.get<string>('DATABASE_URL');
                        const pool = new Pool({
                            connectionString,
                        });

                        return drizzle(pool);
                    },
                },
            ],
            exports: [DRIZZLE_DEV],
        };
    }
}