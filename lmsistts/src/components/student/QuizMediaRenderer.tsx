"use client";

import { Image, Box } from "@mantine/core";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { SecurePdfViewer } from "./SecurePdfViewer";
import { SecureVideoPlayer } from "./SecureVideoPlayer";

interface QuizMediaRendererProps {
  mediaType: "none" | "image" | "video" | "pdf";
  mediaUrl: string | null;
  userName?: string; // Untuk watermark PDF
}

export function QuizMediaRenderer({
  mediaType,
  mediaUrl,
  userName,
}: QuizMediaRendererProps) {
  if (!mediaUrl || mediaType === "none" || !mediaType) return null;

  return (
    <Box mb="md" mt="xs">
      {/* TIPE GAMBAR */}
      {mediaType === "image" && (
        <Image
          src={mediaUrl}
          radius="md"
          alt="Soal Gambar"
          fit="contain"
          style={{ maxHeight: "400px", border: "1px solid #eee" }}
        />
      )}

      {/* TIPE VIDEO (YOUTUBE) */}
      {mediaType === "video" && (
        <SecureVideoPlayer url={mediaUrl} title="Video Soal" />
      )}

      {/* TIPE PDF (Gunakan Viewer Aman yg baru dibuat) */}
      {mediaType === "pdf" && (
        <div
          style={{
            height: "500px",
            overflow: "hidden",
            border: "1px solid #eee",
          }}
        >
          <SecurePdfViewer
            fileUrl={mediaUrl}
            userName={userName || "Student"}
          />
        </div>
      )}
    </Box>
  );
}
