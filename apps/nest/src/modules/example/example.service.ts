import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExampleDto, QueryExampleDto } from './example.schemas.js';
import { ExampleDto } from './example.types.js';

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