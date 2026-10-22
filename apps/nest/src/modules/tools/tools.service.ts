import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
    AccountMappingDetailDto,
    ChartOfAccount,
    GeneralJournalRow,
    JournalImportRequestDto,
    JournalTransactionDto,
    Period,
    PreviewJournalResponseDto,
    TransactionCounter,
} from './tools.types.js';

@Injectable()
export class ToolsService {
    // In-memory simulation — ganti dengan query Drizzle di produksi
    private coaStore: Map<string, ChartOfAccount[]> = new Map();
    private counterStore: Map<string, TransactionCounter> = new Map();
    private periodStore: Map<string, Period[]> = new Map();
    private journalStore: GeneralJournalRow[] = [];

    private getDaysInMonth(year: number, month: number): number {
        return new Date(year, month, 0).getDate();
    }

    private normalizeJournalType(journalType: string): 'GJ' | 'AJ' {
        const t = journalType.trim().toLowerCase();
        if (t === 'aj' || t === 'adjusting') return 'AJ';
        return 'GJ';
    }

    private parseAndForceDate(
        rawDateStr: string,
        targetYear: number,
        targetMonth: number,
    ): Date {
        const raw = new Date(rawDateStr);
        if (isNaN(raw.getTime())) {
            throw new BadRequestException({
                success: false,
                message: `Tanggal tidak valid: ${rawDateStr}`,
            });
        }
        const day = Math.min(raw.getDate(), this.getDaysInMonth(targetYear, targetMonth));
        return new Date(Date.UTC(targetYear, targetMonth - 1, day));
    }

    private async getActiveCoa(userId: string): Promise<ChartOfAccount[]> {
        if (!this.coaStore.has(userId)) {
            this.coaStore.set(userId, [
                { id: 'coa-1', userId, referenceNumber: 101, accountName: 'Cash', isActive: true },
                { id: 'coa-2', userId, referenceNumber: 102, accountName: 'Accounts Receivable', isActive: true },
                { id: 'coa-3', userId, referenceNumber: 201, accountName: 'Accounts Payable', isActive: true },
                { id: 'coa-4', userId, referenceNumber: 401, accountName: 'Sales Revenue', isActive: true },
                { id: 'coa-5', userId, referenceNumber: 501, accountName: 'Cost of Goods Sold', isActive: true },
            ]);
        }
        return this.coaStore.get(userId)!.filter((c) => c.isActive);
    }

    private async getCounter(userId: string, counterKey: string): Promise<TransactionCounter | undefined> {
        return this.counterStore.get(`${userId}::${counterKey}`);
    }

    private async saveCounter(counter: TransactionCounter): Promise<void> {
        this.counterStore.set(`${counter.userId}::${counter.counterKey}`, counter);
    }

    async generateJournalTemplate(): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Aumo';
        workbook.created = new Date();
        const headers = ['Date', 'Account Name', 'Description', 'Ref', 'Debit', 'Credit'];
        const createSheet = (name: 'GJ' | 'AJ') => {
            const ws = workbook.addWorksheet(name);
            ws.addRow(headers);
            const headerRow = ws.getRow(1);
            headerRow.font = { bold: true };
            headerRow.commit();
            ws.columns = [
                { header: 'Date', key: 'date', width: 14 },
                { header: 'Account Name', key: 'accountName', width: 28 },
                { header: 'Description', key: 'description', width: 35 },
                { header: 'Ref', key: 'ref', width: 10 },
                { header: 'Debit', key: 'debit', width: 18 },
                { header: 'Credit', key: 'credit', width: 18 },
            ];
            return ws;
        };
        createSheet('GJ');
        createSheet('AJ');
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    async previewImport(
        userId: string,
        dto: JournalImportRequestDto,
    ): Promise<PreviewJournalResponseDto> {
        const existingCoas = await this.getActiveCoa(userId);
        const mappingDetails: AccountMappingDetailDto[] = [];
        const processedTransactions: (JournalTransactionDto & { transactionNumber: string })[] = [];
        const counterMemory = new Map<string, number>();

        for (const txDto of dto.transactions) {
            const txDate = this.parseAndForceDate(txDto.date, dto.targetYear, dto.targetMonth);
            const normalizedType = this.normalizeJournalType(txDto.journalType);
            const prefix = normalizedType === 'AJ' ? 'AJ' : 'GJ';
            const yy = String(txDate.getUTCFullYear()).slice(-2);
            const mm = String(txDate.getUTCMonth() + 1).padStart(2, '0');
            const counterKey = `${prefix}${yy}${mm}`;

            if (!counterMemory.has(counterKey)) {
                const existingCounter = await this.getCounter(userId, counterKey);
                counterMemory.set(counterKey, existingCounter?.lastSequence ?? 0);
            }
            const nextSeq = (counterMemory.get(counterKey) ?? 0) + 1;
            counterMemory.set(counterKey, nextSeq);
            const generatedTxNumber = `${counterKey}${String(nextSeq).padStart(5, '0')}`;

            const processedLines: typeof txDto.lines = [];
            for (const lineDto of txDto.lines) {
                const refInt = Number(lineDto.refNumber);
                const excelAccountName = (lineDto.accountName ?? '').trim();
                const coa = existingCoas.find(
                    (c) =>
                        c.referenceNumber === refInt &&
                        c.accountName.toLowerCase() === excelAccountName.toLowerCase(),
                );
                if (coa) {
                    mappingDetails.push({
                        excelRef: refInt,
                        excelAccountName,
                        mappedRef: coa.referenceNumber,
                        mappedAccountName: coa.accountName,
                        status: 'EXACT_MATCH',
                        reason: 'Nomor Ref dan Nama Akun cocok 100% presisi dengan Master COA.',
                    });
                } else {
                    const byRef = existingCoas.find((c) => c.referenceNumber === refInt);
                    const byName = existingCoas.find(
                        (c) => c.accountName.toLowerCase() === excelAccountName.toLowerCase(),
                    );
                    if (byRef && !byName) {
                        mappingDetails.push({
                            excelRef: refInt,
                            excelAccountName,
                            mappedRef: byRef.referenceNumber,
                            mappedAccountName: byRef.accountName,
                            status: 'REALLOCATED_NAME',
                            reason: `Ref ${refInt} ditemukan tapi nama berbeda. Excel: "${excelAccountName}" vs COA: "${byRef.accountName}".`,
                        });
                    } else if (!byRef && byName) {
                        mappingDetails.push({
                            excelRef: refInt,
                            excelAccountName,
                            mappedRef: byName.referenceNumber,
                            mappedAccountName: byName.accountName,
                            status: 'REALLOCATED_REF',
                            reason: `Nama "${excelAccountName}" ditemukan tapi Ref berbeda.`,
                        });
                    } else {
                        mappingDetails.push({
                            excelRef: refInt,
                            excelAccountName,
                            mappedRef: 0,
                            mappedAccountName: '',
                            status: 'UNMAPPED',
                            reason: 'Silakan pilih akun pelimpahan manual dari dropdown.',
                        });
                    }
                }
                processedLines.push({
                    refNumber: refInt,
                    accountName: excelAccountName,
                    description: lineDto.description,
                    debit: lineDto.debit,
                    credit: lineDto.credit,
                });
            }
            processedTransactions.push({
                transactionNumber: generatedTxNumber,
                date: txDate.toISOString().slice(0, 10),
                journalType: normalizedType,
                lines: processedLines,
            });
        }

        const uniqueMap = new Map<string, AccountMappingDetailDto>();
        for (const m of mappingDetails) {
            const key = `${m.excelRef}|||${m.excelAccountName.toLowerCase()}`;
            if (!uniqueMap.has(key)) uniqueMap.set(key, m);
        }
        const uniqueMappings = Array.from(uniqueMap.values());
        const exactMatchCount = uniqueMappings.filter((m) => m.status === 'EXACT_MATCH').length;
        const reallocatedCount = uniqueMappings.filter(
            (m) => m.status === 'REALLOCATED_NAME' || m.status === 'REALLOCATED_REF',
        ).length;
        const unmappedCount = uniqueMappings.filter(
            (m) => m.status === 'UNMAPPED' || m.mappedRef === 0,
        ).length;

        return {
            transactions: processedTransactions,
            accountMappings: uniqueMappings,
            summary: {
                totalUniqueAccounts: uniqueMappings.length,
                exactMatchCount,
                reallocatedCount,
                unmappedCount,
                isPerfectMatch: unmappedCount === 0,
            },
        };
    }

    async importEntries(
        userId: string,
        dto: JournalImportRequestDto,
    ): Promise<{ message: string; importedEntriesCount: number; importedTransactionNumbers: string[] }> {
        const snapshotCounters = new Map(this.counterStore);
        const snapshotPeriods = new Map(this.periodStore);
        const snapshotJournals = [...this.journalStore];

        try {
            const periods = this.periodStore.get(userId) ?? [];
            let period = periods.find(
                (p) =>
                    p.startDate.getUTCFullYear() === dto.targetYear &&
                    p.startDate.getUTCMonth() + 1 === dto.targetMonth,
            );
            if (!period) {
                const monthName = new Date(dto.targetYear, dto.targetMonth - 1, 1).toLocaleDateString(
                    'id-ID',
                    { month: 'long', year: 'numeric' },
                );
                period = {
                    id: `period-${Date.now()}`,
                    userId,
                    periodName: monthName,
                    startDate: new Date(Date.UTC(dto.targetYear, dto.targetMonth - 1, 1)),
                    endDate: new Date(
                        Date.UTC(dto.targetYear, dto.targetMonth - 1, this.getDaysInMonth(dto.targetYear, dto.targetMonth)),
                    ),
                    isClosed: false,
                    isSelected: false,
                };
                periods.push(period);
                this.periodStore.set(userId, periods);
            }
            if (period.isClosed) {
                throw new BadRequestException({
                    success: false,
                    message: `Periode ${period.periodName} sudah tertutup, tidak bisa impor.`,
                });
            }

            const existingCoas = await this.getActiveCoa(userId);
            const mappingDict = new Map<string, AccountMappingDetailDto>();
            if (dto.customMappings) {
                for (const m of dto.customMappings) {
                    if (m.mappedRef > 0) {
                        const key = `${m.excelRef}|||${m.excelAccountName.trim().toLowerCase()}`;
                        mappingDict.set(key, m);
                    }
                }
            }

            for (const tx of dto.transactions) {
                const totalDebit = tx.lines.reduce((s, l) => s + (l.debit ?? 0), 0);
                const totalCredit = tx.lines.reduce((s, l) => s + (l.credit ?? 0), 0);
                if (Math.abs(totalDebit - totalCredit) > 0.01) {
                    throw new BadRequestException({
                        success: false,
                        message: `Transaksi tanggal ${tx.date} tidak seimbang: Debit ${totalDebit} != Credit ${totalCredit}`,
                    });
                }
            }

            const existingTxNumbers = new Set(this.journalStore.filter((j) => j.userId === userId).map((j) => j.transactionNumber));
            const activeCounters = new Map<string, TransactionCounter>();
            let journalEntryIdCounter = this.journalStore.length + 1;
            const newRows: GeneralJournalRow[] = [];
            const importedTxNumbers: string[] = [];

            for (const txDto of dto.transactions) {
                const txDate = this.parseAndForceDate(txDto.date, dto.targetYear, dto.targetMonth);
                const normalizedType = this.normalizeJournalType(txDto.journalType);
                const prefix = normalizedType === 'AJ' ? 'AJ' : 'GJ';
                const yy = String(txDate.getUTCFullYear()).slice(-2);
                const mm = String(txDate.getUTCMonth() + 1).padStart(2, '0');
                const counterKey = `${prefix}${yy}${mm}`;

                let counter = activeCounters.get(counterKey);
                if (!counter) {
                    counter = (await this.getCounter(userId, counterKey)) ?? {
                        userId,
                        counterKey,
                        lastSequence: 0,
                    };
                    activeCounters.set(counterKey, counter);
                }
                counter.lastSequence += 1;
                let transactionNumber = `${counterKey}${String(counter.lastSequence).padStart(5, '0')}`;
                while (existingTxNumbers.has(transactionNumber)) {
                    counter.lastSequence += 1;
                    transactionNumber = `${counterKey}${String(counter.lastSequence).padStart(5, '0')}`;
                }
                existingTxNumbers.add(transactionNumber);
                importedTxNumbers.push(transactionNumber);

                const importLines: { coaId: string; description?: string; debit: number; credit: number }[] = [];
                for (const lineDto of txDto.lines) {
                    const excelRef = Number(lineDto.refNumber);
                    const excelAccountName = (lineDto.accountName ?? '').trim();
                    let targetRef = excelRef;
                    const mapKey = `${excelRef}|||${excelAccountName.toLowerCase()}`;
                    const customMap = mappingDict.get(mapKey);
                    if (customMap) targetRef = customMap.mappedRef;
                    const coa = existingCoas.find((c) => c.referenceNumber === targetRef);
                    if (!coa) {
                        throw new BadRequestException({
                            success: false,
                            message: `Akun tidak ditemukan: Ref ${targetRef} (Excel Ref ${excelRef} - "${excelAccountName}")`,
                        });
                    }
                    importLines.push({
                        coaId: coa.id,
                        description: lineDto.description,
                        debit: lineDto.debit ?? 0,
                        credit: lineDto.credit ?? 0,
                    });
                }
                if (importLines.length === 0) {
                    throw new BadRequestException({
                        success: false,
                        message: `Transaksi ${transactionNumber} tidak memiliki baris valid`,
                    });
                }
                const journalEntryId = journalEntryIdCounter++;
                for (const l of importLines) {
                    newRows.push({
                        journalEntryId,
                        userId,
                        transactionNumber,
                        journalType: normalizedType,
                        transactionDate: txDate,
                        accountId: l.coaId,
                        description: l.description,
                        debit: l.debit,
                        credit: l.credit,
                    });
                }
            }

            for (const counter of activeCounters.values()) {
                await this.saveCounter(counter);
            }
            this.journalStore.push(...newRows);

            return {
                message: 'Journal data successfully imported.',
                importedEntriesCount: importedTxNumbers.length,
                importedTransactionNumbers: importedTxNumbers,
            };
        } catch (err) {
            this.counterStore = snapshotCounters;
            this.periodStore = snapshotPeriods;
            this.journalStore = snapshotJournals;
            if (err instanceof BadRequestException) throw err;
            throw new InternalServerErrorException({
                success: false,
                message: `Failed to save data: ${(err as Error).message}`,
            });
        }
    }
}