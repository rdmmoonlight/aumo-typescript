import { ValidationMessagesError } from '../../lib/errors.js';
import { parseDotNetDate } from '../../common/utils/dotnet-date.js';

/** Setara JournalEntryLineDto sumber. */
export interface JournalLineInput {
    accountId: number;
    lineDescription: string | null;
    debit: number;
    credit: number;
    lineOrder: number;
}

/** Setara CreateJournalEntryRequest / UpdateJournalEntryRequest sumber. */
export interface JournalEntryInput {
    journalType: string;
    entryDate: Date;
    /** createdAt (create) atau updatedAt (update) kiriman klien; null bila tidak dikirim. */
    clientTimestamp: Date | null;
    /** null bila `lines` dikirim null. */
    lines: JournalLineInput[] | null;
}

/** default(DateTime) di .NET: dipakai bila entryDate tidak dikirim, sehingga ditolak validator. */
const DEFAULT_DATE = new Date('0001-01-01T00:00:00Z');

const INVALID_BODY = 'Invalid request body.';

function invalid(): never {
    throw new ValidationMessagesError([INVALID_BODY]);
}

function asNumber(value: unknown, fallback = 0): number {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return invalid();
}

function parseLine(raw: unknown): JournalLineInput {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return invalid();
    const r = raw as Record<string, unknown>;
    const description = r.lineDescription;
    if (description !== undefined && description !== null && typeof description !== 'string') invalid();
    const accountId = asNumber(r.accountId);
    if (!Number.isInteger(accountId)) invalid();
    const lineOrder = asNumber(r.lineOrder);
    if (!Number.isInteger(lineOrder)) invalid();
    return {
        accountId,
        lineDescription: (description as string | null | undefined) ?? null,
        debit: asNumber(r.debit),
        credit: asNumber(r.credit),
        lineOrder,
    };
}

/**
 * Mengubah body JSON menjadi input terketik, sama seperti model binding sumber.
 * Body yang tidak bisa di-bind menghasilkan 400. Aturan bisnis diperiksa di journal-entry.validation.ts.
 */
export function parseJournalEntryBody(body: unknown, kind: 'create' | 'update'): JournalEntryInput {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) return invalid();
    const b = body as Record<string, unknown>;

    const typeField = b.journalType;
    if (typeField !== undefined && typeField !== null && typeof typeField !== 'string') invalid();
    // Create: default "General". Update: default kosong (memakai jenis jurnal semula).
    const journalType = (typeField as string | null | undefined) ?? (kind === 'create' ? 'General' : '');

    const entryDate = b.entryDate === undefined || b.entryDate === null ? DEFAULT_DATE : parseDotNetDate(b.entryDate);
    const timestampRaw = kind === 'create' ? b.createdAt : b.updatedAt;
    const clientTimestamp =
        timestampRaw === undefined || timestampRaw === null ? null : parseDotNetDate(timestampRaw);

    let lines: JournalLineInput[] | null;
    if (b.lines === undefined) lines = [];
    else if (b.lines === null) lines = null;
    else if (Array.isArray(b.lines)) lines = b.lines.map(parseLine);
    else return invalid();

    return {
        journalType,
        entryDate: entryDate ?? DEFAULT_DATE,
        clientTimestamp,
        lines,
    };
}

export interface NextTransactionNumberQuery {
    journalType: string | undefined;
    entryDate: Date | undefined;
}

/** Query next-transaction-number: tanggal tidak valid ditolak (400). */
export function parseNextTransactionNumberQuery(query: Record<string, unknown>): NextTransactionNumberQuery {
    const journalType = typeof query.journalType === 'string' ? query.journalType : undefined;
    let entryDate: Date | undefined;
    if (typeof query.entryDate === 'string' && query.entryDate !== '') {
        const parsed = parseDotNetDate(query.entryDate);
        if (!parsed) throw new ValidationMessagesError(['Entry date is invalid.']);
        entryDate = parsed;
    }
    return { journalType, entryDate };
}
