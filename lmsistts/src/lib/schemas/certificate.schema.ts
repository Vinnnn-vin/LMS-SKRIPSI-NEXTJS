// lmsistts\src\lib\schemas\certificate.schema.ts

import { z } from 'zod';

export const createCertificateSchema = z.object({
  user_id: z.number().int().positive('User ID is required'),
  course_id: z.number().int().positive('Course ID is required'),
  enrollment_id: z.number().int().positive('Enrollment ID is required'),
  certificate_url: z.string().url().max(255),
  certificate_number: z.string().min(5).max(100)
});

export const certificateIdParamSchema = z.object({
  certificate_id: z.string().regex(/^\d+$/).transform(Number)
});

export const certificateNumberParamSchema = z.object({
  certificate_number: z.string().min(5).max(100)
});

export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;