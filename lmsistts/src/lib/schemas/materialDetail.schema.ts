// lmsistts\src\lib\schemas\materialDetail.schema.ts

import { z } from 'zod';

export const materialDetailTypeEnum = z.enum(['1', '2', '3', '4']).transform(Number); // 1=video, 2=pdf, 3=youtube, 4=assignment

export const createMaterialDetailSchema = z.object({
  material_detail_name: z.string().min(3, 'Material detail name must be at least 3 characters').max(255),
  material_detail_description: z.string().min(1, 'Description is required').max(5000),
  material_detail_type: materialDetailTypeEnum,
  materi_detail_url: z.string().min(1, 'URL is required'),
  material_id: z.number().int().positive('Material ID is required'),
  is_free: z.boolean().default(false)
});

export const updateMaterialDetailSchema = z.object({
  material_detail_name: z.string().min(3).max(255).optional(),
  material_detail_description: z.string().min(1).max(5000).optional(),
  material_detail_type: materialDetailTypeEnum.optional(),
  materi_detail_url: z.string().min(1).optional(),
  is_free: z.boolean().optional()
});

export const materialDetailIdParamSchema = z.object({
  material_detail_id: z.string().regex(/^\d+$/).transform(Number)
});

export type CreateMaterialDetailInput = z.infer<typeof createMaterialDetailSchema>;
export type UpdateMaterialDetailInput = z.infer<typeof updateMaterialDetailSchema>;
