// lmsistts\src\lib\uploadHelper.ts

import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { sanitizeFilename } from './fileUtils';

/**
 * Upload file ke folder public
 * @param file - File object dari form
 * @param subFolder - Subfolder tujuan (videos, pdfs, assignments)
 * @returns Path relatif file atau error
 */
export async function uploadToPublic(
  file: File,
  subFolder: 'videos' | 'pdfs' | 'assignments'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const sanitized = sanitizeFilename(file.name);
    const fileName = `${timestamp}_${sanitized}`;

    const publicDir = path.join(process.cwd(), 'public', subFolder);
    
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, fileName);
    await writeFile(filePath, Buffer.from(buffer));

    const relativePath = `/${subFolder}/${fileName}`;
    
    return { success: true, url: relativePath };
  } catch (error: any) {
    console.error('❌ Upload file error:', error);
    return { success: false, error: error.message || 'Failed to upload file' };
  }
}

/**
 * Hapus file dari folder public
 * @param filePath - Path relatif file (e.g., /pdfs/123_file.pdf)
 * @returns Success status
 */
export async function deleteFromPublic(
  filePath: string
): Promise<boolean> {
  try {
    if (!filePath || !filePath.startsWith('/')) return false;
    
    const fullPath = path.join(process.cwd(), 'public', filePath);
    
    if (existsSync(fullPath)) {
      await unlink(fullPath);
      console.log('🗑️ File deleted:', filePath);
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('❌ Delete file error:', error);
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