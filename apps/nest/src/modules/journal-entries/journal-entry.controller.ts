import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    Param,
    ParseIntPipe,
    Post, Put,
    Query,
} from '@nestjs/common';
import {
    createJournalEntrySchema,
    nextTransactionNumberSchema,
    searchDescriptionsSchema,
    updateJournalEntrySchema,
} from './journal-entry.schemas.js';
import { JournalEntryService } from './journal-entry.service.js';

@Controller('journal-entry')
export class JournalEntryController {
    constructor(private readonly journalEntryService: JournalEntryService) { }

    @Get('search-descriptions')
    async searchDescriptions(@Headers('x-user-id') userId: string, @Query() query: Record<string, unknown>) {
        const parsed = searchDescriptionsSchema.parse(query);
        const data = await this.journalEntryService.searchDescriptions(userId, parsed.q);
        return data;
    }

    @Get('next-transaction-number')
    async getNextTransactionNumber(@Headers('x-user-id') userId: string, @Query() query: Record<string, unknown>) {
        const parsed = nextTransactionNumberSchema.parse(query);
        const nextNumber = await this.journalEntryService.peekNextNumber(
            userId, parsed.journalType ?? 'General', parsed.entryDate ?? new Date(),
        );
        return { success: true, transactionNumber: nextNumber };
    }

    @Get(':id')
    async getById(@Headers('x-user-id') userId: string, @Param('id', ParseIntPipe) id: number) {
        const entry = await this.journalEntryService.findOne(userId, id);
        return { success: true, entry };
    }

    @Post('create')
    async create(@Headers('x-user-id') userId: string, @Body() body: unknown) {
        const parsed = createJournalEntrySchema.parse(body);
        const result = await this.journalEntryService.create(userId, parsed);
        return {
            success: true,
            message: `Journal entry ${result.transactionNumber} has been posted.`,
            entryId: result.entryId,
            transactionNumber: result.transactionNumber,
        };
    }

    @Put('edit/:id')
    async edit(@Headers('x-user-id') userId: string, @Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
        const parsed = updateJournalEntrySchema.parse(body);
        const result = await this.journalEntryService.update(userId, id, parsed);
        return { success: true, message: `Journal entry ${result.transactionNumber} updated successfully.` };
    }

    @Delete('delete/:id')
    async delete(@Headers('x-user-id') userId: string, @Param('id', ParseIntPipe) id: number) {
        const result = await this.journalEntryService.delete(userId, id);
        return { success: true, message: `Journal entry ${result.transactionNumber} deleted successfully.` };
    }
}