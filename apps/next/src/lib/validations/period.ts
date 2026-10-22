import { z } from "zod";

export const createPeriodSchema = z
  .object({
    // Gunakan z.coerce.number() agar string dari <input type="number"> terkonversi otomatis
    month: z.coerce
      .number({ message: "Bulan wajib diisi" })
      .min(1, "Bulan minimal 1")
      .max(12, "Bulan maksimal 12"),
    year: z.coerce
      .number({ message: "Tahun wajib diisi" })
      .min(2000, "Tahun minimal 2000"),
    setupMode: z.enum(["LoadExisting", "CreateNew"]),

    // Field LoadExisting
    cashAccountId: z.string().optional(),
    bankAccountId: z.string().optional(),
    retainedId: z.string().optional(),

    // Field CreateNew - Cash
    cashAccountCode: z.string().optional(),
    cashAccountName: z.string().optional(),
    cashBalance: z.union([z.coerce.number(), z.literal("")]).optional(),

    // Field CreateNew - Bank
    bankAccountCode: z.string().optional(),
    bankAccountName: z.string().optional(),
    bankBalance: z.union([z.coerce.number(), z.literal("")]).optional(),

    // Field CreateNew - Retained Earnings
    retainedCode: z.string().optional(),
    retainedName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.setupMode === "LoadExisting") {
      if (!data.cashAccountId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pilih akun kas",
          path: ["cashAccountId"],
        });
      }
      if (!data.bankAccountId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pilih akun bank",
          path: ["bankAccountId"],
        });
      }
      if (!data.retainedId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pilih akun retained earnings",
          path: ["retainedId"],
        });
      }
    } else if (data.setupMode === "CreateNew") {
      // Cash validation
      if (!data.cashAccountCode?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kode kas wajib diisi",
          path: ["cashAccountCode"],
        });
      }
      if (!data.cashAccountName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama kas wajib diisi",
          path: ["cashAccountName"],
        });
      }

      // Bank validation
      if (!data.bankAccountCode?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kode bank wajib diisi",
          path: ["bankAccountCode"],
        });
      }
      if (!data.bankAccountName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama bank wajib diisi",
          path: ["bankAccountName"],
        });
      }

      // Retained Earnings validation
      if (!data.retainedCode?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kode retained wajib diisi",
          path: ["retainedCode"],
        });
      }
      if (!data.retainedName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama retained wajib diisi",
          path: ["retainedName"],
        });
      }
    }
  });

// Expose kedua Tipe Zod (Input dan Output)
export type CreatePeriodFormValues = z.input<typeof createPeriodSchema>;
export type CreatePeriodOutputValues = z.output<typeof createPeriodSchema>;
