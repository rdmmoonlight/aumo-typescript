import { z } from "zod";
import {
  ACCOUNT_TYPES,
  ACCOUNT_RANGES,
  ChartOfAccount,
} from "@/app/(authenticated)/chart-of-accounts/coa-types";

export const addAccountSchema = (accounts: ChartOfAccount[]) =>
  z
    .object({
      type: z.string().min(1, "Kategori wajib dipilih"),
      // Gunakan error message langsung tanpa `invalid_type_error`
      referenceNumber: z.coerce
        .number({ message: "Nomor referensi wajib diisi" })
        .min(1, "Nomor referensi wajib diisi"),
      accountName: z.string().min(1, "Nama akun wajib diisi"),
      role: z.string().default("Default"),
    })
    .superRefine((data, ctx) => {
      const refNum = Number(data.referenceNumber);
      const range = ACCOUNT_RANGES[data.type];

      // 1. Validasi Kisaran Kode/Nomor Referensi Sesuai Kategori
      if (range && (refNum < range.start || refNum > range.end)) {
        ctx.addIssue({
          code: "custom", // Mengganti z.ZodIssueCode.custom yang deprecated
          message: `Nomor Ref ${refNum} tidak valid untuk ${data.type} (${range.start}-${range.end})`,
          path: ["referenceNumber"],
        });
      }

      // 2. Validasi Kode Unik / Tidak Boleh Duplikat
      if (accounts.some((a) => Number(a.referenceNumber) === refNum)) {
        ctx.addIssue({
          code: "custom", // Mengganti z.ZodIssueCode.custom yang deprecated
          message: `Nomor Ref ${refNum} sudah digunakan`,
          path: ["referenceNumber"],
        });
      }
    });

export const editAccountSchema = z.object({
  // Paksa id menjadi number saat parsed/output
  id: z.coerce.number({ message: "ID tidak valid" }),
  accountName: z.string().min(1, "Nama akun wajib diisi"),
  referenceNumber: z.coerce
    .number({ message: "Nomor referensi wajib diisi" })
    .min(1, "Nomor referensi wajib diisi"),
  type: z.string().min(1, "Kategori wajib diisi"),
  role: z.string().default("Default"),
  isActive: z.boolean().default(true),
});

// Tipe untuk Input (apa yang dimasukkan ke form / nilai awal)
export type AddAccountFormInput = z.input<ReturnType<typeof addAccountSchema>>;
// Tipe untuk Output (apa yang dihasilkan setelah divalidasi oleh Zod)
export type AddAccountFormValues = z.output<
  ReturnType<typeof addAccountSchema>
>;

export type EditAccountFormInput = z.input<typeof editAccountSchema>;
export type EditAccountFormValues = z.output<typeof editAccountSchema>;
