// lmsistts\src\components\student\MaterialContent.tsx
// edit 

"use client";

import React from "react";
import { Stack, Title, Box, Paper, Divider, Group, Text } from "@mantine/core";
import { CountdownTimer } from "@/components/student/CountdownTimer";
import { CompleteButton } from "./CompleteButton";
import { YouTubeEmbed } from "./YouTubeEmbed";

import { SecurePdfViewer } from "./SecurePdfViewer";
import { useSession } from "next-auth/react";

interface MaterialContentProps {
  detail: any;
  course: any;
  enrollmentId: number;
  isCompleted: boolean;
  accessExpiresAt?: Date | string | null;
  enrolledAt?: Date | string;
  onComplete: () => void;
}

const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be");
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

  const { data: session } = useSession();
  const isYouTube = isYouTubeUrl(detail?.materi_detail_url);

  return (
    <Stack gap="lg">
      {accessExpiresAt && (
        <CountdownTimer
          expiresAt={accessExpiresAt}
          type="course"
          showProgress={true}
          startedAt={enrolledAt}
        />
      )}

      <Title order={3}>{detail.material_detail_name}</Title>

      <Box>
        {isYouTube && detail.materi_detail_url && (
          <>
            <YouTubeEmbed
              url={detail.materi_detail_url}
              title={detail.material_detail_name}
            />
          </>
        )}

        {!isYouTube &&
          detail.material_detail_type === 1 &&
          detail.materi_detail_url && (
            <>
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

        {detail.material_detail_type === 2 && detail.materi_detail_url && (
          <>
            {console.log(
              "📄 [MaterialContent] Rendering PDF/Document for:",
              detail.materi_detail_url
            )}
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
        {!isYouTube &&
          detail.material_detail_type === 3 &&
          detail.materi_detail_url && (
            <>
              {console.log(
                "🎬 [MaterialContent] Rendering YouTube (type 3) for:",
                detail.materi_detail_url
              )}
              <YouTubeEmbed
                url={detail.materi_detail_url}
                title={detail.material_detail_name}
              />
            </>
          )}
      </Box>

      {detail.material_detail_description && (
        <Paper p="md" withBorder radius="md" bg="gray.0">
          <Title order={5} mb="xs">
            Deskripsi Materi
          </Title>
          <Text
            size="sm"
            style={{ whiteSpace: "pre-wrap" }}
            dangerouslySetInnerHTML={{
              __html: detail.material_detail_description.replace(
                /\n/g,
                "<br />"
              ),
            }}
          />
        </Paper>
      )}

      <Divider />

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
