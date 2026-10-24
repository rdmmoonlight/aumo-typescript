import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { generalJournal } from '../../db/schema/general-journal.js';

/** Setara GeneralJournalWriter sumber: dipakai bersama oleh journal-entries dan tools. */
export const POSTED_STATUS = 'Posted';

export interface WriterLine {
    accountId: number;
    lineDescription: string | null;
    debit: number;
    credit: number;
}

/** Cukup `execute`, sehingga dapat dipakai dengan koneksi biasa maupun di dalam transaksi. */
type Executor = Pick<NodePgDatabase, 'execute'>;

/** Satu id kelompok jurnal dari sequence (setara NextJournalEntryIdAsync). */
export async function nextJournalEntryId(db: Executor): Promise<number> {
    const result = await db.execute<{ value: number }>(
        sql`SELECT nextval('general_journal_journal_entry_id_seq')::int AS value`,
    );
    return Number(result.rows[0].value);
}

export const toAmount = (n: number): string => n.toFixed(2);

/** Setara BuildRows: LineOrder dihitung ulang berurutan dari 0. */
export function buildJournalRows(args: {
    journalEntryId: number;
    userId: string;
    transactionNumber: string;
    journalType: string;
    entryDate: Date;
    createdAt: Date;
    updatedAt: Date | null;
    lines: WriterLine[];
    status?: string;
}): (typeof generalJournal.$inferInsert)[] {
    return args.lines.map((l, index) => ({
        journalEntryId: args.journalEntryId,
        userId: args.userId,
        transactionNumber: args.transactionNumber,
        journalType: args.journalType,
        entryDate: args.entryDate,
        createdAt: args.createdAt,
        updatedAt: args.updatedAt,
        status: args.status ?? POSTED_STATUS,
        accountId: l.accountId,
        lineDescription: l.lineDescription,
        debit: toAmount(l.debit),
        credit: toAmount(l.credit),
        lineOrder: index,
    }));
}
