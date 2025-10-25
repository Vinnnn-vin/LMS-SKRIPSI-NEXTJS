// lmsistts\src\app\actions\user.actions.ts

'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { User } from '@/lib/models';
import { registerFormSchema, UpdateProfileInput, updateProfileSchema } from '@/lib/schemas/user.schema';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

export async function register(values: z.infer<typeof registerFormSchema>) {
  const validatedFields = registerFormSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Input tidak valid!' };
  }

  const { email, password, first_name, last_name } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 12);

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return { error: 'Email sudah terdafar!' };
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

async function uploadImage(file: File, userId: number): Promise<string | null> {
  try {
    const buffer = await file.arrayBuffer();
    const ext = file.type.split('/')[1];
    const filename = `user-${userId}-${Date.now()}.${ext}`;
    
    // Pastikan folder public/uploads ada
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filepath = path.join(uploadsDir, filename);
    await fs.writeFile(filepath, Buffer.from(buffer));

    return `/uploads/profiles/${filename}`;
  } catch (error) {
    console.error("UPLOAD_IMAGE_ERROR:", error);
    throw new Error('Gagal upload gambar');
  }
}

export async function updateUserProfile(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: 'Anda harus login untuk mengedit profil.' };
    }

    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const imageFile = formData.get('image') as File | null;

    const validatedFields = updateProfileSchema.safeParse({
      first_name,
      last_name,
    });
    if (!validatedFields.success) {
      return { error: 'Input tidak valid!' };
    }

    const userId = parseInt(session.user.id, 10);

    const user = await User.findByPk(userId);
    if (!user) {
      return { error: 'Pengguna tidak ditemukan.' };
    }

    user.first_name = first_name || null;
    user.last_name = last_name || null;

    // Upload gambar jika ada
    if (imageFile && imageFile.size > 0) {
      const imageUrl = await uploadImage(imageFile, userId);
      user.image = imageUrl;
    }

    await user.save();

    const fullName = `${user.first_name} ${user.last_name}`.trim();

    // PENTING: Revalidate semua path yang menggunakan session
    // Ini akan memaksa Next.js untuk refresh cache dan NextAuth untuk mengambil data terbaru
    revalidatePath('/', 'layout');
    
    // Revalidate path spesifik juga
    revalidatePath('/student/dashboard');
    revalidatePath('/student/profile/edit');

    return {
      success: 'Profil berhasil diperbarui!',
      user: {
        name: fullName,
        email: user.email,
        image: user.image,
      },
    };
  } catch (error) {
    console.error("UPDATE_PROFILE_ERROR:", error);
    const msg = error instanceof Error ? error.message : 'Gagal memperbarui profil.';
    return { error: msg };
  }
}