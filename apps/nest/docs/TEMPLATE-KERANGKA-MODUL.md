Berikut adalah template kerangka modul yang sudah disesuaikan dengan konvensi @app/nest, menggunakan Guard X-User-Id universal, penandaan rute publik via Decorator @Public(), serta format respons standar { success, data, message }.
### 1. Public Decorator & Guard
**apps/nest/src/common/decorators/public.decorator.ts**
```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

```
**apps/nest/src/common/guards/user-id.guard.ts**
```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class UserIdGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new UnauthorizedException({
        success: false,
        message: 'Header X-User-Id wajib diisi',
      });
    }

    request.userId = userId;
    return true;
  }
}

```
### 2. Tipe Respons Standar
**apps/nest/src/common/types/api-response.type.ts**
```typescript
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
}

```
### 3. Modul Target Contoh (example)
**apps/nest/src/modules/example/example.types.ts**
```typescript
import { ApiResponse } from '../../common/types/api-response.type';

export interface ExampleDto {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export type ExampleResponse = ApiResponse<ExampleDto>;
export type ExampleListResponse = ApiResponse<ExampleDto[]>;

```
**apps/nest/src/modules/example/example.schemas.ts**
```typescript
import { z } from 'zod';

export const createExampleSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().optional(),
});

export const queryExampleSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type CreateExampleDto = z.infer<typeof createExampleSchema>;
export type QueryExampleDto = z.infer<typeof queryExampleSchema>;

```
**apps/nest/src/modules/example/example.service.ts**
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExampleDto, QueryExampleDto } from './example.schemas';
import { ExampleDto } from './example.types';

@Injectable()
export class ExampleService {
  async findAll(userId: string, query: QueryExampleDto): Promise<ExampleDto[]> {
    return [
      {
        id: '1',
        name: 'Contoh Data',
        description: `Page: ${query.page}, Limit: ${query.limit}`,
        createdAt: new Date(),
      },
    ];
  }

  async findOne(id: string): Promise<ExampleDto> {
    if (id === 'not-found') {
      throw new NotFoundException({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    return {
      id,
      name: 'Contoh Data Single',
      createdAt: new Date(),
    };
  }

  async create(userId: string, dto: CreateExampleDto): Promise<ExampleDto> {
    return {
      id: 'generated-id',
      name: dto.name,
      description: dto.description,
      createdAt: new Date(),
    };
  }
}

```
**apps/nest/src/modules/example/example.controller.ts**
```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UsePipes,
} from '@nestjs/common';
import { ExampleService } from './example.service';
import {
  createExampleSchema,
  queryExampleSchema,
  CreateExampleDto,
  QueryExampleDto,
} from './example.schemas';
import { ExampleResponse, ExampleListResponse } from './example.types';
import { Public } from '../../common/decorators/public.decorator';

@Controller('examples')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Get('public-info')
  @Public()
  async getPublicInfo(): Promise<ExampleResponse> {
    return {
      success: true,
      message: 'Informasi publik berhasil diambil',
      data: {
        id: '0',
        name: 'Public Config',
        createdAt: new Date(),
      },
    };
  }

  @Get()
  async findAll(
    @Headers('x-user-id') userId: string,
    @Query() query: QueryExampleDto,
  ): Promise<ExampleListResponse> {
    const parsedQuery = queryExampleSchema.parse(query);
    const data = await this.exampleService.findAll(userId, parsedQuery);

    return {
      success: true,
      message: 'Daftar data berhasil diambil',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ExampleResponse> {
    const data = await this.exampleService.findOne(id);

    return {
      success: true,
      message: 'Detail data berhasil diambil',
      data,
    };
  }

  @Post()
  async create(
    @Headers('x-user-id') userId: string,
    @Body() body: CreateExampleDto,
  ): Promise<ExampleResponse> {
    const parsedBody = createExampleSchema.parse(body);
    const data = await this.exampleService.create(userId, parsedBody);

    return {
      success: true,
      message: 'Data berhasil dibuat',
      data,
    };
  }
}

```
**apps/nest/src/modules/example/example.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';

@Module({
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService],
})
export class ExampleModule {}

```
### 4. Skema Database Drizzle (Bila Ada Tabel Baru)
**apps/nest/src/db/schema/examples.ts**
```typescript
import { pgTable, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const examples = pgTable('examples', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

```
### 5. Pendaftaran Global Modul & Guard
**apps/nest/src/app.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './modules/health/health.module';
import { PeriodsModule } from './modules/periods/periods.module';
import { ExampleModule } from './modules/example/example.module';
import { UserIdGuard } from './common/guards/user-id.guard';

@Module({
  imports: [HealthModule, PeriodsModule, ExampleModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserIdGuard,
    },
  ],
})
export class AppModule {}

```
### 6. Pengujian Integration/Unit
**apps/nest/src/test/example.test.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { AppModule } from '../app.module';

describe('ExampleModule (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /examples/public-info - Tanpa X-User-Id (Harus Lolos)', async () => {
    const res = await request(app.getHttpServer()).get('/examples/public-info');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Informasi publik berhasil diambil',
      }),
    );
  });

  it('GET /examples - Tanpa X-User-Id (Harus Error 401)', async () => {
    const res = await request(app.getHttpServer()).get('/examples');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: 'Header X-User-Id wajib diisi',
    });
  });

  it('GET /examples - Dengan X-User-Id Valid', async () => {
    const res = await request(app.getHttpServer())
      .get('/examples')
      .set('X-User-Id', 'user-123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

```
