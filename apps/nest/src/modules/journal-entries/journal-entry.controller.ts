import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ValidationMessagesError } from '../../lib/errors.js';
import { parseJournalEntryBody, parseNextTransactionNumberQuery } from './journal-entry.schemas.js';
import { JournalEntryService } from './journal-entry.service.js';
import {
    CreateJournalEntryResponse,
    GetJournalEntryResponse,
    MessageResponse,
    NextTransactionNumberResponse,
} from './journal-entry.types.js';

const MAX_KEYWORD_LENGTH = 100;

/** Setara JournalEntryController sumber. Rute statis ditaruh sebelum `:id`. */
@Controller('journal-entry')
export class JournalEntryController {
    constructor(private readonly service: JournalEntryService) { }

    @Get('search-descriptions')
    async searchDescriptions(
        @Headers('x-user-id') userId: string,
        @Query('q') q?: string,
    ): Promise<string[]> {
        const keyword = typeof q === 'string' ? q : '';
        if (keyword.length > MAX_KEYWORD_LENGTH) {
            throw new ValidationMessagesError([
                `Search keyword must not exceed ${MAX_KEYWORD_LENGTH} characters.`,
            ]);
        }
        return this.service.searchDescriptions(userId, keyword);
    }

    @Get('next-transaction-number')
    async nextTransactionNumber(
        @Headers('x-user-id') userId: string,
        @Query() query: Record<string, unknown>,
    ): Promise<NextTransactionNumberResponse> {
        const parsed = parseNextTransactionNumberQuery(query);
        const transactionNumber = await this.service.peekNextTransactionNumber(
            userId,
            parsed.journalType ?? 'General',
            parsed.entryDate,
        );
        return { success: true, transactionNumber };
    }

    @Get(':id')
    async getById(
        @Headers('x-user-id') userId: string,
        @Param('id', new ParseIntPipe({ errorHttpStatusCode: 404 })) id: number,
    ): Promise<GetJournalEntryResponse> {
        return { success: true, entry: await this.service.findOne(userId, id) };
    }

    @Post('create')
    @HttpCode(200)
    create(
        @Headers('x-user-id') userId: string,
        @Body() body: unknown,
    ): Promise<CreateJournalEntryResponse> {
        return this.service.create(userId, parseJournalEntryBody(body, 'create'));
    }

    @Put('edit/:id')
    update(
        @Headers('x-user-id') userId: string,
        @Param('id', new ParseIntPipe({ errorHttpStatusCode: 404 })) id: number,
        @Body() body: unknown,
    ): Promise<MessageResponse> {
        return this.service.update(userId, id, parseJournalEntryBody(body, 'update'));
    }

    @Delete('delete/:id')
    remove(
        @Headers('x-user-id') userId: string,
        @Param('id', new ParseIntPipe({ errorHttpStatusCode: 404 })) id: number,
    ): Promise<MessageResponse> {
        return this.service.remove(userId, id);
    }
}
