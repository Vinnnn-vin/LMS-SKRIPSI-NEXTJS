// lmsistts\src\components\student\MaterialContent.tsx

"use client";

import React from "react";
import { Stack, Title, Box, Paper, Divider, Group, Text } from "@mantine/core";
import { CountdownTimer } from "@/components/student/CountdownTimer";
import { CompleteButton } from "./CompleteButton";
import { YouTubeEmbed } from "./YouTubeEmbed";

interface MaterialContentProps {
  detail: any;
  course: any;
  enrollmentId: number;
  isCompleted: boolean;
  accessExpiresAt?: Date | string | null;
  enrolledAt?: Date | string;
  onComplete: () => void;
}

// ✅ Helper function untuk deteksi YouTube URL
const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');
};

export function MaterialContent({
  detail,
  course,
  enrollmentId,
  isCompleted,
  accessExpiresAt,
  enrolledAt,
  onComplete,
}: MaterialContentProps) {
  console.log("📄 [MaterialContent] ============ RENDER ============");
  console.log("📄 [MaterialContent] Detail object:", detail);
  console.log("📄 [MaterialContent] material_detail_type:", detail?.material_detail_type);
  console.log("📄 [MaterialContent] materi_detail_url:", detail?.materi_detail_url);
  
  // ✅ Deteksi apakah URL adalah YouTube
  const isYouTube = isYouTubeUrl(detail?.materi_detail_url);
  console.log("📄 [MaterialContent] Is YouTube URL?", isYouTube);
  console.log("📄 [MaterialContent] Original type:", detail?.material_detail_type);
  
  return (
    <Stack gap="lg">
      {/* Countdown Timer */}
      {accessExpiresAt && (
        <CountdownTimer expiresAt={accessExpiresAt} type="course" showProgress={true} startedAt={enrolledAt} />
      )}

      {/* Title */}
      <Title order={3}>{detail.material_detail_name}</Title>

      {/* Content Renderer */}
      <Box>
        {/* ✅ FIXED: Prioritas YouTube detection - cek URL dulu sebelum type */}
        {isYouTube && detail.materi_detail_url && (
          <>
            {console.log("🎬 [MaterialContent] Rendering YouTube embed for:", detail.materi_detail_url)}
            <YouTubeEmbed 
              url={detail.materi_detail_url} 
              title={detail.material_detail_name}
            />
          </>
        )}

        {/* Video MP4 - Type 1 (hanya jika bukan YouTube) */}
        {!isYouTube && detail.material_detail_type === 1 && detail.materi_detail_url && (
          <>
            {console.log("🎥 [MaterialContent] Rendering MP4 video for:", detail.materi_detail_url)}
            <video
              controls
              width="100%"
              style={{
                borderRadius: "var(--mantine-radius-md)",
                border: "1px solid var(--mantine-color-gray-3)",
                maxHeight: "70vh",
              }}
            >
              <source src={detail.materi_detail_url} type="video/mp4" />
              Browser Anda tidak mendukung tag video.
            </video>
          </>
        )}

        {/* PDF/Document - Type 2 */}
        {detail.material_detail_type === 2 && detail.materi_detail_url && (
          <>
            {console.log("📄 [MaterialContent] Rendering PDF/Document for:", detail.materi_detail_url)}
            <iframe
              src={detail.materi_detail_url}
              style={{
                width: "100%",
                height: "70vh",
                border: "1px solid var(--mantine-color-gray-3)",
                borderRadius: "var(--mantine-radius-md)",
              }}
              title={detail.material_detail_name}
            />
          </>
        )}

        {/* YouTube Video - Type 3 (legacy support) */}
        {!isYouTube && detail.material_detail_type === 3 && detail.materi_detail_url && (
          <>
            {console.log("🎬 [MaterialContent] Rendering YouTube (type 3) for:", detail.materi_detail_url)}
            <YouTubeEmbed 
              url={detail.materi_detail_url} 
              title={detail.material_detail_name}
            />
          </>
        )}
      </Box>

      {/* Description */}
      {detail.material_detail_description && (
        <Paper p="md" withBorder radius="md" bg="gray.0">
          <Title order={5} mb="xs">
            Deskripsi Materi
          </Title>
          <Text
            size="sm"
            style={{ whiteSpace: "pre-wrap" }}
            dangerouslySetInnerHTML={{
              __html: detail.material_detail_description.replace(/\n/g, "<br />"),
            }}
          />
        </Paper>
      )}

      <Divider />

      {/* Complete Button */}
      <Group justify="flex-end">
        <CompleteButton
          materialDetailId={detail.material_detail_id}
          courseId={course.course_id}
          enrollmentId={enrollmentId}
          isCompleted={isCompleted}
          onComplete={onComplete}
        />
      </Group>
    </Stack>
  );
}