import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, isNotNull, max, ne, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AppError, ValidationMessagesError } from '../../lib/errors.js';
import { formatDotNetDate } from '../../common/utils/dotnet-date.js';
import { chartOfAccounts } from '../../db/schema/chart-of-accounts.js';
import { generalJournal } from '../../db/schema/general-journal.js';
import { periods } from '../../db/schema/periods.js';
import { transactionCounters } from '../../db/schema/transaction-counters.js';
import { InjectDrizzle } from '../drizzle/drizzle.decorator.js';
import { buildJournalRows, nextJournalEntryId, POSTED_STATUS } from './general-journal.writer.js';
import { JournalEntryInput, JournalLineInput } from './journal-entry.schemas.js';
import {
    effectiveLines,
    ENTRY_DATE_MESSAGE,
    isValidJournalTypeOrEmpty,
    JOURNAL_TYPE_MESSAGE,
    validateJournalEntry,
} from './journal-entry.validation.js';
import { CreateJournalEntryResponse, JournalEntryDto, MessageResponse } from './journal-entry.types.js';

const MAX_SEQUENCE = 9999;

type Row = typeof generalJournal.$inferSelect;
type ClosedPeriod = { startDate: Date; endDate: Date };

/** Setara PeriodLock.IsDateLocked: tanggal berada di rentang periode yang sudah ditutup. */
export function isDateLocked(date: Date, closedPeriods: ClosedPeriod[]): boolean {
    const time = date.getTime();
    return closedPeriods.some((p) => time >= p.startDate.getTime() && time <= p.endDate.getTime());
}

/** Setara TransactionNumberService: AJ untuk Adjusting, selain itu GJ; kunci = prefix + yyMM. */
export function counterKeyFor(journalType: string, entryDate: Date): string {
    const prefix = journalType === 'Adjusting' ? 'AJ' : 'GJ';
    const yy = String(entryDate.getUTCFullYear() % 100).padStart(2, '0');
    const mm = String(entryDate.getUTCMonth() + 1).padStart(2, '0');
    return `${prefix}${yy}${mm}`;
}

function formatSequence(counterKey: string, sequence: number): string {
    return `${counterKey}${String(sequence).padStart(4, '0')}`;
}

@Injectable()
export class JournalEntryService {
    constructor(@InjectDrizzle() private readonly db: NodePgDatabase) { }

    private async closedPeriods(userId: string): Promise<ClosedPeriod[]> {
        return this.db
            .select({ startDate: periods.startDate, endDate: periods.endDate })
            .from(periods)
            .where(and(eq(periods.userId, userId), eq(periods.isClosed, true)));
    }

    private async rowsOf(userId: string, journalEntryId: number): Promise<Row[]> {
        return this.db
            .select()
            .from(generalJournal)
            .where(and(eq(generalJournal.journalEntryId, journalEntryId), eq(generalJournal.userId, userId)))
            .orderBy(asc(generalJournal.lineOrder));
    }

    private async assertAccountsValid(userId: string, lines: JournalLineInput[]): Promise<void> {
        const valid = await this.db
            .select({ id: chartOfAccounts.id })
            .from(chartOfAccounts)
            .where(and(eq(chartOfAccounts.userId, userId), eq(chartOfAccounts.isActive, true)));
        const ids = new Set(valid.map((a) => a.id));
        if (lines.some((l) => !ids.has(l.accountId))) {
            throw new AppError('One or more selected accounts are invalid or inactive.', 400);
        }
    }

    async findOne(userId: string, id: number): Promise<JournalEntryDto> {
        const rows = await this.rowsOf(userId, id);
        if (rows.length === 0) throw new AppError('Journal entry not found.', 404);

        const first = rows[0];
        const locked = isDateLocked(first.entryDate, await this.closedPeriods(userId));
        return {
            id: first.journalEntryId,
            transactionNumber: first.transactionNumber,
            journalType: first.journalType,
            entryDate: formatDotNetDate(first.entryDate),
            createdAt: formatDotNetDate(first.createdAt),
            updatedAt: first.updatedAt ? formatDotNetDate(first.updatedAt) : null,
            isLocked: locked,
            lines: rows.map((l) => ({
                id: l.lineId,
                accountId: l.accountId,
                lineDescription: l.lineDescription,
                debit: Number(l.debit),
                credit: Number(l.credit),
                lineOrder: l.lineOrder,
            })),
        };
    }

    async create(userId: string, input: JournalEntryInput): Promise<CreateJournalEntryResponse> {
        const errors = validateJournalEntry(input);
        if (errors.length > 0) throw new ValidationMessagesError(errors);

        const lines = effectiveLines(input.lines ?? []);
        await this.assertAccountsValid(userId, lines);

        if (isDateLocked(input.entryDate, await this.closedPeriods(userId))) {
            throw new AppError(
                'This date falls within a closed accounting period. Choose a date in an open period.',
                400,
            );
        }

        const journalType = input.journalType.trim() === '' ? 'General' : input.journalType;
        const transactionNumber = await this.generateTransactionNumber(userId, journalType, input.entryDate);
        const createdAt = input.clientTimestamp ?? new Date();
        const journalEntryId = await nextJournalEntryId(this.db);

        await this.db.insert(generalJournal).values(
            buildJournalRows({
                journalEntryId, userId, transactionNumber, journalType,
                entryDate: input.entryDate, createdAt, updatedAt: null, lines,
            }),
        );

        return {
            success: true,
            message: `Journal entry ${transactionNumber} has been posted.`,
            entryId: journalEntryId,
            transactionNumber,
        };
    }

    async update(userId: string, id: number, input: JournalEntryInput): Promise<MessageResponse> {
        const errors = validateJournalEntry(input);
        if (errors.length > 0) throw new ValidationMessagesError(errors);

        const existing = await this.rowsOf(userId, id);
        if (existing.length === 0) throw new AppError('Journal entry not found.', 404);
        const header = existing[0];

        const closed = await this.closedPeriods(userId);
        if (isDateLocked(header.entryDate, closed) || isDateLocked(input.entryDate, closed)) {
            throw new AppError(
                `Journal entry ${header.transactionNumber} falls within a closed period and cannot be modified.`,
                400,
            );
        }

        const lines = effectiveLines(input.lines ?? []);
        await this.assertAccountsValid(userId, lines);

        const journalType = input.journalType.trim() === '' ? header.journalType : input.journalType;
        const updatedAt = input.clientTimestamp ?? new Date();
        const newRows = buildJournalRows({
            journalEntryId: header.journalEntryId, userId, transactionNumber: header.transactionNumber,
            journalType, entryDate: input.entryDate, createdAt: header.createdAt, updatedAt, lines,
            status: header.status ?? POSTED_STATUS,
        });

        // Hapus baris lama dan tambah baris baru dalam satu transaksi (seperti satu SaveChanges di sumber).
        await this.db.transaction(async (tx) => {
            await tx
                .delete(generalJournal)
                .where(and(eq(generalJournal.journalEntryId, id), eq(generalJournal.userId, userId)));
            await tx.insert(generalJournal).values(newRows);
        });

        return { success: true, message: `Journal entry ${header.transactionNumber} updated successfully.` };
    }

    async remove(userId: string, id: number): Promise<MessageResponse> {
        const rows = await this.rowsOf(userId, id);
        if (rows.length === 0) throw new AppError('Journal entry not found.', 404);

        if (isDateLocked(rows[0].entryDate, await this.closedPeriods(userId))) {
            throw new AppError('Cannot delete transactions in closed accounting periods.', 400);
        }

        await this.db
            .delete(generalJournal)
            .where(and(eq(generalJournal.journalEntryId, id), eq(generalJournal.userId, userId)));
        return { success: true, message: `Journal entry ${rows[0].transactionNumber} deleted successfully.` };
    }

    async searchDescriptions(userId: string, q: string): Promise<string[]> {
        const keyword = q.trim();
        if (keyword.length < 2) return [];

        const rows = await this.db
            .select({ description: generalJournal.lineDescription })
            .from(generalJournal)
            .where(
                and(
                    eq(generalJournal.userId, userId),
                    isNotNull(generalJournal.lineDescription),
                    ne(generalJournal.lineDescription, ''),
                    ilike(generalJournal.lineDescription, `%${keyword}%`),
                ),
            )
            .groupBy(generalJournal.lineDescription)
            .orderBy(desc(count()), desc(max(generalJournal.lineId)))
            .limit(8);
        return rows.map((r) => r.description as string);
    }

    /** Setara PeekNextAsync: tidak menaikkan counter. */
    async peekNextTransactionNumber(
        userId: string,
        journalType: string | undefined,
        entryDate: Date | undefined,
    ): Promise<string> {
        if (!isValidJournalTypeOrEmpty(journalType)) {
            throw new ValidationMessagesError([JOURNAL_TYPE_MESSAGE]);
        }
        const type = journalType === undefined || journalType.trim() === '' ? 'General' : journalType;
        const date = entryDate ?? startOfTodayUtc();
        const time = date.getTime();
        if (!(time >= Date.UTC(2000, 0, 1) && time <= Date.UTC(2100, 11, 31))) {
            throw new ValidationMessagesError([ENTRY_DATE_MESSAGE]);
        }

        const key = counterKeyFor(type, date);
        const [row] = await this.db
            .select({ lastSequence: transactionCounters.lastSequence })
            .from(transactionCounters)
            .where(and(eq(transactionCounters.userId, userId), eq(transactionCounters.counterKey, key)))
            .limit(1);
        return formatSequence(key, (row?.lastSequence ?? 0) + 1);
    }

    /** Setara GenerateAsync: upsert atomik pada counter, lalu ambil nomor urut. */
    private async generateTransactionNumber(userId: string, journalType: string, entryDate: Date): Promise<string> {
        const key = counterKeyFor(journalType, entryDate);
        const [row] = await this.db
            .insert(transactionCounters)
            .values({ userId, counterKey: key, lastSequence: 1 })
            .onConflictDoUpdate({
                target: [transactionCounters.userId, transactionCounters.counterKey],
                set: { lastSequence: sql`${transactionCounters.lastSequence} + 1` },
            })
            .returning({ lastSequence: transactionCounters.lastSequence });

        if (row.lastSequence > MAX_SEQUENCE) {
            throw new Error(`Transaction number sequence for ${key} has reached its ${MAX_SEQUENCE} capacity.`);
        }
        return formatSequence(key, row.lastSequence);
    }
}

function startOfTodayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
