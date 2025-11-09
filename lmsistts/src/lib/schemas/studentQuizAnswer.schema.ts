// lmsistts\src\lib\schemas\studentQuizAnswer.schema.ts

import { z } from "zod";

export const quizAnswerStatusEnum = z.enum(["passed", "failed", "pending"]);

export const submitQuizAnswerSchema = z.object({
  user_id: z.number().int().positive("User ID is required"),
  quiz_id: z.number().int().positive("Quiz ID is required"),
  course_id: z.number().int().positive("Course ID is required"),
  question_id: z.number().int().positive("Question ID is required"),
  selected_option_id: z.number().int().positive().optional(),
  answer_text: z.string().max(5000).optional(),
  attempt_session: z.number().int().min(1).default(1),
});

export const gradeQuizSchema = z.object({
  score: z.number().int().min(0).max(100),
  status: quizAnswerStatusEnum,
});

export type SubmitQuizAnswerInput = z.infer<typeof submitQuizAnswerSchema>;
export type GradeQuizInput = z.infer<typeof gradeQuizSchema>;
