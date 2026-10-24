import { Body, Controller, Get, Headers, Header, HttpCode, Post, StreamableFile } from '@nestjs/common';
import { parseJournalImportBody } from './tools.schemas.js';
import { ToolsService } from './tools.service.js';
import { ImportResponse, PreviewResponse } from './tools.types.js';

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Setara ToolsController sumber. Hasil dikembalikan apa adanya (tanpa pembungkus success/data). */
@Controller('tools')
export class ToolsController {
    constructor(private readonly toolsService: ToolsService) { }

    @Get('download-journal-template')
    @Header('Content-Type', XLSX_TYPE)
    @Header('Content-Disposition', 'attachment; filename="JournalImportTemplate.xlsx"')
    async downloadJournalTemplate(): Promise<StreamableFile> {
        return new StreamableFile(await this.toolsService.generateJournalTemplate());
    }

    @Post('preview-journal-import')
    @HttpCode(200)
    previewJournalImport(
        @Headers('x-user-id') userId: string,
        @Body() body: unknown,
    ): Promise<PreviewResponse> {
        return this.toolsService.previewImport(userId, parseJournalImportBody(body));
    }

    @Post('import-journal-entries')
    @HttpCode(200)
    importJournalEntries(
        @Headers('x-user-id') userId: string,
        @Body() body: unknown,
    ): Promise<ImportResponse> {
        return this.toolsService.importEntries(userId, parseJournalImportBody(body));
    }
}
