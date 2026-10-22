import { z } from "zod";

/**
 * Helper function untuk parsing format angka/ribuan.
 * Mendukung pemisah desimal (koma/titik) dan nilai string kosong.
 */
export function parseFormattedNumber(
  val: string | number | undefined | null,
): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;

  // Bersihkan format ribuan (titik/koma) dan ganti desimal ke format standar JS (.)
  // Mengakomodasi format IDR (misal: "1.500,50" -> "1500.50")
  const clean = val.replace(/\./g, "").replace(",", ".");

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

// 1. Schema untuk satu baris jurnal (Line)
export const journalLineSchema = z
  .object({
    id: z.string().optional(),
    accountId: z.coerce.number().min(1, "Akun wajib dipilih"),
    lineDescription: z.string().optional().default(""),
    debit: z.string().default("0"),
    credit: z.string().default("0"),
  })
  .superRefine((line, ctx) => {
    const debitNum = parseFormattedNumber(line.debit);
    const creditNum = parseFormattedNumber(line.credit);

    // Keduanya terisi
    if (debitNum > 0 && creditNum > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Pilih salah satu antara Debit atau Credit (tidak boleh keduanya)",
        path: ["debit"],
      });
    }

    // Keduanya kosong / 0
    if (debitNum === 0 && creditNum === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Isi salah satu nilai Debit atau Credit",
        path: ["debit"],
      });
    }
  });

// 2. Schema Utama Form Journal Entry
export const journalEntrySchema = z
  .object({
    journalType: z.string().min(1, "Jenis jurnal wajib dipilih"),
    entryDate: z.string().min(1, "Tanggal wajib diisi"),
    lines: z.array(journalLineSchema),
  })
  .superRefine((data, ctx) => {
    // A. Filter baris yang terisi akun & nilai nominalnya valid
    const effectiveLines = data.lines.filter((l) => {
      const hasAccount = Boolean(l.accountId && l.accountId > 0);
      const debitNum = parseFormattedNumber(l.debit);
      const creditNum = parseFormattedNumber(l.credit);

      return hasAccount && (debitNum > 0 || creditNum > 0);
    });

    // B. Minimal 2 baris terisi valid (Prinsip Double Entry)
    if (effectiveLines.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Jurnal minimal harus terdiri dari 2 baris transaksi yang valid",
        path: ["lines"],
      });
      return; // Stop dulu jika baris tidak cukup
    }

    // C. Validasi Keseimbangan Debit vs Credit
    const totalDebit = effectiveLines.reduce(
      (sum, l) => sum + parseFormattedNumber(l.debit),
      0,
    );
    const totalCredit = effectiveLines.reduce(
      (sum, l) => sum + parseFormattedNumber(l.credit),
      0,
    );

    // Gunakan Math.abs toleransi desimal JS (misal 0.0001) untuk mencegah bug floating point
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    if (!isBalanced || totalDebit === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total Debit (${totalDebit.toLocaleString("id-ID")}) dan Credit (${totalCredit.toLocaleString("id-ID")}) tidak seimbang`,
        path: ["lines"],
      });
    }
  });

// Tipe untuk React Hook Form
export type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;
export type JournalLineFormValues = z.infer<typeof journalLineSchema>;
