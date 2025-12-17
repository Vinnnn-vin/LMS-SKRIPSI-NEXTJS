// lmsistts\src\app\api\upload\youtube\route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Readable } from "stream";
import { access } from "fs";

// ✅ CRITICAL: Configure route for large file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for video upload

// ✅ CRITICAL: Increase body size limit for video uploads
export const config = {
  api: {
    bodyParser: false, // Disable default body parser for large files
    responseLimit: false,
  },
};

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// Set refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "lecturer") {
      console.log("❌ Unauthorized access attempt");
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const isFree = formData.get("isFree") === "true";

    const { token } = await oauth2Client.getAccessToken();

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Video file not found" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "File must be a video" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = Readable.from(buffer);

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: title || file.name,
          description: description || "Educational video from LMS ISTTS",
          categoryId: "27",
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

    return NextResponse.json({
      success: true,
      url: videoUrl,
      videoId: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      accessToken: token,
    });
  } catch (error: any) {
    console.error("❌ YouTube upload error:", error);

    if (error.code === 403) {
      if (error.message?.includes("quota")) {
        return NextResponse.json(
          {
            success: false,
            error: "YouTube upload quota exceeded. Please try again tomorrow.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { 
          success: false, 
          error: "Access denied. Please check your OAuth credentials." 
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to upload to YouTube" 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // Handle OAuth error
  if (error) {
    return NextResponse.json({
      success: false,
      error: `OAuth error: ${error}`,
      message: "Authorization was denied or failed",
    }, { status: 400 });
  }

  // Exchange code for token
  if (code) {
    try {
      console.log("🔄 Exchanging code for tokens...");
      
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log("✅ Tokens received:", {
        hasRefreshToken: !!tokens.refresh_token,
        hasAccessToken: !!tokens.access_token,
      });

      if (!tokens.refresh_token) {
        return NextResponse.json({
          success: false,
          error: "No refresh token received",
          message: "This can happen if you've already authorized before. Try revoking access first at: https://myaccount.google.com/permissions",
          accessToken: tokens.access_token,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiryDate: tokens.expiry_date,
        message:
          "✅ SUCCESS! Copy the refreshToken below and add it to your Vercel Environment Variables:\n" +
          "1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables\n" +
          "2. Add/Update: YOUTUBE_REFRESH_TOKEN = [paste the refreshToken]\n" +
          "3. Scope: Production, Preview, Development\n" +
          "4. Redeploy your app",
      });
    } catch (error: any) {
      console.error("❌ Token exchange error:", error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || "Token exchange failed",
          code: error.code,
          details: "Possible causes:\n" +
            "1. Authorization code expired (codes expire in ~10 minutes)\n" +
            "2. Authorization code already used\n" +
            "3. Redirect URI mismatch\n" +
            "4. Client ID/Secret incorrect\n" +
            "\nSolution: Click the authUrl again to get a new code",
        },
        { status: 500 }
      );
    }
  }

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ],
    prompt: "consent", // Force to show consent screen to get refresh token
  });

  return NextResponse.json({
    success: true,
    authUrl,
    redirectUri: process.env.YOUTUBE_REDIRECT_URI,
    message:
      "📋 Steps to get your YouTube Refresh Token:\n\n" +
      "1. Click the 'authUrl' link below\n" +
      "2. Login with your YouTube channel Google account\n" +
      "3. Click 'Allow' to authorize the app\n" +
      "4. You will be redirected back here automatically\n" +
      "5. Copy the 'refreshToken' from the response\n" +
      "6. Add it to Vercel Environment Variables as YOUTUBE_REFRESH_TOKEN\n\n" +
      "⚠️ IMPORTANT: The authorization code expires in 10 minutes, so complete the process quickly!",
  });
}