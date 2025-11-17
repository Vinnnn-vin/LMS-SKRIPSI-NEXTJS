// lmsistts/src/lib/schemas/course.schema.ts

import { z } from "zod";

export const courseLevelEnum = z.enum(["Beginner", "Intermediate", "Advanced"]);
export const publishRequestStatusEnum = z.enum([
  "none",
  "pending",
  "approved",
  "rejected",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, `Ukuran file maksimal 5MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Format gambar tidak valid. Gunakan .jpg, .jpeg, .png, atau .webp"
  )
  .optional();

const idFromString = z.preprocess((val) => {
  if (
    val !== null &&
    val !== undefined &&
    typeof val === "string" &&
    val.trim() !== ""
  ) {
    const num = Number(val);
    return isNaN(num) ? val : num;
  }
  return val === "" ? null : val;
}, z.number().int().positive("ID harus berupa angka positif").nullable());

export const createCourseSchema = z.object({
  course_title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(255),
  course_description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000),
  what_youll_learn: z
    .string()
    .max(2000, "Maksimal 2000 karakter")
    .optional()
    .or(z.literal("")),
  requirements: z
    .string()
    .max(1000, "Maksimal 1000 karakter")
    .optional()
    .or(z.literal("")),
  course_level: courseLevelEnum,
  course_price: idFromString.pipe(
    z.number().max(100000000, "Harga terlalu besar")
  ),
  course_duration: idFromString,
  publish_status: z.number().int().min(0).max(1).default(0),
  publish_request_status: publishRequestStatusEnum.default("none"),
  category_id: idFromString.refine((val) => val !== null, {
    message: "Kategori wajib dipilih",
  }),
  user_id: idFromString.refine((val) => val !== null, {
    message: "Dosen wajib dipilih",
  }),
  thumbnail_file: z.instanceof(File).optional(),
});

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
    what_youll_learn: z
      .string()
      .max(2000, "Maksimal 2000 karakter")
      .optional()
      .or(z.literal("")),
    requirements: z
      .string()
      .max(1000, "Maksimal 1000 karakter")
      .optional()
      .or(z.literal("")),
    course_level: courseLevelEnum.optional(),
    course_price: idFromString
      .pipe(z.number().max(100000000, "Harga terlalu besar"))
      .optional(),
    course_duration: idFromString.optional(),
    publish_status: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (typeof val === "string") {
          return val === "1" || val === "on" || val === "true" ? 1 : 0;
        }
        return val === 1 ? 1 : 0;
      })
      .pipe(z.literal(0).or(z.literal(1)))
      .optional(),
    category_id: idFromString.refine((val) => val !== null, {
      message: "Kategori wajib dipilih",
    }),
    user_id: idFromString.refine((val) => val !== null, {
      message: "Dosen wajib dipilih",
    }),
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

export const courseIdParamSchema = z.object({
  course_id: z
    .string()
    .regex(/^\d+$/, "Course ID harus berupa angka")
    .transform(Number),
});

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

export const courseCardSchema = z.object({
  course_id: z.number(),
  course_title: z.string().nullable(),
  thumbnail_url: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\//.test(val) || /^\/thumbnails\//.test(val),
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

export const lecturerUpdateCourseSchema = lecturerCreateCourseSchema
  .partial()
  .extend({
    thumbnail_file: z.instanceof(File).optional().nullable(),
  });

export const adminCourseRowDataSchema = updateCourseSchema.safeExtend({
  course_id: z.number(),
  course_title: z.string().nullable(),
  thumbnail_url: z.string().nullable().optional(),
  publish_request_status: publishRequestStatusEnum.nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
  lecturer: z
    .object({
      first_name: z.string().nullable().optional(),
      last_name: z.string().nullable().optional(),
    })
    .optional(),
  category: z
    .object({
      category_name: z.string().nullable().optional(),
    })
    .optional(),
});

export type AdminCourseRowData = z.infer<typeof adminCourseRowDataSchema>;

export const lecturerCourseDataSchema = z.object({
  course_id: z.number(),
  course_title: z.string().nullable(),
  course_description: z.string().nullable(),
  what_youll_learn: z.string().nullable(),
  requirements: z.string().nullable(),
  course_level: courseLevelEnum.nullable(),
  category_id: z.number().nullable(),
  thumbnail_url: z.string().nullable(),
  publish_status: z.number().nullable(),
  publish_request_status: publishRequestStatusEnum.nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
  course_duration: z.number().nullable().optional(),
  category: z
    .object({
      category_name: z.string().nullable().optional(),
    })
    .optional(),
  materials: z
    .array(
      z.object({
        material_id: z.number(),
        material_name: z.string().nullable(),
        details: z
          .array(
            z.object({
              material_detail_id: z.number(),
              material_detail_name: z.string().nullable(),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

export type LecturerCourseData = z.infer<typeof lecturerCourseDataSchema>;

export type LecturerCreateCourseInput = z.infer<
  typeof lecturerCreateCourseSchema
>;
export type LecturerUpdateCourseInput = z.infer<
  typeof lecturerUpdateCourseSchema
>;

export type CourseCardData = z.infer<typeof courseCardSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
export type CourseLevel = z.infer<typeof courseLevelEnum>;
