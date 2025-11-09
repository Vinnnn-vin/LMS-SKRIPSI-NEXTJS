// lmsistts\src\lib\schemas\studentProgress.schema.ts

import { z } from "zod";

export const createStudentProgressSchema = z.object({
  user_id: z.number().int().positive("User ID is required"),
  course_id: z.number().int().positive("Course ID is required"),
  material_detail_id: z
    .number()
    .int()
    .positive("Material detail ID is required"),
  is_completed: z.boolean().default(true),
});

export const updateStudentProgressSchema = z.object({
  is_completed: z.boolean(),
});

export const progressIdParamSchema = z.object({
  progress_id: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateStudentProgressInput = z.infer<
  typeof createStudentProgressSchema
>;
export type UpdateStudentProgressInput = z.infer<
  typeof updateStudentProgressSchema
>;
