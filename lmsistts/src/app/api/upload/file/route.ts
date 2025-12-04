// lmsistts\src\app\api\upload\file\route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { put } from "@vercel/blob"; // Gunakan Blob, bukan fs

// Helper sanitasi nama file sederhana (inline agar tidak perlu import helper lain)
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export async function POST(req: Request) {
  try {
    // 1. Cek Session / Login
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    if (!userRole || !["lecturer", "student", "admin"].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: "Invalid user role" },
        { status: 403 }
      );
    }

    // 2. Ambil Data Form
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string; // 'pdfs' atau 'assignments'

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // 3. Validasi Tipe Upload
    if (!fileType || !["pdfs", "assignments"].includes(fileType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid fileType. Must be 'pdfs' or 'assignments'",
        },
        { status: 400 }
      );
    }

    // Validasi Role Khusus PDF
    if (fileType === "pdfs" && userRole !== "lecturer") {
      return NextResponse.json(
        { success: false, error: "Only lecturers can upload PDF materials" },
        { status: 403 }
      );
    }

    // Validasi Ekstensi PDF
    if (fileType === "pdfs" && !file.type.includes("pdf")) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are allowed for pdfs type" },
        { status: 400 }
      );
    }

    // Validasi Ekstensi Assignment
    if (fileType === "assignments") {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
        "application/zip",
        "application/x-zip-compressed",
        "image/jpeg", // Tambahan opsional jika tugas boleh gambar
        "image/png",
      ];

      // Cek MIME type (bisa diperlonggar jika perlu)
      // if (!allowedTypes.includes(file.type)) { ... }
    }

    // 4. Validasi Ukuran (Max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        },
        { status: 400 }
      );
    }

    console.log("📤 Uploading via API Route to Blob:", {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      category: fileType,
      role: userRole,
    });

    // 5. Generate Path untuk Blob
    // Format: folder/role_timestamp_filename
    const timestamp = Date.now();
    const sanitizedName = sanitizeFilename(file.name);
    let blobPath = "";

    if (fileType === "assignments") {
      // Struktur: assignments/student/12345_tugas.pdf
      blobPath = `assignments/${userRole}/${timestamp}_${sanitizedName}`;
    } else {
      // Struktur: pdfs/12345_materi.pdf
      blobPath = `${fileType}/${timestamp}_${sanitizedName}`;
    }

    // 6. UPLOAD KE VERCEL BLOB
    const blob = await put(blobPath, file, {
      access: "public",
    });

    console.log("✅ File uploaded successfully to Blob:", {
      url: blob.url,
      role: userRole,
    });

    // 7. Return Response JSON (Format disesuaikan agar frontend tidak error)
    return NextResponse.json({
      success: true,
      url: blob.url, // URL Publik dari Blob (https://...)
      filename: sanitizedName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedBy: userRole,
    });

  } catch (error: any) {
    console.error("❌ API File upload error:", error);

    return NextResponse.json(
      { success: false, error: error.message || "File upload failed" },
      { status: 500 }
    );
  }
}