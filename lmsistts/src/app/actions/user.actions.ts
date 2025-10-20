// lmsistts\src\app\actions\user.actions.ts

'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '@/lib/models';
import { registerFormSchema } from '@/lib/schemas/user.schema';

export async function register(values: z.infer<typeof registerFormSchema>) {
  const validatedFields = registerFormSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Input tidak valid!' };
  }

  const { email, password, first_name, last_name } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 12);

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return { error: 'Email sudah terdaftar!' };
  }

  try {
    await User.create({
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      first_name: first_name || null,
      last_name: last_name || null,
      role: 'student',
    });
    return { success: 'Registrasi berhasil! Silakan login.' };
  } catch (error) {
    console.error("REGISTER_ERROR:", error);
    return { error: 'Terjadi kesalahan pada server.' };
  }
}