import {
    Body,
    Controller,
    Get,
    Headers,
    Param,
    Post,
    Query
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
import {
    CreateExampleDto,
    createExampleSchema,
    QueryExampleDto,
    queryExampleSchema,
} from './example.schemas.js';
import { ExampleService } from './example.service.js';
import { ExampleListResponse, ExampleResponse } from './example.types.js';

@Controller('examples')
export class ExampleController {
    constructor(private readonly exampleService: ExampleService) { }

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