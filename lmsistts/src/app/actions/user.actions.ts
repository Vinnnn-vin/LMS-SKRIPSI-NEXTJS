"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { User } from "@/lib/models";
import {
  registerFormSchema,
  updateProfileSchema,
} from "@/lib/schemas/user.schema";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { Op } from "sequelize";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { uploadToPublic, deleteFromPublic } from "@/lib/uploadHelper";

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

    // Upload gambar baru jika ada
    if (imageFile && imageFile.size > 0) {
      console.log("🔄 Mulai proses upload ke Vercel Blob...");

      // Upload ke Vercel Blob menggunakan helper
      const uploadResult = await uploadToPublic(imageFile, "profiles");

      if (uploadResult.success && uploadResult.url) {
        // Hapus gambar lama dari Blob (jika ada)
        if (user.image && user.image.startsWith("https://")) {
          console.log("🗑️ Menghapus gambar lama:", user.image);
          await deleteFromPublic(user.image);
        }

        // Simpan URL baru
        user.image = uploadResult.url;
        console.log("✅ Upload berhasil. URL:", uploadResult.url);
      } else {
        console.error("❌ Gagal upload:", uploadResult.error);
        return { error: "Gagal mengupload gambar profil." };
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
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"IClick LMS" <${process.env.EMAIL_SERVER_USER}>`,
      to: to,
      subject: subject,
      html: html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email reset password terkirim ke: ${to}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[SEND_EMAIL_ERROR] Gagal mengirim ke ${to}:`, error);
    throw new Error(`Gagal mengirim email: ${error.message}`);
  }
}

export async function sendPasswordResetLink(email: string) {
  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return {
        success:
          "Jika email Anda terdaftar, Anda akan menerima link reset.",
      };
    }

    const token = randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 3600000); // 1 jam

    await user.update({
      reset_token: token,
      reset_token_expires: tokenExpires,
    });

    const resetLink = `${process.env.NEXTAUTH_URL}/forgot-password/${token}`;

    const subject = "Reset Password Akun IClick Anda";
    const html = `<p>Anda meminta reset password. Klik link di bawah untuk melanjutkan:</p>
                  <a href="${resetLink}">Reset Password Saya</a>
                  <p>Link ini akan kedaluwarsa dalam 1 jam.</p>`;

    await sendEmail(user.email!, subject, html);

    return {
      success: "Link reset telah dikirim. Silakan periksa email Anda.",
    };
  } catch (error: any) {
    console.error("[SEND_RESET_LINK_ERROR]", error);
    return { error: error.message || "Gagal mengirim link reset." };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expires: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return { error: "Token tidak valid atau sudah kedaluwarsa." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await user.update({
      password_hash: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
    });

    return {
      success: "Password Anda telah berhasil di-reset! Silakan login.",
    };
  } catch (error: any) {
    console.error("[RESET_PASSWORD_ERROR]", error);
    return { error: error.message || "Gagal me-reset password." };
  }
}