import { describe, expect, it } from 'vitest';
import { formatDotNetDate, parseDotNetDate } from '../common/utils/dotnet-date.js';
import { ValidationMessagesError } from '../lib/errors.js';
import { parseJournalEntryBody } from '../modules/journal-entries/journal-entry.schemas.js';
import { counterKeyFor, isDateLocked } from '../modules/journal-entries/journal-entry.service.js';
import { validateJournalEntry } from '../modules/journal-entries/journal-entry.validation.js';

const line = (accountId: number, debit: number, credit: number, lineDescription: string | null = null) => ({
    accountId,
    debit,
    credit,
    lineDescription,
    lineOrder: 0,
});

const entry = (lines: ReturnType<typeof line>[] | null, extra: Partial<{ journalType: string; entryDate: Date }> = {}) => ({
    journalType: 'General',
    entryDate: new Date('2026-10-05T00:00:00Z'),
    clientTimestamp: null,
    lines,
    ...extra,
});

describe('validateJournalEntry (setara JournalEntryValidatorBase)', () => {
    it('jurnal seimbang lolos', () => {
        expect(validateJournalEntry(entry([line(1, 100, 0), line(2, 0, 100)]))).toEqual([]);
    });

    it('tanggal di luar 2000-01-01..2100-12-31 ditolak', () => {
        const lines = [line(1, 100, 0), line(2, 0, 100)];
        expect(validateJournalEntry(entry(lines, { entryDate: new Date('1999-12-31T00:00:00Z') }))).toEqual([
            'Entry date is invalid.',
        ]);
        expect(validateJournalEntry(entry(lines, { entryDate: new Date('2101-01-01T00:00:00Z') }))).toEqual([
            'Entry date is invalid.',
        ]);
        expect(validateJournalEntry(entry(lines, { entryDate: new Date('2100-12-31T00:00:00Z') }))).toEqual([]);
    });

    it('jenis jurnal: hanya General/Adjusting (huruf besar-kecil dibedakan), kosong boleh', () => {
        const lines = [line(1, 100, 0), line(2, 0, 100)];
        expect(validateJournalEntry(entry(lines, { journalType: 'Adjusting' }))).toEqual([]);
        expect(validateJournalEntry(entry(lines, { journalType: '' }))).toEqual([]);
        expect(validateJournalEntry(entry(lines, { journalType: 'general' }))).toEqual([
            "Journal type must be 'General' or 'Adjusting'.",
        ]);
    });

    it('lines null, lebih dari 200, kurang dari 2 efektif, tidak seimbang', () => {
        expect(validateJournalEntry(entry(null))).toEqual(['Journal lines are required.']);
        const many = Array.from({ length: 201 }, () => line(1, 1, 0));
        expect(validateJournalEntry(entry(many))).toEqual(['A journal entry cannot have more than 200 lines.']);
        expect(validateJournalEntry(entry([line(1, 100, 0), line(0, 50, 0), line(2, 0, 0)]))).toEqual([
            'A journal entry must have at least two line items.',
        ]);
        expect(validateJournalEntry(entry([line(1, 100, 0), line(2, 0, 99.99)]))).toEqual([
            'Total debit must equal total credit before posting.',
        ]);
    });

    it('baris kosong (akun 0 atau nol rupiah) diabaikan sebelum validasi', () => {
        expect(validateJournalEntry(entry([line(1, 100, 0), line(2, 0, 100), line(0, 5, 0), line(3, 0, 0)]))).toEqual([]);
    });

    it('penjumlahan desimal tepat (0.1 + 0.2 = 0.3)', () => {
        expect(validateJournalEntry(entry([line(1, 0.1, 0), line(2, 0.2, 0), line(3, 0, 0.3)]))).toEqual([]);
    });

    it('aturan per baris: akun, negatif, presisi, debit+kredit, panjang deskripsi', () => {
        expect(validateJournalEntry(entry([line(-1, 100, 0), line(2, 0, 100)]))).toContain(
            'Each journal line must have a valid account.',
        );
        expect(validateJournalEntry(entry([line(1, 100, 50), line(2, 0, 50)]))).toEqual([
            'A journal line cannot have both a debit and a credit amount.',
        ]);
        expect(validateJournalEntry(entry([line(1, 100.001, 0), line(2, 0, 100.001)]))).toEqual([
            'Amounts support at most 2 decimal places and 16 digits before the decimal point.',
        ]);
        expect(validateJournalEntry(entry([line(1, 100, 0, 'x'.repeat(251)), line(2, 0, 100)]))).toEqual([
            'Line description must not exceed 250 characters.',
        ]);
    });

    it('pesan duplikat dibuang', () => {
        const errors = validateJournalEntry(entry([line(1, 100.001, 0), line(2, 0, 100.001), line(3, 0.001, 0.001)]));
        expect(new Set(errors).size).toBe(errors.length);
    });
});

describe('parseJournalEntryBody (setara model binding)', () => {
    it('create: jenis jurnal default General; update: default kosong', () => {
        expect(parseJournalEntryBody({ entryDate: '2026-10-05', lines: [] }, 'create').journalType).toBe('General');
        expect(parseJournalEntryBody({ entryDate: '2026-10-05', lines: [] }, 'update').journalType).toBe('');
    });

    it('tanggal-waktu tanpa offset dianggap UTC', () => {
        const parsed = parseJournalEntryBody({ entryDate: '2026-10-05T08:30:00', lines: [] }, 'create');
        expect(parsed.entryDate.toISOString()).toBe('2026-10-05T08:30:00.000Z');
    });

    it('entryDate tidak dikirim menjadi default(DateTime) sehingga ditolak validator', () => {
        const parsed = parseJournalEntryBody({ lines: [line(1, 1, 0), line(2, 0, 1)] }, 'create');
        expect(validateJournalEntry(parsed)).toContain('Entry date is invalid.');
    });

    it('lines tidak dikirim = daftar kosong, null = wajib diisi', () => {
        expect(parseJournalEntryBody({ entryDate: '2026-10-05' }, 'create').lines).toEqual([]);
        expect(parseJournalEntryBody({ entryDate: '2026-10-05', lines: null }, 'create').lines).toBeNull();
    });

    it('tipe yang salah menghasilkan 400', () => {
        expect(() => parseJournalEntryBody('x', 'create')).toThrow(ValidationMessagesError);
        expect(() => parseJournalEntryBody({ lines: [{ accountId: 'a' }] }, 'create')).toThrow(ValidationMessagesError);
        expect(() => parseJournalEntryBody({ journalType: 5 }, 'create')).toThrow(ValidationMessagesError);
    });
});

describe('penomoran transaksi (setara TransactionNumberService)', () => {
    it('AJ untuk Adjusting, selain itu GJ, ditambah yyMM', () => {
        expect(counterKeyFor('General', new Date('2026-10-05T00:00:00Z'))).toBe('GJ2610');
        expect(counterKeyFor('Adjusting', new Date('2027-01-31T00:00:00Z'))).toBe('AJ2701');
        expect(counterKeyFor('Cash', new Date('2026-03-01T00:00:00Z'))).toBe('GJ2603');
    });
});

describe('PeriodLock.IsDateLocked', () => {
    const closed = [{ startDate: new Date('2026-09-01T00:00:00Z'), endDate: new Date('2026-09-30T23:59:59Z') }];
    it('batas awal dan akhir termasuk terkunci, di luar rentang tidak', () => {
        expect(isDateLocked(new Date('2026-09-01T00:00:00Z'), closed)).toBe(true);
        expect(isDateLocked(new Date('2026-09-30T23:59:59Z'), closed)).toBe(true);
        expect(isDateLocked(new Date('2026-08-31T23:59:59Z'), closed)).toBe(false);
        expect(isDateLocked(new Date('2026-10-01T00:00:00Z'), closed)).toBe(false);
        expect(isDateLocked(new Date('2026-10-01T00:00:00Z'), [])).toBe(false);
    });
});

describe('format tanggal setara System.Text.Json', () => {
    it('tanpa milidetik bila nol, dengan Z', () => {
        expect(formatDotNetDate(new Date('2026-10-05T00:00:00.000Z'))).toBe('2026-10-05T00:00:00Z');
        expect(formatDotNetDate(new Date('2026-10-05T01:02:03.120Z'))).toBe('2026-10-05T01:02:03.12Z');
    });
    it('parse menolak teks tidak valid', () => {
        expect(parseDotNetDate('bukan tanggal')).toBeNull();
        expect(parseDotNetDate('')).toBeNull();
    });
});
