// lmsistts\src\lib\uploadHelper.ts

import { writeFile, mkdir, unlink, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { sanitizeFilename } from "./fileUtils";
import { put, del } from "@vercel/blob";

/**
 * Upload file ke folder public
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
 * Hapus file dari folder public
 * @param filePath - Path relatif file (e.g., /pdfs/123_file.pdf)
 * @returns Success status
//  */
// export async function uploadToPublic(file: File, subfolder: string) {
//   try {
//     // 1. Buat nama file unik
//     // subfolder biasanya: 'pdfs' atau 'assignments'
//     const filename = `${subfolder}/${Date.now()}-${file.name.replace(/\s/g, "-")}`;

//     // 2. Upload ke Vercel Blob
//     const blob = await put(filename, file, {
//       access: "public",
//     });

//     // 3. Return URL lengkap
//     return {
//       success: true,
//       url: blob.url,
//     };
//   } catch (error: any) {
//     console.error(`Upload ${subfolder} Error:`, error);
//     return { success: false, error: `Gagal mengupload file ${subfolder}.` };
//   }
// }

export async function deleteFromPublic(fileUrl: string) {
  try {
    if (!fileUrl) return { success: true };

    // Vercel Blob butuh URL lengkap untuk menghapus
    await del(fileUrl);
    
    console.log("Deleted blob:", fileUrl);
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    // Jangan throw error agar proses tidak berhenti
    return { success: false };
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
 * @param file - File object
 * @param maxSizeMB - Ukuran maksimal dalam MB
 * @param allowedTypes - Array mime types yang diperbolehkan
 * @returns Validation result
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
 * @param file - File object
 * @returns Validation result
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
 * @param courseName - Nama course
 * @param courseId - ID course
 * @returns Nama folder yang sudah di-sanitize
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
 * Upload thumbnail untuk course
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
 * Delete course thumbnail folder
 * @param courseId - ID course
 * @param courseName - Nama course
 * @returns Success status
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
