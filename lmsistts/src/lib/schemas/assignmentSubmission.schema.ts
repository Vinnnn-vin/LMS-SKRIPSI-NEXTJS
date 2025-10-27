// lmsistts\src\lib\schemas\assignmentSubmission.schema.ts

import { z } from "zod";

export const submissionTypeEnum = z.enum(["file", "url", "text"]);
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
      return true;
    },
    {
      message: "Submission content is required based on submission type",
    }
  );

export const reviewAssignmentSchema = z
  .object({
    status: submissionStatusEnum, // Status baru dari Select
    // Skor: nullable, tapi jadi required jika status 'approved'
    score: z.number().int().min(0).max(100).nullable().optional(),
    feedback: z.string().max(5000).optional().nullable(), // Feedback opsional
    // reviewed_by akan diambil dari sesi di server action
  })
  .refine(
    (data) => {
      // Jika status 'approved', skor tidak boleh null/undefined
      if (data.status === "approved") {
        return data.score !== null && data.score !== undefined;
      }
      return true; // Selain 'approved', skor boleh null
    },
    {
      message: "Skor wajib diisi jika status 'Approved'",
      path: ["score"], // Tampilkan error di field skor
    }
  );

export const submissionIdParamSchema = z.object({
  submission_id: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateAssignmentSubmissionInput = z.infer<
  typeof createAssignmentSubmissionSchema
>;
export type ReviewAssignmentInput = z.infer<typeof reviewAssignmentSchema>;
