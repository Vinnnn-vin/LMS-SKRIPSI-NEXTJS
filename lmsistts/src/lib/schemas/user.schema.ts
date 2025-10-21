// lmsistts\src\lib\schemas\user.schema.ts

import { z } from "zod";

export const userRoleEnum = z.enum(["admin", "lecturer", "student"]);

// Skema untuk membuat user (digunakan internal di server)
export const createUserSchema = z.object({
  first_name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(255)
    .optional(),
  last_name: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(255)
    .optional(),
  email: z.string().email("Invalid email format").max(255),
  password_hash: z.string().min(8, "Password must be at least 8 characters"),
  role: userRoleEnum.default("student"),
});

// Skema untuk form registrasi (yang diisi oleh pengguna)
export const registerFormSchema = z
  .object({
    first_name: z
      .string()
      .min(2, "Nama depan minimal 2 karakter")
      .max(255)
      .optional()
      .or(z.literal("")),
    last_name: z
      .string()
      .min(2, "Nama belakang minimal 2 karakter")
      .max(255)
      .optional()
      .or(z.literal("")),
    email: z.string().email("Format email tidak valid").max(255),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password harus mengandung huruf besar, huruf kecil, dan angka"
      ),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm_password"],
  });

export const updateProfileSchema = z.object({
  first_name: z
    .string()
    .min(2, 'Nama depan minimal 2 karakter')
    .max(255)
    .optional()
    .or(z.literal('')), // Izinkan string kosong
  last_name: z
    .string()
    .min(2, 'Nama belakang minimal 2 karakter')
    .max(255)
    .optional()
    .or(z.literal('')), // Izinkan string kosong
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Old password is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number"
      ),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const userIdParamSchema = z.object({
  user_id: z
    .string()
    .regex(/^\d+$/, "User ID must be a number")
    .transform(Number),
});

// Skema untuk admin saat membuat user baru
export const adminCreateUserSchema = z.object({
  first_name: z.string().min(2).max(255).optional().or(z.literal('')),
  last_name: z.string().min(2).max(255).optional().or(z.literal('')),
  email: z.string().email('Format email tidak valid'),
  role: userRoleEnum,
  password: z.string().min(8, 'Password minimal 8 karakter'), // Password langsung, akan di-hash di server
});

// Skema untuk admin saat update user (tanpa password)
export const adminUpdateUserSchema = z.object({
  first_name: z.string().min(2).max(255).optional().or(z.literal('')),
  last_name: z.string().min(2).max(255).optional().or(z.literal('')),
  email: z.string().email('Format email tidak valid'),
  role: userRoleEnum,
});

// Skema untuk admin saat ganti password user
export const adminChangePasswordSchema = z.object({
    new_password: z.string().min(8, 'Password baru minimal 8 karakter'),
});

// Ekspor tipe data
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
