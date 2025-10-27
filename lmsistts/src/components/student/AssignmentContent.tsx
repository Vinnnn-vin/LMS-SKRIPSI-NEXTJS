"use client";

import React from "react";
import { Stack, Title, Paper, Alert, Button, Group, Divider, Badge } from "@mantine/core";
import { CountdownTimer } from "@/components/student/CountdownTimer";
import { AssignmentSubmissionArea } from "@/components/student/AssignmentSubmissionArea";

export function AssignmentContent({
  detail,
  course,
  enrollmentId,
  existingSubmission,
  submissionHistory,
  accessExpiresAt,
  enrolledAt,
  onSubmit,
}: {
  detail: any;
  course: any;
  enrollmentId: number;
  existingSubmission: any | null;
  submissionHistory?: any[];
  accessExpiresAt?: Date | string | null;
  enrolledAt?: Date | string;
  onSubmit: () => void;
}) {
  const isApproved = existingSubmission?.status === "approved";

  return (
    <Stack gap="lg">
      {accessExpiresAt && <CountdownTimer expiresAt={accessExpiresAt} type="course" showProgress={true} startedAt={enrolledAt} />}

      <Group justify="space-between">
        <Title order={3}>{detail.material_detail_name}</Title>
        {isApproved && <Badge color="green" size="lg">Lulus</Badge>}
      </Group>

      <Paper p="md" withBorder radius="md" bg="gray.0">
        <Title order={5} mb="xs">Instruksi Tugas</Title>
        <div dangerouslySetInnerHTML={{ __html: (detail.material_detail_description || "").replace(/\n/g, "<br />") }} />
      </Paper>

      {detail.passing_score && (
        <Alert color="blue">Nilai Minimum Kelulusan: <strong>{detail.passing_score}</strong></Alert>
      )}

      {detail.assignment_template_url && (
        <Button component="a" href={detail.assignment_template_url} download target="_blank" rel="noopener noreferrer" variant="light">Unduh Template/Lampiran Tugas</Button>
      )}

      <Divider my="md" label="Area Pengumpulan & Status" labelPosition="center" />

      <AssignmentSubmissionArea
        materialDetailId={detail.material_detail_id}
        courseId={course.course_id}
        enrollmentId={enrollmentId}
        existingSubmission={existingSubmission}
        submissionHistory={submissionHistory}
        onSubmit={onSubmit}
      />
    </Stack>
  );
}
