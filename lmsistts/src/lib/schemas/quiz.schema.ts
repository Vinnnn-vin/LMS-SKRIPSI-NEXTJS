// lmsistts/src/lib/schemas/quiz.schema.ts

import { z } from "zod";

export const createQuizSchema = z.object({
  quiz_title: z.string().min(3, "Judul quiz minimal 3 karakter").max(255),
  quiz_description: z.string().max(1000).optional().or(z.literal("")),
  passing_score: z.coerce.number().int().min(0).max(100).default(70),
  time_limit: z.coerce.number().int().min(1, "Minimal 1 menit").default(10),
  max_attempts: z.coerce.number().int().min(1).max(10).default(3),
  media_type: z.enum(["none", "image", "video", "pdf"]).default("none"),
  media_url: z.string().optional().nullable(),
});

export const updateQuizSchema = createQuizSchema.partial();

export const quizIdParamSchema = z.object({
  quiz_id: z.string().regex(/^\d+$/).transform(Number),
});

export const quizAnswerOptionSchema = z.object({
  option_id: z.number(),
  quiz_id: z.number().nullable(),
  question_id: z.number().nullable(),
  option_text: z.string().nullable(),
  is_correct: z.boolean().nullable(),
});

export const questionOptionSchema = z.object({
  option_id: z.number(),
  option_text: z.string(),
  is_correct: z.boolean(),
});

export const quizQuestionWithOptionsSchema = z.object({
  question_id: z.number(),
  quiz_id: z.number().nullable(),
  question_text: z.string().nullable(),
  question_type: z.enum(["multiple_choice", "checkbox", "essay"]).nullable(),
  media_type: z.enum(["none", "image", "video", "pdf"]).nullable().optional(),
  media_url: z.string().nullable().optional(),
  created_at: z.date().nullable(),
  options: z.array(quizAnswerOptionSchema).optional(),
});

export const normalizedQuestionSchema = z.object({
  question_id: z.number(),
  question_text: z.string(),
  question_type: z.enum(["multiple_choice", "checkbox", "essay"]),
  media_type: z.enum(["none", "image", "video", "pdf"]).nullable().optional(),
  media_url: z.string().nullable().optional(),
  options: z.array(questionOptionSchema),
});

export const quizWithRelationsSchema = z.object({
  quiz_id: z.number(),
  material_id: z.number().nullable(),
  course_id: z.number().nullable(),
  quiz_title: z.string().nullable(),
  quiz_description: z.string().nullable(),
  passing_score: z.number().nullable(),
  time_limit: z.number().nullable(),
  max_attempts: z.number().nullable(),
  created_at: z.date().nullable(),
  deleted_at: z.date().nullable(),

  course: z
    .object({
      course_id: z.number(),
      course_title: z.string().nullable(),
    })
    .optional(),

  material: z
    .object({
      material_id: z.number(),
      material_name: z.string().nullable(),
    })
    .optional(),

  questions: z.array(quizQuestionWithOptionsSchema).optional(),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type QuizAnswerOption = z.infer<typeof quizAnswerOptionSchema>;
export type QuizQuestionWithOptions = z.infer<
  typeof quizQuestionWithOptionsSchema
>;
export type QuizWithRelations = z.infer<typeof quizWithRelationsSchema>;

export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type NormalizedQuestion = z.infer<typeof normalizedQuestionSchema>;
