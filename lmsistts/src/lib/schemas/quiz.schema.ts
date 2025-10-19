// lmsistts\src\lib\schemas\quiz.schema.ts

import { z } from 'zod';

export const createQuizSchema = z.object({
  material_id: z.number().int().positive('Material ID is required'),
  course_id: z.number().int().positive('Course ID is required'),
  quiz_title: z.string().min(5, 'Quiz title must be at least 5 characters').max(255),
  quiz_description: z.string().max(5000).optional(),
  passing_score: z.number().int().min(0).max(100, 'Passing score must be between 0 and 100'),
  time_limit: z.number().int().min(1, 'Time limit must be at least 1 minute').max(300),
  max_attempts: z.number().int().min(1).max(10)
});

export const updateQuizSchema = z.object({
  quiz_title: z.string().min(5).max(255).optional(),
  quiz_description: z.string().max(5000).optional(),
  passing_score: z.number().int().min(0).max(100).optional(),
  time_limit: z.number().int().min(1).max(300).optional(),
  max_attempts: z.number().int().min(1).max(10).optional()
});

export const quizIdParamSchema = z.object({
  quiz_id: z.string().regex(/^\d+$/).transform(Number)
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;