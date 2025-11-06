// lmsistts\src\lib\schemas\quizQuestion.schema.ts

import { z } from 'zod';
import { answerOptionSchema } from './quizAnswerOption';

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

export const createQuestionSchema = z.object({
  question_text: z.string().min(3, 'Teks pertanyaan tidak boleh kosong'),
  question_type: z.enum(['multiple_choice', 'checkbox', 'essay']),
  options: z.array(answerOptionSchema)
    .min(1, 'Minimal harus ada 1 pilihan jawaban')
    .refine(options => options.some(opt => opt.is_correct), {
        message: 'Minimal harus ada 1 jawaban yang ditandai benar (is_correct: true)',
    }),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreateQuizQuestionInput = z.infer<typeof createQuizQuestionSchema>;
export type UpdateQuizQuestionInput = z.infer<typeof updateQuizQuestionSchema>;