// lmsistts\src\lib\schemas\review.schema.ts

import { z } from "zod";

export const createReviewSchema = z.object({
  user_id: z.number().int().positive("User ID is required"),
  course_id: z.number().int().positive("Course ID is required"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  review_text: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(5000),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  review_text: z.string().min(10).max(5000).optional(),
});

export const reviewIdParamSchema = z.object({
  review_id: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
