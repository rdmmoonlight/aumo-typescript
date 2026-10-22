import {
    Body,
    Controller,
    Get,
    Header,
    Headers,
    HttpStatus,
    Post,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
    importJournalEntriesSchema,
    previewJournalImportSchema,
} from './tools.schemas.js';
import { ToolsService } from './tools.service.js';
import { ImportResponse, PreviewResponse } from './tools.types.js';

@Controller('tools')
export class ToolsController {
    constructor(private readonly toolsService: ToolsService) { }

    @Get('download-journal-template')
    @Header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    @Header('Content-Disposition', 'attachment; filename="JournalImportTemplate.xlsx"')
    async downloadJournalTemplate(@Res() res: Response) {
        const buffer = await this.toolsService.generateJournalTemplate();
        res.status(HttpStatus.OK).send(buffer);
    }

    @Post('preview-journal-import')
    async previewJournalImport(
        @Headers('x-user-id') userId: string,
        @Body() body: unknown,
    ): Promise<PreviewResponse> {
        const parsed = previewJournalImportSchema.parse(body);
        const data = await this.toolsService.previewImport(userId, parsed as any);
        return {
            success: true,
            message: 'Preview berhasil dibuat',
            data,
        };
    }

    @Post('import-journal-entries')
    async importJournalEntries(
        @Headers('x-user-id') userId: string,
        @Body() body: unknown,
    ): Promise<ImportResponse> {
        const parsed = importJournalEntriesSchema.parse(body);
        const result = await this.toolsService.importEntries(userId, parsed as any);
        return {
            success: true,
            message: result.message,
            data: result,
        };
    }
}