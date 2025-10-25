// lmsistts/src/lib/schemas/materialDetail.schema.ts

import { z } from "zod";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const ACCEPTED_PDF_TYPES = ["application/pdf"];

// Enum tipe materi
export const materialDetailTypeEnum = z
  .enum(["1", "2", "3", "4"])
  .transform(Number)
  .pipe(z.number().min(1).max(4));

// Skema dasar
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

// Create schema
export const createMaterialDetailSchema = baseMaterialDetailSchema
  .extend({
    materi_detail_url: z.string().optional(),
    content_file: z.instanceof(File).optional(),
  })
  .refine((data) => {
    // Validasi konten wajib sesuai tipe
    if (data.material_detail_type === 1 || data.material_detail_type === 2) {
      return !!data.content_file;
    }
    if (data.material_detail_type === 3) {
      return !!data.materi_detail_url && z.string().url().safeParse(data.materi_detail_url).success;
    }
    if (data.material_detail_type === 4) return true;
    return false;
  }, {
    message: "Konten (File atau URL) wajib diisi sesuai tipe materi",
    path: ["content_file"],
  })
  .refine((data) => {
    if (!data.content_file) return true; // Tidak ada file, skip

    const { type, name, size } = data.content_file;
    const ext = name.split(".").pop()?.toLowerCase();

    // Validasi video
    if (data.material_detail_type === 1) {
      if (!ACCEPTED_VIDEO_TYPES.includes(type) && ext !== "mp4" && ext !== "webm") return false;
    }

    // Validasi PDF
    if (data.material_detail_type === 2) {
      if (!ACCEPTED_PDF_TYPES.includes(type) && ext !== "pdf") return false;
    }

    // Ukuran file
    if (size > MAX_FILE_SIZE) return false;

    return true;
  }, {
    message: `File tidak valid. Pastikan format (Video: MP4/WebM, PDF: PDF) dan ukuran maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    path: ["content_file"],
  });

// Update schema
export const updateMaterialDetailSchema = baseMaterialDetailSchema.partial().extend({
  materi_detail_url: z.string().url().optional().or(z.literal('')),
  content_file: z.instanceof(File).optional().nullable(),
}).refine((data) => {
  if (data.material_detail_type === 3 && data.materi_detail_url === '') return false;
  if (!(data.content_file instanceof File)) return true;

  const { type, name, size } = data.content_file;
  const ext = name.split(".").pop()?.toLowerCase();

  if (data.material_detail_type === 1) {
    if (!ACCEPTED_VIDEO_TYPES.includes(type) && ext !== "mp4" && ext !== "webm") return false;
  }
  if (data.material_detail_type === 2) {
    if (!ACCEPTED_PDF_TYPES.includes(type) && ext !== "pdf") return false;
  }
  if (size > MAX_FILE_SIZE) return false;

  return true;
}, {
  message: "Input tidak valid. Periksa tipe, URL, format/ukuran file.",
  path: ["content_file"],
});

export const materialDetailDataSchema = baseMaterialDetailSchema.extend({
  material_detail_id: z.number(),
  materi_detail_url: z.string().nullable().optional(),
  material_id: z.number().nullable(),
});

export const quizDataSchema = z.object({
  quiz_id: z.number(),
  quiz_title: z.string().nullable(),
});

export type QuizData = z.infer<typeof quizDataSchema>;
export type MaterialDetailData = z.infer<typeof materialDetailDataSchema>;
export type CreateMaterialDetailInput = z.infer<typeof createMaterialDetailSchema>;
export type UpdateMaterialDetailInput = z.infer<typeof updateMaterialDetailSchema>;
