// lmsistts\src\lib\schemas\enrollment.schema.ts

import { z } from 'zod';

export const enrollmentStatusEnum = z.enum(['active', 'completed', 'expired', 'cancelled']);

export const createEnrollmentSchema = z.object({
  user_id: z.number().int().positive('User ID is required'),
  course_id: z.number().int().positive('Course ID is required'),
  status: enrollmentStatusEnum.default('active')
});

export const updateEnrollmentSchema = z.object({
  status: enrollmentStatusEnum.optional(),
  learning_started_at: z.string().datetime().optional(),
  access_expires_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional()
});

export const enrollmentIdParamSchema = z.object({
  enrollment_id: z.string().regex(/^\d+$/).transform(Number)
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
