// lmsistts\src\lib\schemas\notification.schema.ts

import { z } from 'zod';

export const notificationTypeEnum = z.enum(['info', 'success', 'warning', 'error']);

export const createNotificationSchema = z.object({
  user_id: z.number().int().positive('User ID is required'),
  notification_title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  notification_message: z.string().min(1, 'Message is required').max(5000),
  notification_type: notificationTypeEnum.default('info')
});

export const updateNotificationSchema = z.object({
  is_read: z.boolean()
});

export const notificationIdParamSchema = z.object({
  notification_id: z.string().regex(/^\d+$/).transform(Number)
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;