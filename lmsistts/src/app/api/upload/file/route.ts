// lmsistts\src\app\api\upload\file\route.ts

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Generate unique filename to avoid conflicts
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  
  // Sanitize filename (remove special chars)
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return `${sanitized}_${timestamp}_${randomString}${ext}`;
}

// Ensure upload directory exists
async function ensureUploadDirectory(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Verify user has valid role
    const userRole = session.user.role;
    if (!userRole || !['lecturer', 'student'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user role' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string; // 'pdfs' or 'assignments'

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!fileType || !['pdfs', 'assignments'].includes(fileType)) {
      return NextResponse.json(
        { success: false, error: "Invalid fileType. Must be 'pdfs' or 'assignments'" },
        { status: 400 }
      );
    }

    // Role-based restrictions for pdfs
    if (fileType === 'pdfs' && userRole !== 'lecturer') {
      return NextResponse.json(
        { success: false, error: "Only lecturers can upload PDF materials" },
        { status: 403 }
      );
    }

    // Validate file type based on category
    if (fileType === 'pdfs' && !file.type.includes('pdf')) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are allowed for pdfs type" },
        { status: 400 }
      );
    }

    if (fileType === 'assignments') {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-zip-compressed'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: "Only PDF, DOC, DOCX, or ZIP files are allowed for assignments" },
          { status: 400 }
        );
      }
    }

    // File size limit (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File size exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)` },
        { status: 400 }
      );
    }

    console.log('📤 Uploading file:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      category: fileType,
      role: userRole
    });

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);

    // Setup path based on role and file type
    let uploadDir: string;
    let publicUrl: string;

    if (fileType === 'assignments') {
      // For assignments, separate by role
      uploadDir = path.join(process.cwd(), "public", "uploads", "assignment", userRole);
      publicUrl = `/uploads/assignment/${userRole}/${uniqueFilename}`;
    } else {
      // For pdfs (only lecturers can upload)
      uploadDir = path.join(process.cwd(), "public", "uploads", fileType);
      publicUrl = `/uploads/${fileType}/${uniqueFilename}`;
    }

    const filePath = path.join(uploadDir, uniqueFilename);

    // Ensure directory exists (create if not exists)
    await ensureUploadDirectory(uploadDir);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log('✅ File uploaded successfully:', {
      path: publicUrl,
      role: userRole
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedBy: userRole
    });

  } catch (error: any) {
    console.error('❌ File upload error:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}