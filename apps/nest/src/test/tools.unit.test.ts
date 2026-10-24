import { describe, expect, it } from 'vitest';
import { ValidationMessagesError } from '../lib/errors.js';
import { daysInMonth, forceToTargetMonth, parseTransactionDay, periodNameId } from '../modules/tools/tools.dates.js';
import { parseJournalImportBody, validateJournalImport } from '../modules/tools/tools.schemas.js';

const tx = (over: Record<string, unknown> = {}) => ({
    transactionNumber: 'T1',
    date: '2026-05-10',
    journalType: 'General',
    lines: [
        { refNumber: 1101, accountName: 'Kas', description: 'a', debit: 100, credit: null },
        { refNumber: 4101, accountName: 'Pendapatan', description: 'b', debit: null, credit: 100 },
    ],
    ...over,
});
const body = (over: Record<string, unknown> = {}) => ({ targetYear: 2026, targetMonth: 5, transactions: [tx()], ...over });
const errorsOf = (b: unknown) => validateJournalImport(parseJournalImportBody(b));

describe('validateJournalImport (setara JournalImportRequestDtoValidator)', () => {
    it('permintaan sah lolos', () => {
        expect(errorsOf(body())).toEqual([]);
    });

    it('periode target di luar batas', () => {
        expect(errorsOf(body({ targetMonth: 13 }))).toEqual(['Invalid period parameters provided.']);
        expect(errorsOf(body({ targetYear: 1999 }))).toEqual(['Invalid period parameters provided.']);
        expect(errorsOf(body({ targetYear: 2101, targetMonth: 0 }))).toEqual(['Invalid period parameters provided.']);
    });

    it('transaksi kosong atau terlalu banyak', () => {
        expect(errorsOf(body({ transactions: [] }))).toEqual(['No transaction data provided.']);
        expect(errorsOf(body({ transactions: null }))).toEqual(['No transaction data provided.']);
        const many = Array.from({ length: 5001 }, () => tx());
        expect(errorsOf(body({ transactions: many }))).toEqual(['A single import cannot exceed 5000 transactions.']);
    });

    it('tanggal, jenis jurnal, dan jumlah baris per transaksi', () => {
        expect(errorsOf(body({ transactions: [tx({ date: 'bukan tanggal' })] }))).toEqual([
            "Transaction 'T1' has an invalid date.",
        ]);
        expect(errorsOf(body({ transactions: [tx({ date: '2026-02-30' })] }))).toEqual([
            "Transaction 'T1' has an invalid date.",
        ]);
        expect(errorsOf(body({ transactions: [tx({ journalType: 'GJ' })] }))).toEqual([
            "Transaction 'T1' has an invalid journal type (use 'General' or 'Adjusting').",
        ]);
        expect(errorsOf(body({ transactions: [tx({ journalType: '  ' })] }))).toHaveLength(1);
        expect(errorsOf(body({ transactions: [tx({ journalType: 'ADJUSTING' })] }))).toEqual([]); // tanpa membedakan huruf
        expect(errorsOf(body({ transactions: [tx({ lines: null })] }))).toEqual(["Transaction 'T1' has no lines."]);
        expect(errorsOf(body({ transactions: [tx({ lines: [{ refNumber: 1, debit: 5 }] })] }))).toEqual([
            "Transaction 'T1' must have at least two lines.",
        ]);
        const lines = Array.from({ length: 501 }, () => ({ refNumber: 1, accountName: 'x', debit: 1, credit: null }));
        expect(errorsOf(body({ transactions: [tx({ lines })] }))).toEqual(["Transaction 'T1' has too many lines."]);
    });

    it('keseimbangan dibulatkan 2 desimal (toleransi floating point Excel)', () => {
        const unbalanced = tx({ lines: [{ refNumber: 1, debit: 100 }, { refNumber: 2, credit: 99 }] });
        expect(errorsOf(body({ transactions: [unbalanced] }))).toEqual([
            "Transaction 'T1': total debit must equal total credit.",
        ]);
        const noisy = tx({ lines: [{ refNumber: 1, debit: 0.1 }, { refNumber: 2, debit: 0.2 }, { refNumber: 3, credit: 0.30000000000000004 }] });
        expect(errorsOf(body({ transactions: [noisy] }))).toEqual([]);
        const zero = tx({ lines: [{ refNumber: 1, debit: 0 }, { refNumber: 2, credit: 0 }] });
        expect(errorsOf(body({ transactions: [zero] }))).toEqual([
            "Transaction 'T1': total debit must equal total credit.",
        ]);
    });

    it('aturan per baris', () => {
        const lines = [
            { refNumber: 1, accountName: 'x'.repeat(201), description: 'd'.repeat(251), debit: 100, credit: 50 },
            { refNumber: 2, debit: 0, credit: 50 },
        ];
        expect(errorsOf(body({ transactions: [tx({ lines })] }))).toEqual([
            'A journal line cannot have both a debit and a credit amount.',
            'Line description must not exceed 250 characters.',
            'Account name must not exceed 200 characters.',
        ]);
        const negative = [{ refNumber: 1, debit: -5 }, { refNumber: 2, credit: -5 }];
        expect(errorsOf(body({ transactions: [tx({ lines: negative })] }))).toContain('Debit amount cannot be negative.');
    });

    it('custom mappings', () => {
        const mapping = (over: Record<string, unknown>) => ({ excelRef: 1, excelAccountName: 'Kas', mappedRef: 1101, ...over });
        expect(errorsOf(body({ customMappings: [mapping({ mappedRef: -1 })] }))).toEqual(['Mapped account reference cannot be negative.']);
        expect(errorsOf(body({ customMappings: [mapping({ excelAccountName: null })] }))).toEqual(['Excel account name is required in mappings.']);
        expect(errorsOf(body({ customMappings: [mapping({ excelAccountName: 'x'.repeat(201) })] }))).toEqual(['Account name must not exceed 200 characters.']);
        expect(errorsOf(body({ customMappings: Array.from({ length: 5001 }, () => mapping({}) ) }))).toEqual(['Custom mappings cannot exceed 5000 entries.']);
    });

    it('body yang tidak bisa di-bind menghasilkan 400', () => {
        for (const bad of ['x', null, [], { targetYear: 'abc' }, { targetYear: 2026.5 }, { transactions: 'x' }, { transactions: [1] }]) {
            expect(() => parseJournalImportBody(bad)).toThrow(ValidationMessagesError);
        }
    });
});

describe('tanggal impor', () => {
    it('hari diambil dari teks tanggal, bulan dan tahun dipaksa mengikuti target', () => {
        expect(parseTransactionDay('2026-05-10')).toBe(10);
        expect(parseTransactionDay('2026-1-5')).toBe(5);
        expect(parseTransactionDay('2026-05-10T23:30:00')).toBe(10);
        expect(parseTransactionDay('2026-05-10T23:30:00+07:00')).toBe(10);
        expect(parseTransactionDay('2026-05-10T20:00:00-07:00')).toBe(11); // dikonversi ke UTC
        expect(parseTransactionDay('2026-02-30')).toBeNull();
        expect(parseTransactionDay('')).toBeNull();
        expect(parseTransactionDay('bukan tanggal')).toBeNull();
    });

    it('hari dijepit ke jumlah hari bulan target', () => {
        expect(daysInMonth(2026, 2)).toBe(28);
        expect(daysInMonth(2028, 2)).toBe(29);
        expect(forceToTargetMonth(2026, 2, 31).toISOString()).toBe('2026-02-28T00:00:00.000Z');
        expect(forceToTargetMonth(2026, 5, 10).toISOString()).toBe('2026-05-10T00:00:00.000Z');
    });

    it('nama periode berbahasa Indonesia', () => {
        expect(periodNameId(2026, 5)).toBe('Mei 2026');
        expect(periodNameId(2026, 8)).toBe('Agustus 2026');
        expect(periodNameId(2027, 12)).toBe('Desember 2027');
    });
});
