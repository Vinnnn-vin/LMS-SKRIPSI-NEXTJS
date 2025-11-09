// lmsistts\src\lib\schemas\assignmentSubmission.schema.ts

import { z } from "zod";

export const submissionTypeEnum = z.enum(["file", "url", "text", "both"]);
export const submissionStatusEnum = z.enum([
  "pending",
  "submitted",
  "under_review",
  "approved",
  "rejected",
]);

export const createAssignmentSubmissionSchema = z
  .object({
    user_id: z.number().int().positive("User ID is required"),
    material_detail_id: z
      .number()
      .int()
      .positive("Material detail ID is required"),
    course_id: z.number().int().positive("Course ID is required"),
    enrollment_id: z.number().int().positive("Enrollment ID is required"),
    submission_type: submissionTypeEnum,
    file_path: z.string().max(500).optional(),
    submission_url: z.string().url().max(500).optional(),
    submission_text: z.string().max(10000).optional(),
    attempt_number: z.number().int().min(1).default(1),
  })
  .refine(
    (data) => {
      if (data.submission_type === "file") return !!data.file_path;
      if (data.submission_type === "url") return !!data.submission_url;
      if (data.submission_type === "text") return !!data.submission_text;
      if (data.submission_type === "both")
        return !!data.file_path || !!data.submission_text;
      return true;
    },
    {
      message: "Submission content is required based on submission type",
    }
  );

export const reviewAssignmentSchema = z.object({
  status: submissionStatusEnum,
  score: z.coerce.number().int().min(0).max(100).nullable().optional(),
  feedback: z.string().max(5000).optional().nullable(),
});

export const submissionIdParamSchema = z.object({
  submission_id: z.string().regex(/^\d+$/).transform(Number),
});

export const assignmentRowDataSchema = z.object({
  submission_id: z.number(),
  submitted_at: z.string(),
  status: submissionStatusEnum,
  student: z.object({
    user_id: z.number(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
  }),
  assignment: z.object({
    material_detail_id: z.number(),
    material_detail_name: z.string().nullable().optional(),
    passing_score: z.number().nullable().optional(),
  }),
  course: z.object({
    course_id: z.number(),
    course_title: z.string().nullable().optional(),
  }),
  score: z.number().nullable().optional(),
  feedback: z.string().nullable().optional(),
  submission_type: z.enum(["file", "url", "text", "both"]),
  file_path: z.string().nullable().optional(),
  submission_url: z.string().nullable().optional(),
  submission_text: z.string().nullable().optional(),
});

export const studentSubmissionFormSchema = z.object({
  file: z.unknown().refine((val) => val === null || val instanceof File, {
    message: "File tidak valid",
  }).nullable(),
  text: z.string(),
}).refine((data) => data.file !== null || data.text.trim() !== '', {
  message: "Anda harus memilih file ATAU mengisi jawaban teks.",
  path: ["file"], 
});

export type StudentSubmissionFormInput = z.infer<
  typeof studentSubmissionFormSchema
>;
export type AssignmentRowData = z.infer<typeof assignmentRowDataSchema>;

export type CreateAssignmentSubmissionInput = z.infer<
  typeof createAssignmentSubmissionSchema
>;
export type ReviewAssignmentInput = z.infer<typeof reviewAssignmentSchema>;
