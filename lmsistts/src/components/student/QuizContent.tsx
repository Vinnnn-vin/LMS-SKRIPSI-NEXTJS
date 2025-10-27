"use client";

import React from "react";
import { Stack, Title, Group, Badge, Paper, Card, List, ThemeIcon, Alert, Button } from "@mantine/core";
import { CountdownTimer } from "@/components/student/CountdownTimer";
import { ActiveQuizPlayer } from "@/components/student/ActiveQuizPlayer";

export function QuizContent({
  quiz,
  course,
  enrollmentId,
  currentQuizAttempts,
  completedQuizzes,
  onStartQuiz,
  isQuizActive,
  onFinish,
  accessExpiresAt,
  enrolledAt,
  latestQuizAttempt,
}: {
  quiz: any;
  course: any;
  enrollmentId: number;
  currentQuizAttempts: any[];
  completedQuizzes: Set<number>;
  onStartQuiz: () => void;
  isQuizActive: boolean;
  onFinish: (result: any) => void;
  accessExpiresAt?: Date | string | null;
  enrolledAt?: Date | string;
  latestQuizAttempt?: any | null;
}) {
  const maxAttempts = quiz.max_attempts || 1;
  const uniqueAttempts = new Set(currentQuizAttempts.map((a: any) => a.attempt_session));
  const attemptsMade = uniqueAttempts.size;
  const isPassed = completedQuizzes.has(quiz.quiz_id);
  const canRetry = attemptsMade < maxAttempts && !isPassed;

  if (isQuizActive) {
    return (
      <Stack gap="lg">
        {accessExpiresAt && <CountdownTimer expiresAt={accessExpiresAt} type="course" showProgress={false} startedAt={enrolledAt} />}
        <ActiveQuizPlayer quizData={quiz} courseId={course.course_id} enrollmentId={enrollmentId} attemptNumber={attemptsMade + 1} onFinish={onFinish} />
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {accessExpiresAt && <CountdownTimer expiresAt={accessExpiresAt} type="course" showProgress={true} startedAt={enrolledAt} />}

      <Group justify="space-between">
        <Title order={3}>{quiz.quiz_title}</Title>
        {isPassed && <Badge color="green" size="lg">Lulus</Badge>}
      </Group>

      {quiz.quiz_description && (
        <Paper p="md" withBorder radius="md" bg="gray.0">
          <Title order={5} mb="xs">Deskripsi Quiz</Title>
          <div>{quiz.quiz_description}</div>
        </Paper>
      )}

      <Card withBorder padding="lg" radius="md">
        <Title order={5} mb="md">Peraturan Quiz</Title>
        <List spacing="sm" size="sm" icon={<ThemeIcon size={20} radius="xl" color="blue"><span /></ThemeIcon>}>
          <List.Item>Jumlah Pertanyaan: <strong>{quiz.questions?.length || 0} Soal</strong></List.Item>
          <List.Item>Skor Kelulusan Minimum: <strong>{quiz.passing_score}%</strong></List.Item>
          <List.Item>Batas Waktu Pengerjaan: <strong>{quiz.time_limit} Menit</strong></List.Item>
          <List.Item>Maksimal Percobaan: <strong>{maxAttempts} kali</strong></List.Item>
          <List.Item>Percobaan Tersisa: <strong>{Math.max(0, maxAttempts - attemptsMade)} kali</strong></List.Item>
        </List>
      </Card>

      {latestQuizAttempt && (
        <Alert color={latestQuizAttempt.status === "passed" ? "green" : "red"}>
          <div>Skor Anda: <strong>{latestQuizAttempt.score}%</strong></div>
          <div>Skor Kelulusan: <strong>{quiz.passing_score}%</strong></div>
          <div>Selesai pada: {new Date(latestQuizAttempt.completed_at).toLocaleString("id-ID")}</div>
        </Alert>
      )}

      <Group justify="center" mt="md">
        <Button size="lg" onClick={onStartQuiz} disabled={!canRetry}>
          {isPassed ? "Quiz Sudah Lulus" : attemptsMade > 0 && canRetry ? `Ulangi Quiz (${attemptsMade}/${maxAttempts})` : attemptsMade >= maxAttempts ? "Batas Percobaan Habis" : "Mulai Quiz"}
        </Button>
      </Group>

      {!canRetry && !isPassed && attemptsMade >= maxAttempts && (
        <Alert color="orange">Anda telah mencapai batas maksimal percobaan untuk quiz ini. Silakan hubungi dosen jika ingin mendapat kesempatan tambahan.</Alert>
      )}
    </Stack>
  );
}
