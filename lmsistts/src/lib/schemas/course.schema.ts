// lmsistts/src/lib/schemas/course.schema.ts

import { z } from "zod";

export const courseLevelEnum = z.enum(["Beginner", "Intermediate", "Advanced"]);
export const publishRequestStatusEnum = z.enum([
  "none",
  "pending",
  "approved",
  "rejected",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// File validation schema dengan pesan error yang lebih informatif
const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, `Ukuran file maksimal 5MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Format gambar tidak valid. Gunakan .jpg, .jpeg, .png, atau .webp"
  )
  .optional();

const idFromString = z.preprocess(
  (val) => {
    // Jika value ada (bukan null/undefined) dan berupa string, coba konversi ke number
    // Jika sudah number, biarkan saja. Jika null/undefined, biarkan.
    if (
      val !== null &&
      val !== undefined &&
      typeof val === "string" &&
      val.trim() !== ""
    ) {
      const num = Number(val);
      return isNaN(num) ? val : num; // Kembalikan string asli jika bukan angka valid
    }
    // Jika kosong, null, undefined, atau sudah number, kembalikan apa adanya
    return val === "" ? null : val;
  },
  // Validasi sebagai number positif, tapi buat nullable agar bisa handle null dari Select clearable
  z.number().int().positive("ID harus berupa angka positif").nullable()
);

// Schema untuk CREATE
export const createCourseSchema = z.object({
  course_title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(255),
  course_description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000),
  course_level: courseLevelEnum,
  course_price: z
    .number()
    .int()
    .min(0, "Price must be at least 0")
    .max(100000000),
  course_duration: z.number().int().min(0).default(0),
  publish_status: z.number().int().min(0).max(1).default(0),
  publish_request_status: publishRequestStatusEnum.default("none"),
  // category_id: z.number().int().positive("Category ID is required"),
  // user_id: z.number().int().positive("User ID is required"),
  category_id: idFromString.refine((val) => val !== null, {
    message: "Kategori wajib dipilih",
  }), // Tambah refine agar tidak null
  user_id: idFromString.refine((val) => val !== null, {
    message: "Dosen wajib dipilih",
  }), // Tambah refine agar tidak null
  thumbnail_file: z.instanceof(File).optional(),
});

// Schema untuk UPDATE
export const updateCourseSchema = z
  .object({
    course_title: z
      .string()
      .min(5, "Judul kursus minimal 5 karakter")
      .max(255, "Judul kursus maksimal 255 karakter")
      .trim()
      .optional(),
    course_description: z
      .string()
      .min(10, "Deskripsi minimal 10 karakter")
      .max(5000, "Deskripsi maksimal 5000 karakter")
      .trim()
      .optional(),
    course_level: courseLevelEnum.optional(),
    course_price: z
      .number()
      .int("Harga harus berupa bilangan bulat")
      .min(0, "Harga tidak boleh negatif")
      .max(100000000, "Harga terlalu besar")
      .optional(),
    course_duration: z
      .number()
      .int("Durasi harus berupa bilangan bulat")
      .min(0, "Durasi tidak boleh negatif")
      .optional(),
    publish_status: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (typeof val === "string") {
          return val === "1" || val === "on" || val === "true" ? 1 : 0;
        }
        return val === 1 ? 1 : 0;
      })
      .pipe(z.literal(0).or(z.literal(1))) // ✅ Gunakan literal union
      .optional(),
    // category_id: z.string().regex(/^\d+$/).transform(Number).optional(),
    // user_id: z.string().regex(/^\d+$/).transform(Number).optional(),
    category_id: idFromString.refine((val) => val !== null, {
      message: "Kategori wajib dipilih",
    }), // Tambah refine agar tidak null
    user_id: idFromString.refine((val) => val !== null, {
      message: "Dosen wajib dipilih",
    }), // Tambah refine agar tidak null
    thumbnail_file: fileSchema.nullable(),
  })
  .refine(
    (data) => {
      if (
        data.publish_status === 1 &&
        data.course_price !== undefined &&
        data.course_price <= 0
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Harga harus lebih dari 0 untuk mempublikasikan kursus",
      path: ["course_price"],
    }
  );

// Schema untuk validasi course ID di URL params
export const courseIdParamSchema = z.object({
  course_id: z
    .string()
    .regex(/^\d+$/, "Course ID harus berupa angka")
    .transform(Number),
});

// Schema untuk query parameters (search, filter, sort)
export const courseQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().min(1))
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .default(10),
  search: z.string().trim().optional(),
  category_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  level: courseLevelEnum.optional(),
  min_price: z.string().regex(/^\d+$/).transform(Number).optional(),
  max_price: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort_by: z
    .enum(["created_at", "course_price", "course_title"])
    .default("created_at"),
  sort_order: z.enum(["ASC", "DESC"]).default("DESC"),
});

// Schema untuk course card display (list view)
export const courseCardSchema = z.object({
  course_id: z.number(),
  course_title: z.string().nullable(),
  thumbnail_url: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\//.test(val) || /^\/uploads\//.test(val),
      { message: "thumbnail_url harus berupa URL atau path lokal" }
    ),
  course_price: z.number().nullable(),
  lecturer: z.object({
    name: z.string().nullable(),
  }),
  category: z.object({
    category_name: z.string().nullable(),
  }),
});

export const courseCardDataSchema = z.array(courseCardSchema);

export const lecturerCreateCourseSchema = createCourseSchema.omit({
  user_id: true,
  publish_status: true,
  course_price: true,
});

// Skema untuk Lecturer saat update (tanpa harga/status)
export const lecturerUpdateCourseSchema = lecturerCreateCourseSchema
  .partial()
  .extend({
    thumbnail_file: z.instanceof(File).optional().nullable(),
  });

// --- EKSPOR TIPE BARU ---
export type LecturerCreateCourseInput = z.infer<
  typeof lecturerCreateCourseSchema
>;
export type LecturerUpdateCourseInput = z.infer<
  typeof lecturerUpdateCourseSchema
>;

// Type exports
export type CourseCardData = z.infer<typeof courseCardSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
export type CourseLevel = z.infer<typeof courseLevelEnum>;
