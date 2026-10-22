import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, ilike, max, sql } from 'drizzle-orm';
import { db } from '../../db/connection';
import { chartOfAccounts } from '../../db/schema/chart-of-accounts';
import { generalJournals } from '../../db/schema/general-journals';
import { periods } from '../../db/schema/periods';
import {
    CreateJournalEntryDto,
    JournalEntryLineInput,
    UpdateJournalEntryDto,
} from './journal-entry.schemas.js';
import { JournalEntryDto } from './journal-entry.types.js';

type ClosedPeriod = { startDate: Date; endDate: Date; isClosed: boolean };

function isDateLocked(date: Date, closedPeriods: ClosedPeriod[]): boolean {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return closedPeriods.some((p) => {
        if (!p.isClosed) return false;
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
    });
}

function buildTransactionNumber(
    journalType: string,
    entryDate: Date,
    sequence: number,
): string {
    const prefixMap: Record<string, string> = {
        General: 'JE',
        Sales: 'SJ',
        Purchase: 'PJ',
        Cash: 'CE',
        Bank: 'BE',
    };
    const prefix = prefixMap[journalType] ?? 'JE';
    const yyyy = entryDate.getFullYear();
    const mm = String(entryDate.getMonth() + 1).padStart(2, '0');
    return `${prefix}-${yyyy}${mm}-${String(sequence).padStart(4, '0')}`;
}

@Injectable()
export class JournalEntryService {
    async findOne(userId: string, journalEntryId: number): Promise<JournalEntryDto> {
        const rows = await db
            .select()
            .from(generalJournals)
            .where(
                and(
                    eq(generalJournals.journalEntryId, journalEntryId),
                    eq(generalJournals.userId, userId),
                ),
            )
            .orderBy(generalJournals.lineOrder);

        if (rows.length === 0) {
            throw new NotFoundException({
                success: false,
                message: 'Journal entry tidak ditemukan.',
            });
        }

        const closedPeriods = await db
            .select()
            .from(periods)
            .where(and(eq(periods.userId, userId), eq(periods.isClosed, true)));

        const isLocked = isDateLocked(rows[0].entryDate, closedPeriods as any);

        return {
            id: rows[0].journalEntryId,
            transactionNumber: rows[0].transactionNumber,
            journalType: rows[0].journalType,
            entryDate: rows[0].entryDate,
            createdAt: rows[0].createdAt,
            updatedAt: rows[0].updatedAt,
            isLocked,
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

    async create(userId: string, dto: CreateJournalEntryDto) {
        const effectiveLines = dto.lines.filter(
            (l) => l.accountId !== 0 && (l.debit !== 0 || l.credit !== 0),
        );
        await this.assertAccountsValid(userId, effectiveLines);

        const closedPeriods = await db
            .select()
            .from(periods)
            .where(and(eq(periods.userId, userId), eq(periods.isClosed, true)));

        if (isDateLocked(dto.entryDate, closedPeriods as any)) {
            throw new BadRequestException({
                success: false,
                message: 'Tanggal ini berada dalam periode akuntansi yang sudah ditutup.',
            });
        }

        const journalType = dto.journalType?.trim() || 'General';
        const transactionNumber = await this.generateTransactionNumber(
            userId, journalType, dto.entryDate,
        );
        const entryDate = new Date(dto.entryDate);
        const createdAt = dto.createdAt ? new Date(dto.createdAt) : new Date();
        const journalEntryId = await this.nextJournalEntryId();

        const rowsToInsert = this.buildRows(
            journalEntryId, userId, transactionNumber, journalType,
            entryDate, createdAt, null, effectiveLines,
        );

        await db.insert(generalJournals).values(rowsToInsert as any);
        return { entryId: journalEntryId, transactionNumber };
    }

    async update(userId: string, journalEntryId: number, dto: UpdateJournalEntryDto) {
        const existingRows = await db.select().from(generalJournals)
            .where(and(eq(generalJournals.journalEntryId, journalEntryId), eq(generalJournals.userId, userId)));
        if (existingRows.length === 0) throw new NotFoundException({ success: false, message: 'Journal entry tidak ditemukan.' });

        const header = existingRows[0];
        const closedPeriods = await db.select().from(periods)
            .where(and(eq(periods.userId, userId), eq(periods.isClosed, true)));

        if (isDateLocked(header.entryDate, closedPeriods as any) || isDateLocked(dto.entryDate, closedPeriods as any)) {
            throw new BadRequestException({
                success: false,
                message: `Journal entry ${header.transactionNumber} berada dalam periode tertutup dan tidak bisa dimodifikasi.`,
            });
        }

        const effectiveLines = dto.lines.filter(l => l.accountId !== 0 && (l.debit !== 0 || l.credit !== 0));
        await this.assertAccountsValid(userId, effectiveLines);

        const journalType = dto.journalType?.trim() || header.journalType;
        const entryDate = new Date(dto.entryDate);
        const updatedAt = dto.updatedAt ? new Date(dto.updatedAt) : new Date();

        const newRows = this.buildRows(header.journalEntryId, userId, header.transactionNumber, journalType, entryDate, header.createdAt, updatedAt, effectiveLines, header.status);

        await db.transaction(async (tx) => {
            await tx.delete(generalJournals).where(and(eq(generalJournals.journalEntryId, journalEntryId), eq(generalJournals.userId, userId)));
            await tx.insert(generalJournals).values(newRows as any);
        });
        return { transactionNumber: header.transactionNumber };
    }

    async delete(userId: string, journalEntryId: number) {
        const rows = await db.select().from(generalJournals)
            .where(and(eq(generalJournals.journalEntryId, journalEntryId), eq(generalJournals.userId, userId)));
        if (rows.length === 0) throw new NotFoundException({ success: false, message: 'Journal entry tidak ditemukan.' });

        const closedPeriods = await db.select().from(periods).where(and(eq(periods.userId, userId), eq(periods.isClosed, true)));
        if (isDateLocked(rows[0].entryDate, closedPeriods as any)) {
            throw new BadRequestException({ success: false, message: 'Tidak dapat menghapus transaksi dalam periode akuntansi yang tertutup.' });
        }
        const transactionNumber = rows[0].transactionNumber;
        await db.delete(generalJournals).where(and(eq(generalJournals.journalEntryId, journalEntryId), eq(generalJournals.userId, userId)));
        return { transactionNumber };
    }

    async searchDescriptions(userId: string, q: string): Promise<string[]> {
        if (!q || q.trim().length < 2) return [];
        const rows = await db.select({
            description: generalJournals.lineDescription,
            cnt: count(),
            maxId: max(generalJournals.lineId),
        }).from(generalJournals)
            .where(and(eq(generalJournals.userId, userId), sql`${generalJournals.lineDescription} IS NOT NULL AND ${generalJournals.lineDescription} != ''`, ilike(generalJournals.lineDescription, `%${q.trim()}%`)))
            .groupBy(generalJournals.lineDescription)
            .orderBy(desc(count()), desc(max(generalJournals.lineId)))
            .limit(8);
        return rows.map((r) => r.description!).filter(Boolean);
    }

    async peekNextNumber(userId: string, journalType: string, entryDate: Date): Promise<string> {
        const type = journalType?.trim() || 'General';
        const date = entryDate ?? new Date();
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        const result = await db.select({ cnt: count() }).from(generalJournals)
            .where(and(eq(generalJournals.userId, userId), eq(generalJournals.journalType, type), sql`${generalJournals.entryDate} >= ${startOfMonth} AND ${generalJournals.entryDate} <= ${endOfMonth}`));
        const seq = (result[0]?.cnt ?? 0) + 1;
        return buildTransactionNumber(type, date, seq);
    }

    private async assertAccountsValid(userId: string, lines: JournalEntryLineInput[]) {
        const accountIds = [...new Set(lines.map((l) => l.accountId))];
        const valid = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts)
            .where(and(eq(chartOfAccounts.userId, userId), eq(chartOfAccounts.isActive, true)));
        const validSet = new Set(valid.map((v) => v.id));
        if (accountIds.some((id) => !validSet.has(id))) {
            throw new BadRequestException({ success: false, message: 'Satu atau lebih akun tidak valid atau tidak aktif.' });
        }
    }

    private async nextJournalEntryId(): Promise<number> {
        const result = await db.select({ maxId: max(generalJournals.journalEntryId) }).from(generalJournals);
        return (result[0]?.maxId ?? 0) + 1;
    }

    private async generateTransactionNumber(userId: string, journalType: string, entryDate: Date): Promise<string> {
        return this.peekNextNumber(userId, journalType, entryDate);
    }

    private buildRows(journalEntryId: number, userId: string, transactionNumber: string, journalType: string, entryDate: Date, createdAt: Date, updatedAt: Date | null, lines: JournalEntryLineInput[], status = 'Posted') {
        return lines.map((l, idx) => ({
            journalEntryId, userId, transactionNumber, journalType, entryDate, createdAt, updatedAt,
            accountId: l.accountId,
            lineDescription: l.lineDescription ?? null,
            debit: String(l.debit ?? 0),
            credit: String(l.credit ?? 0),
            lineOrder: l.lineOrder ?? idx,
            status,
        }));
    }
}