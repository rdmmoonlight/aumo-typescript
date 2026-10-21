Berikut adalah template kerangka modul untuk NestJS mengikuti pola modul periods:
**1. Schema Database (Opsional - bila ada tabel baru)**
apps/nest/src/db/schema/items.ts
```typescript
import { pgTable, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

```
**2. Zod Schemas**
apps/nest/src/modules/items/items.schemas.ts
```typescript
import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateItemSchema = createItemSchema.partial();

export const itemQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;
export type ItemQueryDto = z.infer<typeof itemQuerySchema>;

```
**3. Types**
apps/nest/src/modules/items/items.types.ts
```typescript
export interface ItemResponse {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedItemsResponse {
  data: ItemResponse[];
  total: number;
  page: number;
  limit: number;
}

```
**4. Service**
apps/nest/src/modules/items/items.service.ts
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemDto, UpdateItemDto, ItemQueryDto } from './items.schemas';
import { ItemResponse, PaginatedItemsResponse } from './items.types';

@Injectable()
export class ItemsService {
  async findAll(query: ItemQueryDto): Promise<PaginatedItemsResponse> {
    return {
      data: [],
      total: 0,
      page: query.page,
      limit: query.limit,
    };
  }

  async findOne(id: string): Promise<ItemResponse> {
    // throw new NotFoundException(`Item with ID ${id} not found`);
    return {
      id,
      name: 'Sample Item',
      description: 'Sample description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async create(dto: CreateItemDto): Promise<ItemResponse> {
    return {
      id: 'generated-uuid',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update(id: string, dto: UpdateItemDto): Promise<ItemResponse> {
    return {
      id,
      name: dto.name ?? 'Updated Item',
      description: dto.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async remove(id: string): Promise<void> {
    return;
  }
}

```
**5. Controller**
apps/nest/src/modules/items/items.controller.ts
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ItemsService } from './items.service';
import { createItemSchema, updateItemSchema, itemQuerySchema } from './items.schemas';
import { ItemResponse, PaginatedItemsResponse } from './items.types';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  async findAll(@Query() query: unknown): Promise<PaginatedItemsResponse> {
    const parsedQuery = itemQuerySchema.parse(query);
    return this.itemsService.findAll(parsedQuery);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ItemResponse> {
    return this.itemsService.findOne(id);
  }

  @Post()
  async create(@Body() body: unknown): Promise<ItemResponse> {
    const parsedBody = createItemSchema.parse(body);
    return this.itemsService.create(parsedBody);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: unknown): Promise<ItemResponse> {
    const parsedBody = updateItemSchema.parse(body);
    return this.itemsService.update(id, parsedBody);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.itemsService.remove(id);
  }
}

```
**6. Module**
apps/nest/src/modules/items/items.module.ts
```typescript
import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}

```
**7. Test**
apps/nest/src/test/items.test.ts
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ItemsService } from '../modules/items/items.service';

describe('ItemsService', () => {
  let service: ItemsService;

  beforeEach(() => {
    service = new ItemsService();
  });

  it('should return paginated items', async () => {
    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result).toHaveProperty('data');
    expect(result.page).toBe(1);
  });
});

```
**8. Pendaftaran Modul Utama**
apps/nest/src/app.module.ts
```typescript
import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { PeriodsModule } from './modules/periods/periods.module';
import { ItemsModule } from './modules/items/items.module';

@Module({
  imports: [
    HealthModule,
    PeriodsModule,
    ItemsModule,
  ],
})
export class AppModule {}

```
