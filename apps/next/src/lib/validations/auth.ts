import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email tidak boleh kosong")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(1, "Password tidak boleh kosong")
    .min(6, "Password minimal 6 karakter"),
  keepMe: z.boolean().default(false),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email tidak boleh kosong")
      .email("Format email tidak valid"),
    password: z
      .string()
      .min(1, "Password tidak boleh kosong")
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar")
      .regex(/[0-9]/, "Password harus mengandung minimal 1 angka"),
    confirmPassword: z
      .string()
      .min(1, "Konfirmasi password tidak boleh kosong"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.input<typeof loginSchema>;
export type RegisterFormValues = z.input<typeof registerSchema>;
