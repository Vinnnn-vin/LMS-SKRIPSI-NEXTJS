// lmsistts\src\app\api\upload\youtube\route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Readable } from "stream";

// Pastikan env var ada
if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !process.env.YOUTUBE_REFRESH_TOKEN) {
  console.error("❌ MISSING YOUTUBE ENV VARS");
}

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// Set refresh token di luar handler agar tidak di-set berulang kali jika instance masih hidup
oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    // 1. Cek Session
    const session = await getServerSession(authOptions);
    // Sesuaikan role jika perlu
    if (!session?.user || session.user.role !== "lecturer") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. [DEBUG] Cek apakah Refresh Token Valid SEBELUM proses file
    try {
      const { token } = await oauth2Client.getAccessToken();
      if (!token) throw new Error("Gagal generate Access Token baru. Refresh token mungkin expired.");
      console.log("✅ OAuth Token refreshed successfully.");
    } catch (tokenError: any) {
      console.error("❌ OAuth Token Error:", tokenError.message);
      return NextResponse.json(
        { 
          success: false, 
          error: "Izin YouTube Kadaluwarsa. Mohon generate Refresh Token baru.",
          details: tokenError.message 
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const isFree = formData.get("isFree") === "true";

    if (!file) {
      return NextResponse.json({ success: false, error: "File video tidak ditemukan" }, { status: 400 });
    }

    // 3. Batasan Vercel (PENTING)
    // Vercel Serverless Function punya batas memory & timeout.
    // Jika file > 4.5MB (batasan body parser Vercel/Next.js default) atau > 50MB (limit lambda), ini akan gagal.
    // Untuk skripsi, gunakan video pendek/kecil untuk tes.
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = Readable.from(buffer);

    console.log("📤 Uploading video to YouTube:", {
      filename: file.name,
      size: file.size,
      title,
    });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: title || file.name,
          description: description || "Video pembelajaran dari LMS ISTTS",
          categoryId: "27", // Education
        },
        status: {
          privacyStatus: isFree ? "public" : "unlisted",
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: stream,
        mimeType: file.type,
      },
    });

    console.log("✅ Video uploaded successfully:", response.data.id);

    return NextResponse.json({
      success: true,
      url: `https://www.youtube.com/watch?v=${response.data.id}`,
      videoId: response.data.id,
      embedUrl: `https://www.youtube.com/embed/${response.data.id}`,
    });

  } catch (error: any) {
    console.error("❌ YouTube upload error FULL:", error);

    // Tangani error spesifik Google
    const status = error.code || 500;
    const message = error.message || "Upload gagal";

    return NextResponse.json(
      { success: false, error: message },
      { status: status }
    );
  }
}

// ... (GET handler tetap sama)
export async function GET(request: NextRequest) {
  // ... kode GET Anda yang lama sudah oke ...
  // Pastikan Anda menggunakan kode ini untuk generate token baru
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      return NextResponse.json({
        success: true,
        refreshToken: tokens.refresh_token,
        message: "✅ Copy token ini ke env var YOUTUBE_REFRESH_TOKEN",
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // PENTING: Agar dapat refresh token
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    prompt: "consent", // PENTING: Paksa user setuju lagi agar dapat refresh token baru
  });

  return NextResponse.json({ authUrl });
}