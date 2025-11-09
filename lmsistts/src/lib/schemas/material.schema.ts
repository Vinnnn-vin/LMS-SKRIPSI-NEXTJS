// lmsistts\src\lib\schemas\material.schema.ts

import { z } from "zod";
import {
  materialDetailDataSchema,
  quizDataSchema,
} from "./materialDetail.schema";

export const createMaterialSchema = z.object({
  material_name: z
    .string()
    .min(3, "Material name must be at least 3 characters")
    .max(255),
  material_description: z.string().max(1000).optional(),
});

export const updateMaterialSchema = createMaterialSchema.partial();

export const materialIdParamSchema = z.object({
  material_id: z.string().regex(/^\d+$/).transform(Number),
});

export const materialWithChildrenSchema = createMaterialSchema.extend({
  material_id: z.number(),
  course_id: z.number(),
  details: z.array(materialDetailDataSchema).optional(),
  quizzes: z.array(quizDataSchema).optional(),
});
export type MaterialWithChildren = z.infer<typeof materialWithChildrenSchema>;

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
