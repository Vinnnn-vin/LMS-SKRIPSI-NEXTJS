"use client";

import React from "react";
import { Stack, Title, Box, Paper, Divider, Group } from "@mantine/core";
import { CountdownTimer } from "@/components/student/CountdownTimer";
import { CompleteButton } from "./CompleteButton";

export function MaterialContent({
  detail,
  course,
  enrollmentId,
  isCompleted,
  accessExpiresAt,
  enrolledAt,
  onComplete,
}: {
  detail: any;
  course: any;
  enrollmentId: number;
  isCompleted: boolean;
  accessExpiresAt?: Date | string | null;
  enrolledAt?: Date | string;
  onComplete: () => void;
}) {
  return (
    <Stack gap="lg">
      {accessExpiresAt && (
        <CountdownTimer expiresAt={accessExpiresAt} type="course" showProgress={true} startedAt={enrolledAt} />
      )}

      <Title order={3}>{detail.material_detail_name}</Title>

      <Box>
        {detail.material_detail_type === 1 && detail.materi_detail_url && (
          <video controls width="100%" style={{ borderRadius: "var(--mantine-radius-md)", border: "1px solid var(--mantine-color-gray-3)", maxHeight: "70vh" }}>
            <source src={detail.materi_detail_url} type="video/mp4" />
            Browser Anda tidak mendukung tag video.
          </video>
        )}

        {detail.material_detail_type === 2 && detail.materi_detail_url && (
          <iframe src={detail.materi_detail_url} style={{ width: "100%", height: "70vh", border: "1px solid var(--mantine-color-gray-3)", borderRadius: "var(--mantine-radius-md)" }} title={detail.material_detail_name} />
        )}

        {detail.material_detail_type === 3 && detail.materi_detail_url && (
          <Box style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "var(--mantine-radius-md)" }}>
            <iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} src={detail.materi_detail_url} title={detail.material_detail_name} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </Box>
        )}
      </Box>

      {detail.material_detail_description && (
        <Paper p="md" withBorder radius="md" bg="gray.0">
          <Title order={5} mb="xs">Deskripsi Materi</Title>
          <div dangerouslySetInnerHTML={{ __html: detail.material_detail_description.replace(/\n/g, "<br />") }} />
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
