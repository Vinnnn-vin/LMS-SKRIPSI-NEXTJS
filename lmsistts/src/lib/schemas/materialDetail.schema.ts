import { z } from "zod";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const ACCEPTED_PDF_TYPES = ["application/pdf"];

// =======================================
// ENUM TIPE MATERI
// =======================================
export const materialDetailTypeEnum = z
  .enum(["1", "2", "3", "4"])
  .transform(Number)
  .refine((val) => val >= 1 && val <= 4, {
    message: "Tipe konten tidak valid",
  });

// =======================================
// SCHEMA DASAR
// =======================================
const baseMaterialDetailSchema = z.object({
  material_detail_name: z
    .string()
    .min(3, "Nama konten minimal 3 karakter")
    .max(255),
  material_detail_description: z
    .string()
    .min(10, "Deskripsi minimal 10 karakter")
    .max(5000),
  material_detail_type: materialDetailTypeEnum,
  is_free: z.boolean().default(false),
});

// =======================================
// CREATE SCHEMA
// =======================================
export const createMaterialDetailSchema = z
  .object({
    material_detail_name: z
      .string()
      .min(3, "Nama konten minimal 3 karakter")
      .max(255),
    material_detail_description: z
      .string()
      .min(1, "Deskripsi wajib diisi")
      .max(5000),
    material_detail_type: z.enum(["1", "2", "3", "4"]),
    materi_detail_url: z.string().optional().nullable(),
    material_id: z.number().int().positive("Material ID wajib diisi"),
    is_free: z.boolean().default(false),

    // FIELD BARU
    assignment_template_url: z.string().optional().nullable(),
    passing_score: z.preprocess(
      (val) =>
        val === "" || val === undefined || val === null
          ? null
          : Number(val),
      z.number().int().min(0).max(100).nullable().optional()
    ),
  })
  .refine(
    (data) => {
      const type = parseInt(data.material_detail_type);
      // Type 1/2 (video/pdf) → harus punya file URL
      if ((type === 1 || type === 2) && !data.materi_detail_url) return false;
      // Type 3 (YouTube link) → URL wajib
      if (type === 3 && !data.materi_detail_url) return false;
      return true;
    },
    {
      message: "Konten file atau URL YouTube wajib diisi sesuai tipe.",
      path: ["materi_detail_url"],
    }
  );

// =======================================
// UPDATE SCHEMA
// =======================================
export const updateMaterialDetailSchema = z.object({
  material_detail_name: z.string().min(3).max(255).optional(),
  material_detail_description: z.string().min(1).max(5000).optional(),
  material_detail_type: z.enum(["1", "2", "3", "4"]).optional(),
  materi_detail_url: z.string().nullable().optional(),
  is_free: z.boolean().optional(),
  assignment_template_url: z.string().nullable().optional(),
  passing_score: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null ? null : Number(val),
    z.number().int().min(0).max(100).nullable().optional()
  ),
});

// =======================================
// DATA SCHEMA (untuk read)
// –--------------------------------------
export const materialDetailDataSchema = baseMaterialDetailSchema.extend({
  material_detail_id: z.number(),
  materi_detail_url: z.string().nullable().optional(),
  material_id: z.number().nullable(),
  passing_score: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null ? null : Number(val),
    z.number().int().min(0).max(100).nullable().optional()
  ),
});

// =======================================
// QUIZ DATA SCHEMA
// =======================================
export const quizDataSchema = z.object({
  quiz_id: z.number(),
  quiz_title: z.string().nullable(),
});

// =======================================
// TYPES
// =======================================
export type QuizData = z.infer<typeof quizDataSchema>;
export type MaterialDetailData = z.infer<typeof materialDetailDataSchema>;
export type CreateMaterialDetailInput = z.infer<
  typeof createMaterialDetailSchema
>;
export type UpdateMaterialDetailInput = z.infer<
  typeof updateMaterialDetailSchema
>;
