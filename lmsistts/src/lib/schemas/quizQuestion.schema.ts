// lmsistts\src\lib\schemas\quizQuestion.schema.ts

import { z } from 'zod';

export const questionTypeEnum = z.enum(['multiple_choice', 'checkbox', 'essay']);

export const createQuizQuestionSchema = z.object({
  quiz_id: z.number().int().positive('Quiz ID is required'),
  question_text: z.string().min(5, 'Question must be at least 5 characters').max(5000),
  question_type: questionTypeEnum
});

export const updateQuizQuestionSchema = z.object({
  question_text: z.string().min(5).max(5000).optional(),
  question_type: questionTypeEnum.optional()
});

export const questionIdParamSchema = z.object({
  question_id: z.string().regex(/^\d+$/).transform(Number)
});

export type CreateQuizQuestionInput = z.infer<typeof createQuizQuestionSchema>;
export type UpdateQuizQuestionInput = z.infer<typeof updateQuizQuestionSchema>;