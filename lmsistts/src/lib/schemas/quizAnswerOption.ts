// lmsistts\src\lib\schemas\quizAnswerOption.ts

import { z } from "zod";

export const createQuizAnswerOptionSchema = z.object({
  quiz_id: z.number().int().positive("Quiz ID is required"),
  question_id: z.number().int().positive("Question ID is required"),
  option_text: z.string().min(1, "Option text is required").max(1000),
  is_correct: z.boolean().default(false),
});

export const updateQuizAnswerOptionSchema = z.object({
  option_text: z.string().min(1).max(1000).optional(),
  is_correct: z.boolean().optional(),
});

export const optionIdParamSchema = z.object({
  option_id: z.string().regex(/^\d+$/).transform(Number),
});

export const answerOptionSchema = z.object({
  option_text: z.string().min(1, "Teks opsi tidak boleh kosong"),
  is_correct: z.boolean().default(false),
});

export type CreateQuizAnswerOptionInput = z.infer<
  typeof createQuizAnswerOptionSchema
>;
export type UpdateQuizAnswerOptionInput = z.infer<
  typeof updateQuizAnswerOptionSchema
>;
