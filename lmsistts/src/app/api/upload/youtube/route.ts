// lmsistts\src\app\api\upload\youtube\route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Readable } from "stream";

// Setup OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI // http://127.0.0.1:3000/api/upload/youtube
);

// Set refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
});

// POST: Upload video ke YouTube
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "lecturer") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const isFree = formData.get("isFree") === "true";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File video tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "File harus berupa video" },
        { status: 400 }
      );
    }

    // Convert file to buffer dan stream
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = Readable.from(buffer);

    console.log("📤 Uploading video to YouTube:", {
      filename: file.name,
      size: file.size,
      type: file.type,
      title,
      isFree,
    });

    // Initialize YouTube API
    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    // Upload video
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
          embeddable: true,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: stream,
        mimeType: file.type,
      },
    });

    const videoId = response.data.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    console.log("✅ Video uploaded successfully:", videoUrl);

    return NextResponse.json({
      success: true,
      url: videoUrl,
      videoId: videoId,
      embedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
  } catch (error: any) {
    console.error("❌ YouTube upload error:", error);

    if (error.code === 403) {
      if (error.message?.includes("quota")) {
        return NextResponse.json(
          {
            success: false,
            error: "Kuota upload YouTube habis. Coba lagi besok.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Periksa OAuth credentials." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Upload ke YouTube gagal" },
      { status: 500 }
    );
  }
}

// GET: Setup OAuth (untuk mendapatkan refresh token)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Step 2: Exchange code untuk tokens
  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken(code);

      return NextResponse.json({
        success: true,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        message:
          "✅ SIMPAN refresh_token ini ke .env.local sebagai YOUTUBE_REFRESH_TOKEN",
      });
    } catch (error: any) {
      console.error("Token exchange error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  }

  // Step 1: Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ],
    prompt: "consent",
  });

  return NextResponse.json({
    success: true,
    authUrl,
    message:
      "1. Klik authUrl di bawah\n2. Login dengan account yang digunakan untuk channel\n3. Authorize\n4. Anda akan di-redirect kembali ke sini dengan code\n5. Refresh token akan muncul otomatis",
  });
}
