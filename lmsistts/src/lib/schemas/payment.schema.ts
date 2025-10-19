// lmsistts\src\lib\schemas\payment.schema.ts

import { z } from 'zod';

export const paymentStatusEnum = z.enum(['pending', 'paid', 'failed', 'expired']);

export const createPaymentSchema = z.object({
  user_id: z.number().int().positive('User ID is required'),
  course_id: z.number().int().positive('Course ID is required'),
  enrollment_id: z.number().int().positive('Enrollment ID is required'),
  amount: z.number().int().min(0, 'Amount must be at least 0'),
  payment_method: z.string().min(1, 'Payment method is required').max(100)
});

export const updatePaymentSchema = z.object({
  status: paymentStatusEnum.optional(),
  gateway_invoice_id: z.string().max(255).optional(),
  gateway_external_id: z.string().max(255).optional(),
  paid_at: z.string().datetime().optional(),
  email_sent: z.boolean().optional()
});

export const paymentIdParamSchema = z.object({
  payment_id: z.string().regex(/^\d+$/).transform(Number)
});

export const paymentCallbackSchema = z.object({
  external_id: z.string(),
  status: z.string(),
  amount: z.number(),
  paid_at: z.string().optional()
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentCallbackInput = z.infer<typeof paymentCallbackSchema>;
