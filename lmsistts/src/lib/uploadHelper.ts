// lmsistts/src/lib/uploadHelper.ts
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload file ke folder public
 * @param file - File yang akan diupload
 * @param subFolder - Subfolder dalam public (e.g., 'videos', 'pdfs')
 * @returns UploadResult dengan relative path jika sukses
 */
export async function uploadToPublic(
  file: File,
  subFolder: 'videos' | 'pdfs' | 'documents'
): Promise<UploadResult> {
  try {
    // Validasi file
    if (!file || !(file instanceof File)) {
      return { success: false, error: 'File tidak valid' };
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename dengan timestamp
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const fileName = `${timestamp}_${originalName}`;

    // Path ke folder public
    const publicDir = path.join(process.cwd(), 'public', subFolder);
    
    // Buat folder jika belum ada
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    // Path lengkap file
    const filePath = path.join(publicDir, fileName);

    // Simpan file
    await writeFile(filePath, buffer);

    // Return relative path (untuk disimpan di database)
    const relativePath = `/${subFolder}/${fileName}`;

    return {
      success: true,
      url: relativePath,
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengupload file',
    };
  }
}

/**
 * Delete file dari folder public
 * @param relativePath - Path relatif file (e.g., '/videos/123_video.mp4')
 */
export async function deleteFromPublic(relativePath: string): Promise<boolean> {
  try {
    if (!relativePath) return false;

    const { unlink } = await import('fs/promises');
    const filePath = path.join(process.cwd(), 'public', relativePath);

    if (existsSync(filePath)) {
      await unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
}