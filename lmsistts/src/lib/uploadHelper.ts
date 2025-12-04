// lmsistts\src\lib\uploadHelper.ts

import { writeFile, mkdir, unlink, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { sanitizeFilename } from "./fileUtils";

/**
 * ------------------------------------------------------------------
 * GENERIC UPLOAD HELPERS
 * ------------------------------------------------------------------
 */

/**
 * Upload file standar (File object) ke folder public
 * @param file - File object dari form
 * @param subFolder - Subfolder tujuan (videos, pdfs, assignments, thumbnails)
 * @returns Path relatif file atau error
 */
export async function uploadToPublic(
  file: File,
  subFolder: "videos" | "pdfs" | "assignments" | "thumbnails" | string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const sanitized = sanitizeFilename(file.name);
    const fileName = `${timestamp}_${sanitized}`;

    const publicDir = path.join(process.cwd(), "public", subFolder);

    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, fileName);
    await writeFile(filePath, Buffer.from(buffer));

    const relativePath = `/${subFolder}/${fileName}`;

    return { success: true, url: relativePath };
  } catch (error: any) {
    console.error("❌ Upload file error:", error);
    return { success: false, error: error.message || "Failed to upload file" };
  }
}

/**
 * (BARU) Upload Base64 String ke folder public
 * Diambil dari logika internal lecturer.actions.ts
 * @param base64Data - String base64 (bisa dengan atau tanpa prefix data:type;base64,)
 * @param originalFilename - Nama file asli untuk sanitasi
 * @param subFolder - Folder tujuan (videos, pdfs, assignments)
 */
export async function uploadBase64ToPublic(
  base64Data: string,
  originalFilename: string,
  subFolder: "videos" | "pdfs" | "assignments" | string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Hilangkan prefix data uri jika ada (contoh: "data:image/png;base64,")
    const base64Content = base64Data.includes("base64,")
      ? base64Data.split("base64,")[1]
      : base64Data;

    const buffer = Buffer.from(base64Content, "base64");
    const timestamp = Date.now();
    const sanitized = sanitizeFilename(originalFilename);
    const fileName = `${timestamp}_${sanitized}`;

    const publicDir = path.join(process.cwd(), "public", subFolder);

    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, fileName);
    await writeFile(filePath, buffer);

    const relativePath = `/${subFolder}/${fileName}`;

    return { success: true, url: relativePath };
  } catch (error: any) {
    console.error("❌ Upload base64 error:", error);
    return { success: false, error: error.message || "Gagal upload file" };
  }
}

/**
 * ------------------------------------------------------------------
 * SPECIFIC USE CASE HELPERS
 * ------------------------------------------------------------------
 */

/**
 * (BARU) Upload Foto Profil User
 * Diambil dari logika internal user.actions.ts
 * @param file - File object gambar
 * @param userId - ID User untuk penamaan file yang unik
 */
export async function uploadProfileImage(
  file: File,
  userId: number
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validasi sederhana (bisa menggunakan validateImageFile jika ingin lebih ketat)
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "File harus berupa gambar." };
    }

    const buffer = await file.arrayBuffer();
    // Ambil ekstensi file (default jpg jika tidak terdeteksi)
    const ext = file.type.split("/")[1] || "jpg";
    const filename = `user-${userId}-${Date.now()}.${ext}`;

    // Path khusus untuk profil: /public/uploads/profiles
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "profiles");

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, Buffer.from(buffer));

    const relativeUrl = `/uploads/profiles/${filename}`;
    return { success: true, url: relativeUrl };
  } catch (error: any) {
    console.error("❌ Upload profile image error:", error);
    return { success: false, error: "Gagal upload gambar profil." };
  }
}

/**
 * Upload thumbnail untuk course (Logic spesifik dengan folder terpisah)
 * @param file - File thumbnail
 * @param courseName - Nama course
 * @param courseId - ID course
 * @returns Upload result dengan URL
 */
export async function uploadCourseThumbnail(
  file: File,
  courseName: string,
  courseId: number
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const folderPath = generateCourseThumbnailFolder(courseName, courseId);
    const uniqueFileName = generateUniqueFilename(file.name);
    const publicDir = path.join(process.cwd(), "public", folderPath);

    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    const buffer = await file.arrayBuffer();
    const filePath = path.join(publicDir, uniqueFileName);
    await writeFile(filePath, Buffer.from(buffer));

    const relativePath = `/${folderPath}/${uniqueFileName}`;

    console.log("✅ Thumbnail uploaded:", relativePath);
    return { success: true, url: relativePath };
  } catch (error: any) {
    console.error("❌ Upload thumbnail error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload thumbnail",
    };
  }
}

/**
 * ------------------------------------------------------------------
 * DELETION & UTILITY HELPERS
 * ------------------------------------------------------------------
 */

/**
 * Hapus file dari folder public
 * @param filePath - Path relatif file (e.g., /pdfs/123_file.pdf)
 * @returns Success status
 */
export async function deleteFromPublic(filePath: string): Promise<boolean> {
  try {
    if (!filePath || !filePath.startsWith("/")) return false;

    // Mencegah directory traversal attack sederhana
    if (filePath.includes("..")) return false;

    const fullPath = path.join(process.cwd(), "public", filePath);

    if (existsSync(fullPath)) {
      await unlink(fullPath);
      console.log("🗑️ File deleted:", filePath);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error("❌ Delete file error:", error);
    return false;
  }
}

/**
 * Hapus folder beserta isinya dari public
 * @param folderPath - Path folder relatif dari public (e.g., 'thumbnails/course-123')
 * @returns Success status
 */
export async function deleteFolderFromPublic(
  folderPath: string
): Promise<boolean> {
  try {
    // Mencegah penghapusan folder root public secara tidak sengaja
    if (!folderPath || folderPath === "/" || folderPath === "\\") return false;

    const fullPath = path.join(process.cwd(), "public", folderPath);

    if (existsSync(fullPath)) {
      await rm(fullPath, { recursive: true, force: true });
      console.log("🗑️ Folder deleted:", folderPath);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error("❌ Delete folder error:", error);
    return false;
  }
}

/**
 * Validasi file sebelum upload
 */
export function validateFile(
  file: File,
  maxSizeMB: number,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  const fileSizeMB = file.size / 1024 / 1024;

  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Ukuran file ${fileSizeMB.toFixed(2)}MB melebihi batas maksimal ${maxSizeMB}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipe file ${file.type} tidak diperbolehkan`,
    };
  }

  return { valid: true };
}

/**
 * Validasi khusus untuk file gambar thumbnail
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5; // 5MB

  return validateFile(file, maxSize, allowedTypes);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const ext = getFileExtension(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitized = sanitizeFilename(nameWithoutExt);

  return `${timestamp}_${random}_${sanitized}${ext}`;
}

/**
 * Generate nama folder untuk course thumbnail
 */
export function generateCourseThumbnailFolder(
  courseName: string,
  courseId: number
): string {
  let folderName = courseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (folderName.length > 50) {
    folderName = folderName.substring(0, 50).replace(/-$/, "");
  }

  return `thumbnails/course-${courseId}-${folderName}`;
}

/**
 * Delete course thumbnail folder wrapper
 */
export async function deleteCourseThumbnailFolder(
  courseId: number,
  courseName: string
): Promise<boolean> {
  try {
    const folderPath = generateCourseThumbnailFolder(courseName, courseId);
    return await deleteFolderFromPublic(folderPath);
  } catch (error: any) {
    console.error("❌ Delete course thumbnail folder error:", error);
    return false;
  }
}