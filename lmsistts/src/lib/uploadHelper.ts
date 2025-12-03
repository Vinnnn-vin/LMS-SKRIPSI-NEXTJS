// src/lib/uploadHelper.ts
// Menggantikan import fs dan path
import { put, del } from "@vercel/blob"; 

// Fungsi Upload Thumbnail Kursus
export async function uploadCourseThumbnail(
  file: File,
  title: string,
  courseId: number
) {
  try {
    if (!file || file.size === 0) {
        return { success: false, error: "File kosong." };
    }
    
    // 1. Bersihkan nama file untuk path di Blob
    const safeTitle = title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const extension = file.name.split(".").pop();
    const filename = `thumbnails/course-${courseId}-${safeTitle}-${Date.now()}.${extension}`;

    // 2. Panggil Vercel Blob PUT
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type, // Tambahkan tipe konten
    });

    // 3. Simpan URL penuh (https://...) ke database
    return {
      success: true,
      url: blob.url,
    };
  } catch (error: any) {
    console.error("Upload Thumbnail Error:", error);
    return { success: false, error: `Gagal menyimpan thumbnail ke Blob: ${error.message}` };
  }
}

// Fungsi Umum untuk semua file lain (Profil, PDF, Tugas)
export async function uploadToPublic(file: File, subfolder: string) {
  try {
    if (!file || file.size === 0) {
        return { success: false, error: "File kosong." };
    }
    
    // Nama file di dalam folder (e.g., profiles/12345-foto.png)
    const cleanName = file.name.replace(/\s/g, "-");
    const filename = `${subfolder}/${Date.now()}-${cleanName}`;

    // Panggil Vercel Blob PUT
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true, // Tambahkan suffix agar nama file pasti unik
    });

    // Return URL penuh dari Vercel Blob
    return {
      success: true,
      url: blob.url,
    };
  } catch (error: any) {
    console.error(`Upload ${subfolder} Error:`, error);
    return { success: false, error: `Gagal upload ke Blob (${subfolder}): ${error.message}` };
  }
}

// Wrapper untuk Profile Image (seperti yang Anda gunakan di user.actions.ts)
export async function uploadImage(file: File, userId: number) {
  return await uploadToPublic(file, "profiles");
}

// 7. API untuk Delete File (diimplementasikan di helper)
export async function deleteFromPublic(fileUrl: string) {
  try {
    if (!fileUrl) return { success: true };
    
    // Fungsi 'del' dari Vercel Blob membutuhkan URL lengkap
    await del(fileUrl);
    
    console.log("Deleted blob:", fileUrl);
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false };
  }
}