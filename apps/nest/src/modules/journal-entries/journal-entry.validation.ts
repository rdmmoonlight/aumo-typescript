import { JournalEntryInput, JournalLineInput } from './journal-entry.schemas.js';

const MAX_LINES = 200;
const MIN_ENTRY_DATE = Date.UTC(2000, 0, 1);
const MAX_ENTRY_DATE = Date.UTC(2100, 11, 31);
const MAX_LINE_DESCRIPTION = 250;
const ALLOWED_TYPES = ['General', 'Adjusting'];

export const JOURNAL_TYPE_MESSAGE = "Journal type must be 'General' or 'Adjusting'.";
export const ENTRY_DATE_MESSAGE = 'Entry date is invalid.';
const AMOUNT_PRECISION_MESSAGE =
    'Amounts support at most 2 decimal places and 16 digits before the decimal point.';

/** Setara JournalTypes.IsValidOrEmpty (huruf besar-kecil dibedakan). */
export function isValidJournalTypeOrEmpty(type: string | null | undefined): boolean {
    return type === null || type === undefined || type.trim() === '' || ALLOWED_TYPES.includes(type);
}

/** Setara JournalEntryValidatorBase.IsEffective. */
export function isEffectiveLine(line: JournalLineInput): boolean {
    return line.accountId !== 0 && (line.debit !== 0 || line.credit !== 0);
}

export function effectiveLines(lines: JournalLineInput[]): JournalLineInput[] {
    return lines.filter(isEffective);
}
const isEffective = isEffectiveLine;

/** Sen (bilangan bulat) agar penjumlahan desimal tidak terkena galat floating point. */
export function toCents(amount: number): number {
    return Math.round(amount * 100);
}

/** Setara PrecisionScale(18, 2, ignoreTrailingZeros: true). */
function fitsPrecisionScale(amount: number): boolean {
    if (!Number.isFinite(amount)) return false;
    let text = Math.abs(amount).toString();
    if (/e/i.test(text)) text = Math.abs(amount).toFixed(20);
    const [integer, fraction = ''] = text.split('.');
    const scale = fraction.replace(/0+$/, '').length;
    const integerDigits = integer.replace(/^0+/, '').length;
    return scale <= 2 && integerDigits <= 16;
}

function hasBalancedTotals(lines: JournalLineInput[]): boolean {
    const effective = effectiveLines(lines);
    const debit = effective.reduce((sum, l) => sum + toCents(l.debit), 0);
    const credit = effective.reduce((sum, l) => sum + toCents(l.credit), 0);
    return debit === credit && debit > 0;
}

function validateLine(line: JournalLineInput): string[] {
    const errors: string[] = [];
    if (!(line.accountId > 0)) errors.push('Each journal line must have a valid account.');
    if (line.debit < 0) errors.push('Debit amount cannot be negative.');
    if (!fitsPrecisionScale(line.debit)) errors.push(AMOUNT_PRECISION_MESSAGE);
    if (line.credit < 0) errors.push('Credit amount cannot be negative.');
    if (!fitsPrecisionScale(line.credit)) errors.push(AMOUNT_PRECISION_MESSAGE);
    if (line.debit > 0 && line.credit > 0) {
        errors.push('A journal line cannot have both a debit and a credit amount.');
    }
    if (line.lineDescription !== null && line.lineDescription.length > MAX_LINE_DESCRIPTION) {
        errors.push(`Line description must not exceed ${MAX_LINE_DESCRIPTION} characters.`);
    }
    return errors;
}

/**
 * Setara CreateJournalEntryRequestValidator / UpdateJournalEntryRequestValidator.
 * Urutan aturan dan pesan sama dengan sumber; pesan duplikat dibuang (ToErrorResponse).
 */
export function validateJournalEntry(input: JournalEntryInput): string[] {
    const errors: string[] = [];
    const time = input.entryDate.getTime();

    if (!(time >= MIN_ENTRY_DATE && time <= MAX_ENTRY_DATE)) errors.push(ENTRY_DATE_MESSAGE);
    if (!isValidJournalTypeOrEmpty(input.journalType)) errors.push(JOURNAL_TYPE_MESSAGE);

    const lines = input.lines;
    if (lines === null) {
        errors.push('Journal lines are required.');
    } else if (lines.length > MAX_LINES) {
        errors.push(`A journal entry cannot have more than ${MAX_LINES} lines.`);
    } else if (effectiveLines(lines).length < 2) {
        errors.push('A journal entry must have at least two line items.');
    } else if (!hasBalancedTotals(lines)) {
        errors.push('Total debit must equal total credit before posting.');
    }

    if (lines !== null) {
        for (const line of effectiveLines(lines)) errors.push(...validateLine(line));
    }

    return [...new Set(errors)];
}
