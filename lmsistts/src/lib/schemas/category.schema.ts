// lmsistts\src\lib\schemas\category.schema.ts

import { z } from 'zod';

export const createCategorySchema = z.object({
  category_name: z.string().min(3, 'Category name must be at least 3 characters').max(255),
  category_description: z.string().max(1000).optional(),
  image_url: z.string().url('Invalid URL format').optional().or(z.literal(''))
});

export const updateCategorySchema = z.object({
  category_name: z.string().min(3).max(255).optional(),
  category_description: z.string().max(1000).optional(),
  image_url: z.string().url().optional().or(z.literal(''))
});

export const categoryIdParamSchema = z.object({
  category_id: z.string().regex(/^\d+$/).transform(Number)
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;