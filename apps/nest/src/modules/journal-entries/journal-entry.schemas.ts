import { z } from 'zod';

const lineSchema = z.object({
    accountId: z.coerce.number().int().min(1),
    lineDescription: z.string().trim().max(500).nullable().optional(),
    debit: z.coerce.number().min(0).default(0),
    credit: z.coerce.number().min(0).default(0),
    lineOrder: z.coerce.number().int().min(0).optional(),
});

export const createJournalEntrySchema = z.object({
    journalType: z.string().optional().default('General'),
    entryDate: z.coerce.date(),
    createdAt: z.coerce.date().optional(),
    lines: z.array(lineSchema).min(2),
}).superRefine((data, ctx) => {
    const eff = data.lines.filter(l => l.accountId !== 0 && (l.debit !== 0 || l.credit !== 0));
    const d = eff.reduce((s, l) => s + l.debit, 0);
    const c = eff.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(d - c) > 0.01) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Tidak balance: Debit ${d} != Credit ${c}`, path: ['lines'] });
});

export const updateJournalEntrySchema = z.object({
    journalType: z.string().optional(),
    entryDate: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    lines: z.array(lineSchema).min(2),
}).superRefine((data, ctx) => {
    const eff = data.lines.filter(l => l.accountId !== 0 && (l.debit !== 0 || l.credit !== 0));
    const d = eff.reduce((s, l) => s + l.debit, 0);
    const c = eff.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(d - c) > 0.01) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Tidak balance`, path: ['lines'] });
});

export const searchDescriptionsSchema = z.object({ q: z.string().trim().min(2).max(100) });
export const nextTransactionNumberSchema = z.object({
    journalType: z.string().optional().default('General'),
    entryDate: z.coerce.date().optional()
});