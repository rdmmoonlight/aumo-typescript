import { z } from 'zod';

export const journalLineSchema = z
    .object({
        refNumber: z.coerce.number().int('Ref harus integer'),
        accountName: z.string().min(1, 'Account Name wajib diisi').trim(),
        description: z.string().optional().default(''),
        debit: z.coerce.number().min(0).nullable().optional().default(null),
        credit: z.coerce.number().min(0).nullable().optional().default(null),
    })
    .superRefine((val, ctx) => {
        const d = val.debit ?? 0;
        const c = val.credit ?? 0;
        if (d === 0 && c === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Salah satu Debit atau Credit harus > 0',
                path: ['debit'],
            });
        }
        if (d > 0 && c > 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Isi hanya Debit atau Credit, tidak keduanya',
                path: ['credit'],
            });
        }
    });

export const journalTransactionSchema = z
    .object({
        date: z.string().min(1, 'Date wajib diisi'),
        journalType: z
            .string()
            .min(1)
            .transform((v) => v.trim())
            .refine(
                (v) =>
                    ['GJ', 'AJ', 'General', 'Adjusting', 'general', 'adjusting', 'gj', 'aj'].includes(v),
                { message: 'JournalType harus GJ/General atau AJ/Adjusting' },
            ),
        lines: z.array(journalLineSchema).min(2, 'Minimal 2 baris per transaksi untuk keseimbangan'),
    })
    .superRefine((tx, ctx) => {
        const totalDebit = tx.lines.reduce((sum, l) => sum + (l.debit ?? 0), 0);
        const totalCredit = tx.lines.reduce((sum, l) => sum + (l.credit ?? 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Transaksi tidak seimbang: Debit ${totalDebit} != Credit ${totalCredit}`,
                path: ['lines'],
            });
        }
        if (totalDebit === 0 && totalCredit === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Total transaksi tidak boleh 0',
                path: ['lines'],
            });
        }
        if (isNaN(Date.parse(tx.date))) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Format tanggal tidak valid',
                path: ['date'],
            });
        }
    });

export const accountMappingDetailSchema = z.object({
    excelRef: z.coerce.number().int(),
    excelAccountName: z.string().min(1).trim(),
    mappedRef: z.coerce.number().int().min(0),
    mappedAccountName: z.string().optional().default(''),
    status: z
        .enum(['EXACT_MATCH', 'REALLOCATED_NAME', 'REALLOCATED_REF', 'UNMAPPED'])
        .optional()
        .default('UNMAPPED'),
    reason: z.string().optional().default(''),
});

export const journalImportRequestSchema = z.object({
    targetYear: z.coerce.number().int().min(1900).max(2100),
    targetMonth: z.coerce.number().int().min(1).max(12),
    transactions: z.array(journalTransactionSchema).min(1, 'Minimal 1 transaksi'),
    customMappings: z.array(accountMappingDetailSchema).optional().default([]),
});

export const previewJournalImportSchema = journalImportRequestSchema;
export const importJournalEntriesSchema = journalImportRequestSchema;

export type JournalLineInput = z.infer<typeof journalLineSchema>;
export type JournalTransactionInput = z.infer<typeof journalTransactionSchema>;
export type JournalImportRequestInput = z.infer<typeof journalImportRequestSchema>;
export type AccountMappingInput = z.infer<typeof accountMappingDetailSchema>;