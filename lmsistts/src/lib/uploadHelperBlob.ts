// lmsistts\src\lib\uploadHelperBlob.ts

import { put, del, list } from "@vercel/blob";
import path from "path";
import { sanitizeFilename } from "./fileUtils"; // Pastikan fileUtils ada, atau gunakan fungsi sanitize di bawah

/**
 * ------------------------------------------------------------------
 * GENERIC UPLOAD HELPERS (VERCEL BLOB)
 * ------------------------------------------------------------------
 */

/**
 * Upload file standar (File object) ke Vercel Blob
 * @param file - File object dari form
 * @param folder - Folder tujuan (misal: "videos", "pdfs", "assignments")
 * @returns Object berisi success status dan URL absolut
 */
export async function uploadToBlob(
  file: File,
  folder: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const timestamp = Date.now();
    const sanitized = sanitizeFilename(file.name);
    // Path di Blob: folder/timestamp_filename
    const filename = `${folder}/${timestamp}_${sanitized}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    return { success: true, url: blob.url };
  } catch (error: any) {
    console.error("❌ Blob Upload Error:", error);
    return { success: false, error: error.message || "Gagal upload ke Blob" };
  }
}

/**
 * Upload Base64 String ke Vercel Blob
 * @param base64Data - String base64
 * @param originalFilename - Nama file asli
 * @param folder - Folder tujuan
 */
export async function uploadBase64ToBlob(
  base64Data: string,
  originalFilename: string,
  folder: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Bersihkan prefix data URI jika ada
    const base64Content = base64Data.includes("base64,")
      ? base64Data.split("base64,")[1]
      : base64Data;

    const buffer = Buffer.from(base64Content, "base64");
    const timestamp = Date.now();
    const sanitized = sanitizeFilename(originalFilename);
    const filename = `${folder}/${timestamp}_${sanitized}`;

    const blob = await put(filename, buffer, {
      access: "public",
    });

    return { success: true, url: blob.url };
  } catch (error: any) {
    console.error("❌ Blob Base64 Upload Error:", error);
    return { success: false, error: error.message || "Gagal upload Base64" };
  }
}

/**
 * ------------------------------------------------------------------
 * SPECIFIC USE CASE HELPERS
 * ------------------------------------------------------------------
 */

/**
 * Upload Foto Profil User ke Blob
 */
export async function uploadProfileImageToBlob(
  file: File,
  userId: number
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "File harus berupa gambar." };
    }

    const ext = file.type.split("/")[1] || "jpg";
    const filename = `profiles/user-${userId}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    return { success: true, url: blob.url };
  } catch (error: any) {
    console.error("❌ Profile Upload Error:", error);
    return { success: false, error: "Gagal upload foto profil." };
  }
}

/**
 * Upload Thumbnail Kursus ke Blob
 * Menggunakan struktur folder: thumbnails/course-{id}-{slug}/filename
 */
export async function uploadCourseThumbnailToBlob(
  file: File,
  courseName: string,
  courseId: number
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate nama folder yang bersih
    let folderSlug = courseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (folderSlug.length > 50) folderSlug = folderSlug.substring(0, 50);

    const folderPath = `thumbnails/course-${courseId}-${folderSlug}`;
    
    // Generate nama file unik
    const ext = path.extname(file.name).toLowerCase();
    const sanitizedName = sanitizeFilename(path.basename(file.name, ext));
    const filename = `${folderPath}/${Date.now()}_${sanitizedName}${ext}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    return { success: true, url: blob.url };
  } catch (error: any) {
    console.error("❌ Thumbnail Upload Error:", error);
    return { success: false, error: "Gagal upload thumbnail." };
  }
}

/**
 * ------------------------------------------------------------------
 * DELETION HELPERS
 * ------------------------------------------------------------------
 */

/**
 * Hapus file dari Blob berdasarkan URL absolut
 * @param url - URL lengkap file (e.g. https://....public.blob.vercel-storage.com/...)
 */
export async function deleteFromBlob(url: string): Promise<boolean> {
  try {
    if (!url) return false;
    
    // Vercel Blob menghapus berdasarkan URL lengkapnya
    await del(url);
    console.log("🗑️ Blob deleted:", url);
    return true;
  } catch (error: any) {
    console.error("❌ Blob Delete Error:", error);
    return false;
  }
}

/**
 * Hapus "Folder" di Blob (Menghapus semua file dengan prefix tertentu)
 * Berguna untuk menghapus folder thumbnail kursus saat kursus dihapus
 * @param prefix - Prefix path (misal: "thumbnails/course-123-golang")
 */
export async function deleteFolderFromBlob(prefix: string): Promise<boolean> {
  try {
    if (!prefix) return false;

    // 1. List semua file dengan prefix tersebut
    const { blobs } = await list({ prefix: prefix });

    // 2. Hapus semua file yang ditemukan
    const urlsToDelete = blobs.map((blob) => blob.url);
    if (urlsToDelete.length > 0) {
      await del(urlsToDelete);
      console.log(`🗑️ Deleted ${urlsToDelete.length} files in prefix: ${prefix}`);
    }

    return true;
  } catch (error: any) {
    console.error("❌ Blob Folder Delete Error:", error);
    return false;
  }
}

/**
 * Wrapper khusus untuk menghapus folder thumbnail kursus
 */
export async function deleteCourseThumbnailFolderBlob(
  courseId: number,
  courseName: string
): Promise<boolean> {
  let folderSlug = courseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (folderSlug.length > 50) folderSlug = folderSlug.substring(0, 50);

  const prefix = `thumbnails/course-${courseId}-${folderSlug}`;
  return await deleteFolderFromBlob(prefix);
}

/**
 * ------------------------------------------------------------------
 * VALIDATION HELPERS (Sama seperti sebelumnya)
 * ------------------------------------------------------------------
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

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5; // 5MB
  return validateFile(file, maxSize, allowedTypes);
}