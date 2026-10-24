import { ValidationMessagesError } from '../../lib/errors.js';
import { parseTransactionDay } from './tools.dates.js';
import {
    AccountMappingDetailDto,
    JournalImportRequestDto,
    JournalLineDto,
    JournalTransactionDto,
} from './tools.types.js';

const MAX_TRANSACTIONS = 5000;
const MAX_MAPPINGS = 5000;
const MAX_LINES_PER_TRANSACTION = 500;
const MAX_DESCRIPTION_LENGTH = 250;
const MAX_ACCOUNT_NAME_LENGTH = 200;
const INVALID_BODY = 'Invalid request body.';

function invalid(): never {
    throw new ValidationMessagesError([INVALID_BODY]);
}

const isObject = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === 'object' && !Array.isArray(v);

function int(value: unknown): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    return invalid();
}

function nullableNumber(value: unknown): number | null {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return invalid();
}

function nullableString(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') return value;
    return invalid();
}

function parseLine(raw: unknown): JournalLineDto {
    if (!isObject(raw)) return invalid();
    return {
        refNumber: int(raw.refNumber),
        accountName: nullableString(raw.accountName),
        // Default sumber: string kosong bila properti tidak dikirim.
        description: raw.description === undefined ? '' : nullableString(raw.description),
        debit: nullableNumber(raw.debit),
        credit: nullableNumber(raw.credit),
    };
}

function parseTransaction(raw: unknown): JournalTransactionDto {
    if (!isObject(raw)) return invalid();
    let lines: JournalLineDto[] | null;
    if (raw.lines === undefined) lines = [];
    else if (raw.lines === null) lines = null;
    else if (Array.isArray(raw.lines)) lines = raw.lines.map(parseLine);
    else return invalid();
    return {
        transactionNumber: nullableString(raw.transactionNumber) ?? '',
        date: nullableString(raw.date) ?? '',
        journalType: nullableString(raw.journalType) ?? '',
        lines,
    };
}

function parseMapping(raw: unknown): AccountMappingDetailDto {
    if (!isObject(raw)) return invalid();
    return {
        excelRef: int(raw.excelRef),
        excelAccountName: nullableString(raw.excelAccountName),
        mappedRef: int(raw.mappedRef),
        mappedAccountName: nullableString(raw.mappedAccountName) ?? '',
        status: nullableString(raw.status) ?? '',
        reason: nullableString(raw.reason) ?? '',
    };
}

/** Setara model binding JournalImportRequestDto: body yang tidak bisa di-bind menghasilkan 400. */
export function parseJournalImportBody(body: unknown): JournalImportRequestDto {
    if (!isObject(body)) return invalid();

    let transactions: JournalTransactionDto[] | null;
    if (body.transactions === undefined) transactions = [];
    else if (body.transactions === null) transactions = null;
    else if (Array.isArray(body.transactions)) transactions = body.transactions.map(parseTransaction);
    else return invalid();

    let customMappings: AccountMappingDetailDto[] | null;
    if (body.customMappings === undefined || body.customMappings === null) customMappings = null;
    else if (Array.isArray(body.customMappings)) customMappings = body.customMappings.map(parseMapping);
    else return invalid();

    return {
        targetYear: int(body.targetYear),
        targetMonth: int(body.targetMonth),
        transactions,
        customMappings,
    };
}

/** Setara JournalTypes.IsValidOrEmpty(ignoreCase: true) dengan syarat tidak kosong. */
function isValidImportJournalType(type: string): boolean {
    if (type.trim() === '') return false;
    const lower = type.toLowerCase();
    return lower === 'general' || lower === 'adjusting';
}

/** Dibulatkan 2 desimal untuk menoleransi selisih floating point dari Excel. */
function hasBalancedTotals(lines: JournalLineDto[]): boolean {
    const debit = Math.round(lines.reduce((s, l) => s + (l.debit ?? 0), 0) * 100);
    const credit = Math.round(lines.reduce((s, l) => s + (l.credit ?? 0), 0) * 100);
    return debit === credit && debit > 0;
}

function validateLine(line: JournalLineDto): string[] {
    const errors: string[] = [];
    if (line.debit !== null && line.debit < 0) errors.push('Debit amount cannot be negative.');
    if (line.credit !== null && line.credit < 0) errors.push('Credit amount cannot be negative.');
    if ((line.debit ?? 0) > 0 && (line.credit ?? 0) > 0) {
        errors.push('A journal line cannot have both a debit and a credit amount.');
    }
    if (line.description !== null && line.description.length > MAX_DESCRIPTION_LENGTH) {
        errors.push(`Line description must not exceed ${MAX_DESCRIPTION_LENGTH} characters.`);
    }
    if (line.accountName !== null && line.accountName.length > MAX_ACCOUNT_NAME_LENGTH) {
        errors.push(`Account name must not exceed ${MAX_ACCOUNT_NAME_LENGTH} characters.`);
    }
    return errors;
}

function validateTransaction(tx: JournalTransactionDto): string[] {
    const errors: string[] = [];
    const label = `Transaction '${tx.transactionNumber}'`;

    if (parseTransactionDay(tx.date) === null) errors.push(`${label} has an invalid date.`);
    if (!isValidImportJournalType(tx.journalType)) {
        errors.push(`${label} has an invalid journal type (use 'General' or 'Adjusting').`);
    }

    const lines = tx.lines;
    if (lines === null) errors.push(`${label} has no lines.`);
    else if (lines.length < 2) errors.push(`${label} must have at least two lines.`);
    else if (lines.length > MAX_LINES_PER_TRANSACTION) errors.push(`${label} has too many lines.`);
    else if (!hasBalancedTotals(lines)) errors.push(`${label}: total debit must equal total credit.`);

    for (const line of lines ?? []) errors.push(...validateLine(line));
    return errors;
}

/** Setara JournalImportRequestDtoValidator. Urutan aturan dan pesan sama; pesan duplikat dibuang. */
export function validateJournalImport(request: JournalImportRequestDto): string[] {
    const errors: string[] = [];

    if (request.targetMonth < 1 || request.targetMonth > 12) errors.push('Invalid period parameters provided.');
    if (request.targetYear < 2000 || request.targetYear > 2100) errors.push('Invalid period parameters provided.');

    const transactions = request.transactions;
    if (transactions === null || transactions.length === 0) {
        errors.push('No transaction data provided.');
    } else if (transactions.length > MAX_TRANSACTIONS) {
        errors.push(`A single import cannot exceed ${MAX_TRANSACTIONS} transactions.`);
    }
    for (const tx of transactions ?? []) errors.push(...validateTransaction(tx));

    const mappings = request.customMappings;
    if (mappings !== null && mappings.length > MAX_MAPPINGS) {
        errors.push(`Custom mappings cannot exceed ${MAX_MAPPINGS} entries.`);
    }
    for (const mapping of mappings ?? []) {
        if (mapping.mappedRef < 0) errors.push('Mapped account reference cannot be negative.');
        if (mapping.excelAccountName === null) errors.push('Excel account name is required in mappings.');
        else if (mapping.excelAccountName.length > MAX_ACCOUNT_NAME_LENGTH) {
            errors.push(`Account name must not exceed ${MAX_ACCOUNT_NAME_LENGTH} characters.`);
        }
    }

    return [...new Set(errors)];
}
