// lmsistts\src\app\actions\user.actions.ts

"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { User } from "@/lib/models";
import {
  registerFormSchema,
  UpdateProfileInput,
  updateProfileSchema,
} from "@/lib/schemas/user.schema";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { Op } from "sequelize";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

import { uploadProfileImage, deleteFromPublic } from "@/lib/uploadHelper";

import { uploadProfileImageToBlob, deleteFromBlob } from "@/lib/uploadHelperBlob";

export async function register(values: z.infer<typeof registerFormSchema>) {
  const validatedFields = registerFormSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Input tidak valid!" };
  }

  const { email, password, first_name, last_name } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 12);

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return { error: "Email sudah terdafar!" };
  }

  try {
    await User.create({
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      first_name: first_name || null,
      last_name: last_name || null,
      role: "student",
    });
    return { success: "Registrasi berhasil! Silakan login." };
  } catch (error) {
    console.error("REGISTER_ERROR:", error);
    return { error: "Terjadi kesalahan pada server." };
  }
}

// async function uploadImage(file: File, userId: number): Promise<string | null> {
//   try {
//     const buffer = await file.arrayBuffer();
//     const ext = file.type.split("/")[1];
//     const filename = `user-${userId}-${Date.now()}.${ext}`;

//     const uploadsDir = path.join(
//       process.cwd(),
//       "public",
//       "uploads",
//       "profiles"
//     );
//     await fs.mkdir(uploadsDir, { recursive: true });

//     const filepath = path.join(uploadsDir, filename);
//     await fs.writeFile(filepath, Buffer.from(buffer));

//     return `/uploads/profiles/${filename}`;
//   } catch (error) {
//     console.error("UPLOAD_IMAGE_ERROR:", error);
//     throw new Error("Gagal upload gambar");
//   }
// }

export async function updateUserProfile(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "Anda harus login untuk mengedit profil." };
    }

    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const imageFile = formData.get("image") as File | null;

    const validatedFields = updateProfileSchema.safeParse({
      first_name,
      last_name,
    });
    if (!validatedFields.success) {
      return { error: "Input tidak valid!" };
    }

    const userId = parseInt(session.user.id, 10);

    const user = await User.findByPk(userId);
    if (!user) {
      return { error: "Pengguna tidak ditemukan." };
    }

    user.first_name = first_name || null;
    user.last_name = last_name || null;

    if (imageFile && imageFile.size > 0) {
      // const uploadResult = await uploadProfileImage(imageFile, userId);
      // if (
      //   user.image && user.image !== uploadResult.url
      // ) {
      //   try {
      //     const oldFilename = user.image.split("/").pop();
      //     const oldImagePath = path.join(
      //       process.cwd(),
      //       "public",
      //       "uploads",
      //       "profiles",
      //       oldFilename || ""
      //     );
      //     await fs.unlink(oldImagePath);
      //   } catch (err) {
      //     console.log("Old image not found or already deleted");
      //   }
      // }

      // user.image = uploadResult.url;

      // Gunakan Blob upload
      const uploadResult = await uploadProfileImageToBlob(imageFile, userId);
      
      if (uploadResult.success && uploadResult.url) {
        // Cek apakah ada foto lama untuk dihapus
        // Kita juga bisa cek apakah foto lama itu blob atau lokal
        if (user.image && user.image !== uploadResult.url) {
           if (user.image.startsWith("http")) {
             // Asumsi kalau http berarti Blob URL
             await deleteFromBlob(user.image);
           } 
           // Jika foto lama adalah lokal (/uploads/...), 
           // kita biarkan saja atau bisa dihapus pakai logika fs lama jika mau bersih-bersih
        }
        user.image = uploadResult.url;
      } else {
         return { error: uploadResult.error || "Gagal upload gambar profil." };
      }
    }

    await user.save();

    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    revalidatePath("/", "layout");
    revalidatePath("/profile/edit");

    return {
      success: true,
      message: "Profil berhasil diperbarui!",
      user: {
        name: fullName,
        email: user.email,
        image: user.image,
      },
    };
  } catch (error) {
    console.error("UPDATE_PROFILE_ERROR:", error);
    const msg =
      error instanceof Error ? error.message : "Gagal memperbarui profil.";
    return { error: msg };
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // Gunakan Gmail
      auth: {
        user: process.env.EMAIL_SERVER_USER, // Email dari .env
        pass: process.env.EMAIL_SERVER_PASSWORD, // App Password dari .env
      },
    });

    const mailOptions = {
      from: `"IClick LMS" <${process.env.EMAIL_SERVER_USER}>`,
      to: to,
      subject: subject,
      html: html,
    };

    // Kirim email
    await transporter.sendMail(mailOptions);
    console.log(`Email reset password terkirim ke: ${to}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[SEND_EMAIL_ERROR] Gagal mengirim ke ${to}:`, error);
    // Jika gagal mengirim, jangan beritahu user (keamanan), cukup log di server
    // Namun untuk development, kita lempar error agar tahu masalahnya:
    throw new Error(`Gagal mengirim email: ${error.message}`);
  }
}

export async function sendPasswordResetLink(email: string) {
  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Jangan beritahu jika email ada atau tidak (keamanan)
      return {
        success: "Jika email Anda terdaftar, Anda akan menerima link reset.",
      };
    }

    // 1. Buat token
    const token = randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 3600000); // 1 jam

    // 2. Simpan token ke database
    await user.update({
      reset_token: token,
      reset_token_expires: tokenExpires,
    });

    const resetLink = `${process.env.NEXTAUTH_URL}/forgot-password/${token}`;

    // 3. Kirim email
    const subject = "Reset Password Akun IClick Anda";
    const html = `<p>Anda meminta reset password. Klik link di bawah untuk melanjutkan:</p>
                  <a href="${resetLink}">Reset Password Saya</a>
                  <p>Link ini akan kedaluwarsa dalam 1 jam.</p>`;

    // TODO: Ganti ini dengan layanan email Anda
    await sendEmail(user.email!, subject, html);

    return { success: "Link reset telah dikirim. Silakan periksa email Anda." };
  } catch (error: any) {
    console.error("[SEND_RESET_LINK_ERROR]", error);
    return { error: error.message || "Gagal mengirim link reset." };
  }
}

/**
 * Memvalidasi token dan me-reset password
 * (Fungsi ini sudah benar dari sebelumnya, tidak perlu diubah)
 */
export async function resetPassword(token: string, newPassword: string) {
  try {
    // 1. Cari user berdasarkan token yang valid
    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expires: {
          [Op.gt]: new Date(), // Pastikan token belum kedaluwarsa
        },
      },
    });

    if (!user) {
      return { error: "Token tidak valid atau sudah kedaluwarsa." };
    }

    // 2. Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 3. Update password dan hapus token
    await user.update({
      password_hash: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
    });

    return { success: "Password Anda telah berhasil di-reset! Silakan login." };
  } catch (error: any) {
    console.error("[RESET_PASSWORD_ERROR]", error);
    return { error: error.message || "Gagal me-reset password." };
  }
}
