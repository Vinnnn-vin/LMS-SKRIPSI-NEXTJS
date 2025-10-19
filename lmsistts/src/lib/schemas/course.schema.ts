// lmsistts\src\lib\schemas\course.schema.ts

import { z } from 'zod';

export const courseLevelEnum = z.enum(['Beginner', 'Intermediate', 'Advanced']);

export const createCourseSchema = z.object({
  course_title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  course_description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  course_level: courseLevelEnum,
  course_price: z.number().int().min(0, 'Price must be at least 0').max(100000000),
  course_duration: z.number().int().min(0).default(0),
  publish_status: z.number().int().min(0).max(1).default(0),
  category_id: z.number().int().positive('Category ID is required'),
  thumbnail_url: z.string().url().optional().or(z.literal(''))
});

export const updateCourseSchema = z.object({
  course_title: z.string().min(5).max(255).optional(),
  course_description: z.string().min(10).max(5000).optional(),
  course_level: courseLevelEnum.optional(),
  course_price: z.number().int().min(0).max(100000000).optional(),
  course_duration: z.number().int().min(0).optional(),
  publish_status: z.number().int().min(0).max(1).optional(),
  category_id: z.number().int().positive().optional(),
  thumbnail_url: z.string().url().optional().or(z.literal(''))
});

export const courseIdParamSchema = z.object({
  course_id: z.string().regex(/^\d+$/).transform(Number)
});

export const courseQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).default(10),
  search: z.string().optional(),
  category_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  level: courseLevelEnum.optional(),
  min_price: z.string().regex(/^\d+$/).transform(Number).optional(),
  max_price: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort_by: z.enum(['created_at', 'course_price', 'course_title']).default('created_at'),
  sort_order: z.enum(['ASC', 'DESC']).default('DESC')
});

export const courseCardSchema = z.object({
  course_id: z.number(),
  course_title: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  course_price: z.number().nullable(),
  lecturer: z.object({
    name: z.string().nullable(),
  }),
  category: z.object({
    category_name: z.string().nullable(),
  }),
});

export const courseCardDataSchema = z.array(courseCardSchema);

export type CourseCardData = z.infer<typeof courseCardSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;