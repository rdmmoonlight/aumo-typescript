import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as ExcelJS from 'exceljs';
import { AppError, ValidationMessagesError } from '../../lib/errors.js';
import { chartOfAccounts } from '../../db/schema/chart-of-accounts.js';
import { generalJournal } from '../../db/schema/general-journal.js';
import { periods } from '../../db/schema/periods.js';
import { transactionCounters } from '../../db/schema/transaction-counters.js';
import { InjectDrizzle } from '../drizzle/drizzle.decorator.js';
import { buildJournalRows, nextJournalEntryId, WriterLine } from '../journal-entries/general-journal.writer.js';
import { forceToTargetMonth, isoDate, parseTransactionDay, periodNameId } from './tools.dates.js';
import { validateJournalImport } from './tools.schemas.js';
import {
    AccountMappingDetailDto,
    ImportResponse,
    JournalImportRequestDto,
    PreviewResponse,
    PreviewTransaction,
} from './tools.types.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEMPLATE_HEADERS = ['Date', 'Account Name', 'Description', 'Ref', 'Debit', 'Credit'];
const INSERT_BATCH_SIZE = 1000;

/** Nomor transaksi impor memakai 5 digit urut (D5), berbeda dari jurnal manual (D4). */
const numberOf = (counterKey: string, sequence: number): string =>
    `${counterKey}${String(sequence).padStart(5, '0')}`;

/** Setara txDto.JournalType.Equals("Adjusting", OrdinalIgnoreCase). */
const counterKeyOf = (journalType: string, txDate: Date): string => {
    const prefix = journalType.toLowerCase() === 'adjusting' ? 'AJ' : 'GJ';
    const yy = String(txDate.getUTCFullYear() % 100).padStart(2, '0');
    const mm = String(txDate.getUTCMonth() + 1).padStart(2, '0');
    return `${prefix}${yy}${mm}`;
};

@Injectable()
export class ToolsService {
    constructor(@InjectDrizzle() private readonly db: NodePgDatabase) { }

    /** Validasi lebih dulu, lalu identitas (urutan sama dengan sumber). */
    private prepare(userId: string, request: JournalImportRequestDto): void {
        const errors = validateJournalImport(request);
        if (errors.length > 0) throw new ValidationMessagesError(errors);
        if (!UUID.test(userId ?? '')) throw new AppError('Unauthorized', 401);
    }

    async generateJournalTemplate(): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        for (const name of ['GJ', 'AJ']) {
            const sheet = workbook.addWorksheet(name);
            sheet.addRow(TEMPLATE_HEADERS);
            sheet.getRow(1).font = { bold: true };
        }
        return Buffer.from(await workbook.xlsx.writeBuffer());
    }

    async previewImport(userId: string, request: JournalImportRequestDto): Promise<PreviewResponse> {
        this.prepare(userId, request);

        const coas = await this.db
            .select()
            .from(chartOfAccounts)
            .where(and(eq(chartOfAccounts.userId, userId), eq(chartOfAccounts.isActive, true)));

        const counterMemory = new Map<string, number>();
        const mappingDetails: AccountMappingDetailDto[] = [];
        const processed: PreviewTransaction[] = [];

        for (const tx of request.transactions ?? []) {
            const day = parseTransactionDay(tx.date);
            if (day === null) continue;
            const txDate = forceToTargetMonth(request.targetYear, request.targetMonth, day);
            const counterKey = counterKeyOf(tx.journalType, txDate);

            if (!counterMemory.has(counterKey)) {
                const [existing] = await this.db
                    .select({ lastSequence: transactionCounters.lastSequence })
                    .from(transactionCounters)
                    .where(and(eq(transactionCounters.userId, userId), eq(transactionCounters.counterKey, counterKey)));
                counterMemory.set(counterKey, existing?.lastSequence ?? 0);
            }
            const sequence = (counterMemory.get(counterKey) ?? 0) + 1;
            counterMemory.set(counterKey, sequence);

            const lines: PreviewTransaction['lines'] = [];
            for (const line of tx.lines ?? []) {
                const accountName = line.accountName?.trim() ?? '';
                const coa = coas.find(
                    (c) => c.referenceNumber === line.refNumber && c.accountName.toLowerCase() === accountName.toLowerCase(),
                );
                mappingDetails.push(
                    coa
                        ? {
                            excelRef: line.refNumber,
                            excelAccountName: accountName,
                            mappedRef: coa.referenceNumber,
                            mappedAccountName: coa.accountName,
                            status: 'EXACT_MATCH',
                            reason: 'Nomor Ref dan Nama Akun cocok 100% presisi dengan Master COA.',
                        }
                        : {
                            excelRef: line.refNumber,
                            excelAccountName: accountName,
                            mappedRef: 0,
                            mappedAccountName: '',
                            status: 'UNMAPPED',
                            reason: 'Silakan pilih akun pelimpahan manual dari dropdown.',
                        },
                );
                lines.push({
                    refNumber: line.refNumber,
                    accountName,
                    description: line.description,
                    debit: line.debit,
                    credit: line.credit,
                });
            }

            processed.push({
                transactionNumber: numberOf(counterKey, sequence),
                date: isoDate(txDate),
                journalType: tx.journalType,
                lines,
            });
        }

        // Satu entri per pasangan (ref, nama akun) dengan huruf besar-kecil diabaikan (GroupBy sumber).
        const unique = new Map<string, AccountMappingDetailDto>();
        for (const m of mappingDetails) {
            const key = `${m.excelRef}|||${m.excelAccountName ?? ''}`;
            if (!unique.has(key)) unique.set(key, m);
        }
        const uniqueMappings = [...unique.values()];
        const unmappedCount = uniqueMappings.filter((m) => m.status === 'UNMAPPED' || m.mappedRef === 0).length;

        return {
            transactions: processed,
            accountMappings: uniqueMappings,
            summary: {
                totalUniqueAccounts: uniqueMappings.length,
                exactMatchCount: uniqueMappings.filter((m) => m.status === 'EXACT_MATCH').length,
                reallocatedCount: uniqueMappings.filter(
                    (m) => m.status === 'REALLOCATED_NAME' || m.status === 'REALLOCATED_REF',
                ).length,
                unmappedCount,
                isPerfectMatch: unmappedCount === 0,
            },
        };
    }

    /** Semua perubahan (periode, counter, jurnal) dalam satu transaksi database: gagal berarti tidak ada yang tersimpan. */
    async importEntries(userId: string, request: JournalImportRequestDto): Promise<ImportResponse> {
        this.prepare(userId, request);
        const { targetYear: year, targetMonth: month } = request;

        return this.db.transaction(async (tx) => {
            // Periode akuntansi bulan target: dibuat bila belum ada (tanpa memeriksa status tutup, seperti sumber).
            const monthStart = new Date(Date.UTC(year, month - 1, 1));
            const existingPeriods = await tx
                .select({ id: periods.id, startDate: periods.startDate })
                .from(periods)
                .where(eq(periods.userId, userId));
            const hasPeriod = existingPeriods.some(
                (p) => p.startDate.getUTCFullYear() === year && p.startDate.getUTCMonth() === month - 1,
            );
            if (!hasPeriod) {
                await tx.insert(periods).values({
                    userId,
                    periodName: periodNameId(year, month),
                    startDate: monthStart,
                    endDate: forceToTargetMonth(year, month, 31),
                    isClosed: false,
                    isSelected: false,
                });
            }

            const coas = await tx
                .select()
                .from(chartOfAccounts)
                .where(and(eq(chartOfAccounts.userId, userId), eq(chartOfAccounts.isActive, true)));
            const coaByRef = new Map<number, number>();
            for (const c of coas) if (!coaByRef.has(c.referenceNumber)) coaByRef.set(c.referenceNumber, c.id);

            // Pemetaan manual: kunci "ref|||nama" tanpa membedakan huruf besar-kecil; MappedRef > 0 saja.
            const mappingDict = new Map<string, number>();
            for (const m of request.customMappings ?? []) {
                if (m.mappedRef > 0) mappingDict.set(`${m.excelRef}|||${(m.excelAccountName ?? '').trim()}`.toLowerCase(), m.mappedRef);
            }

            const existingNumbers = new Set(
                (
                    await tx
                        .selectDistinct({ transactionNumber: generalJournal.transactionNumber })
                        .from(generalJournal)
                        .where(eq(generalJournal.userId, userId))
                ).map((r) => r.transactionNumber),
            );

            const counters = new Map<string, number>();
            const rows: (typeof generalJournal.$inferInsert)[] = [];
            let importedEntriesCount = 0;

            for (const transaction of request.transactions ?? []) {
                const day = parseTransactionDay(transaction.date);
                if (day === null) continue;
                const txDate = forceToTargetMonth(year, month, day);
                const counterKey = counterKeyOf(transaction.journalType, txDate);

                if (!counters.has(counterKey)) {
                    // Kunci baris counter agar dua impor bersamaan tidak memakai nomor yang sama.
                    const [existing] = await tx
                        .select({ lastSequence: transactionCounters.lastSequence })
                        .from(transactionCounters)
                        .where(and(eq(transactionCounters.userId, userId), eq(transactionCounters.counterKey, counterKey)))
                        .for('update');
                    counters.set(counterKey, existing?.lastSequence ?? 0);
                }
                let sequence = (counters.get(counterKey) ?? 0) + 1;
                let transactionNumber = numberOf(counterKey, sequence);
                while (existingNumbers.has(transactionNumber)) {
                    sequence += 1;
                    transactionNumber = numberOf(counterKey, sequence);
                }
                counters.set(counterKey, sequence);
                existingNumbers.add(transactionNumber);

                const lines: WriterLine[] = [];
                for (const line of transaction.lines ?? []) {
                    const excelName = line.accountName?.trim() ?? '';
                    const targetRef =
                        mappingDict.get(`${line.refNumber}|||${excelName}`.toLowerCase()) ?? line.refNumber;
                    const accountId = coaByRef.get(targetRef);
                    if (accountId === undefined) continue; // akun tidak ditemukan: baris dilewati (sumber)
                    lines.push({
                        accountId,
                        lineDescription: line.description,
                        debit: line.debit ?? 0,
                        credit: line.credit ?? 0,
                    });
                }

                if (lines.length > 0) {
                    const journalEntryId = await nextJournalEntryId(tx);
                    rows.push(
                        ...buildJournalRows({
                            journalEntryId, userId, transactionNumber,
                            journalType: transaction.journalType,
                            entryDate: txDate, createdAt: txDate, updatedAt: null, lines,
                        }),
                    );
                    importedEntriesCount++;
                }
            }

            for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
                await tx.insert(generalJournal).values(rows.slice(i, i + INSERT_BATCH_SIZE));
            }
            for (const [counterKey, lastSequence] of counters) {
                await tx
                    .insert(transactionCounters)
                    .values({ userId, counterKey, lastSequence })
                    .onConflictDoUpdate({
                        target: [transactionCounters.userId, transactionCounters.counterKey],
                        set: { lastSequence: sql`excluded.last_sequence` },
                    });
            }

            return { message: 'Journal data successfully imported.', importedEntriesCount };
        });
    }
}
