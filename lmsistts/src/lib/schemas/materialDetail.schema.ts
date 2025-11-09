// lmsistts\src\lib\schemas\materialDetail.schema.ts

import { z } from "zod";

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const ACCEPTED_PDF_TYPES = ["application/pdf"];

export const materialDetailTypeEnum = z.enum(["1", "2", "3", "4"]);

export const createMaterialDetailFormSchema = z
  .object({
    material_detail_name: z
      .string()
      .min(3, "Nama konten minimal 3 karakter")
      .max(255, "Nama konten maksimal 255 karakter"),
    material_detail_description: z
      .string()
      .min(1, "Deskripsi wajib diisi")
      .max(5000, "Deskripsi maksimal 5000 karakter"),
    material_detail_type: materialDetailTypeEnum,
    is_free: z.boolean().default(false),
    materi_detail_url: z.string().optional().default(""),
    youtube_url: z.string().optional().default(""),
    content_file: z.instanceof(File).nullable().optional(),
    template_file: z.instanceof(File).nullable().optional(),
    passing_score: z.coerce
      .number()
      .int()
      .min(0)
      .max(100)
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.material_detail_type === "1" && !data.content_file) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "File video wajib diupload untuk tipe Video",
        path: ["content_file"],
      });
    }

    if (data.material_detail_type === "2" && !data.content_file) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "File PDF wajib diupload untuk tipe PDF",
        path: ["content_file"],
      });
    }

    if (data.material_detail_type === "3") {
      if (!data.youtube_url || data.youtube_url.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "URL YouTube wajib diisi",
          path: ["youtube_url"],
        });
      } else {
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        if (!youtubeRegex.test(data.youtube_url)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Format URL YouTube tidak valid",
            path: ["youtube_url"],
          });
        }
      }
    }
  });

export const createMaterialDetailSchema = z.object({
  material_detail_name: z
    .string()
    .min(3, "Nama konten minimal 3 karakter")
    .max(255),
  material_detail_description: z
    .string()
    .min(1, "Deskripsi wajib diisi")
    .max(5000),
  material_detail_type: materialDetailTypeEnum,
  materi_detail_url: z.string().optional().nullable(),
  is_free: z.boolean().default(false),
  assignment_template_url: z.string().optional().nullable(),
  passing_score: z.coerce.number().int().min(0).max(100).nullable().optional(),
});

export const updateMaterialDetailBackendSchema = z.object({
  material_detail_name: z.string().min(3).max(255).optional(),
  material_detail_description: z.string().min(1).max(5000).optional(),
  material_detail_type: materialDetailTypeEnum.optional(),
  materi_detail_url: z.string().nullable().optional(),
  is_free: z.boolean().optional(),
  assignment_template_url: z.string().nullable().optional(),
  passing_score: z.coerce.number().int().min(0).max(100).nullable().optional(),
});

export const materialDetailDataSchema = z.object({
  material_detail_id: z.number(),
  material_detail_name: z.string(),
  material_detail_description: z.string(),
  material_detail_type: z.number(),
  materi_detail_url: z.string().nullable().optional(),
  material_id: z.number().nullable(),
  passing_score: z.coerce.number().int().min(0).max(100).nullable().optional(),
  is_free: z.boolean(),
});

export const quizDataSchema = z.object({
  quiz_id: z.number(),
  quiz_title: z.string().nullable(),
});

export const updateMaterialDetailFormSchema = z
  .object({
    material_detail_name: z
      .string()
      .min(3, "Nama konten minimal 3 karakter")
      .max(255, "Nama konten maksimal 255 karakter")
      .optional(),
    material_detail_description: z
      .string()
      .min(1, "Deskripsi wajib diisi")
      .max(5000, "Deskripsi maksimal 5000 karakter")
      .optional(),
    material_detail_type: materialDetailTypeEnum.optional(),
    is_free: z.boolean().optional(),
    materi_detail_url: z.string().optional().default(""),
    youtube_url: z.string().optional().default(""),
    content_file: z.instanceof(File).nullable().optional(),
    template_file: z.instanceof(File).nullable().optional(),
    passing_score: z.coerce
      .number()
      .int()
      .min(0)
      .max(100)
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.material_detail_type === "3" && data.youtube_url) {
      const youtubeRegex =
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (
        data.youtube_url.trim() !== "" &&
        !youtubeRegex.test(data.youtube_url)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Format URL YouTube tidak valid",
          path: ["youtube_url"],
        });
      }
    }
  });

export const updateMaterialDetailSchema = z.object({
  material_detail_name: z.string().min(3).max(255).optional(),
  material_detail_description: z.string().min(1).max(5000).optional(),
  material_detail_type: materialDetailTypeEnum.optional(),
  materi_detail_url: z.string().nullable().optional(),
  is_free: z.boolean().optional(),
  assignment_template_url: z.string().nullable().optional(),
  passing_score: z.coerce.number().int().min(0).max(100).nullable().optional(),
});

export type CreateMaterialDetailFormInput = z.infer<
  typeof createMaterialDetailFormSchema
>;
export type UpdateMaterialDetailFormInput = z.infer<
  typeof updateMaterialDetailFormSchema
>;

export type CreateMaterialDetailInput = z.infer<
  typeof createMaterialDetailSchema
>;
export type UpdateMaterialDetailInput = z.infer<
  typeof updateMaterialDetailSchema
>;

export type MaterialDetailData = z.infer<typeof materialDetailDataSchema>;
export type QuizData = z.infer<typeof quizDataSchema>;
