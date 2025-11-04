// lmsistts\src\lib\youtubeUploader.ts

import { google } from 'googleapis';
import { Readable } from 'stream';

const OAuth2 = google.auth.OAuth2;

// Inisialisasi OAuth2 Client
const getOAuth2Client = () => {
  return new OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
};

// Set credentials dari refresh token yang tersimpan
const setCredentials = (oauth2Client: any) => {
  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });
};

/**
 * Upload video ke YouTube
 * @param videoBuffer - Buffer video dari file upload
 * @param title - Judul video
 * @param description - Deskripsi video
 * @param isPublic - Apakah video public atau private
 * @returns YouTube video URL atau error
 */
export async function uploadToYouTube(
  videoBuffer: Buffer,
  title: string,
  description: string = '',
  isPublic: boolean = false
): Promise<{ success: boolean; url?: string; videoId?: string; error?: string }> {
  try {
    const oauth2Client = getOAuth2Client();
    setCredentials(oauth2Client);

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Convert buffer ke readable stream
    const videoStream = Readable.from(videoBuffer);

    const privacyStatus = isPublic ? 'public' : 'private';

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          categoryId: '27',
        },
        status: {
          privacyStatus,
        },
      },
      media: {
        body: videoStream,
      },
    });

    const videoId = response.data.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    console.log('✅ Video uploaded to YouTube:', videoUrl);

    return {
      success: true,
      url: videoUrl,
      videoId: videoId || undefined,
    };
  } catch (error: any) {
    console.error('❌ YouTube upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload video to YouTube',
    };
  }
}

/**
 * Update privacy status video YouTube
 * @param videoId - ID video YouTube
 * @param isPublic - Public atau private
 */
export async function updateVideoPrivacy(
  videoId: string,
  isPublic: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const oauth2Client = getOAuth2Client();
    setCredentials(oauth2Client);

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    await youtube.videos.update({
      part: ['status'],
      requestBody: {
        id: videoId,
        status: {
          privacyStatus: isPublic ? 'public' : 'private',
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('❌ Update privacy error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update video privacy',
    };
  }
}

/**
 * Hapus video dari YouTube
 * @param videoId - ID video YouTube
 */
export async function deleteYouTubeVideo(
  videoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const oauth2Client = getOAuth2Client();
    setCredentials(oauth2Client);

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    await youtube.videos.delete({
      id: videoId,
    });

    return { success: true };
  } catch (error: any) {
    console.error('❌ Delete video error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete video',
    };
  }
}