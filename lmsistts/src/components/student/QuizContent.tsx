// lmsistts\src\components\student\QuizContent.tsx (RESPONSIVE VERSION)

"use client";

import React, { useState } from "react";
import {
  Stack,
  Title,
  Group,
  Badge,
  Paper,
  Card,
  List,
  ThemeIcon,
  Alert,
  Button,
  Text,
  Box,
  Progress,
  Timeline,
  Divider,
  RingProgress,
  Center,
  TimelineItem,
  SimpleGrid,
} from "@mantine/core";
import {
  IconTrophy,
  IconInfoCircle,
  IconCheck,
  IconAlertCircle,
  IconX,
  IconPlayerPlay,
  IconRefresh,
  IconClock,
  IconTarget,
  IconChartBar,
  IconEye,
} from "@tabler/icons-react";
import { CountdownTimer } from "@/components/student/CountdownTimer";
import { ActiveQuizPlayer } from "@/components/student/ActiveQuizPlayer";
import { QuizReviewModal } from "@/components/student/QuizReviewModal";

interface QuizContentProps {
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
}

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
}: QuizContentProps) {
  const [reviewModalOpened, setReviewModalOpened] = useState(false);
  const [reviewData, setReviewData] = useState<{
    quizData: any;
    studentAnswers: Record<number, number | number[]>;
    score: number;
  } | null>(null);

  const maxAttempts = quiz.max_attempts || 1;
  const uniqueAttempts = new Set(
    currentQuizAttempts.map((a: any) => a.attempt_session)
  );
  const attemptsMade = uniqueAttempts.size;
  const isPassed = completedQuizzes.has(quiz.quiz_id);
  const canRetry = attemptsMade < maxAttempts && !isPassed;
  const attemptsRemaining = Math.max(0, maxAttempts - attemptsMade);

  const handleReviewAttempt = async (attempt: any) => {
    try {
      const { getQuizAttemptDetails } = await import(
        "@/app/actions/student.actions"
      );

      const result = await getQuizAttemptDetails(
        quiz.quiz_id,
        attempt.attempt_session
      );

      if (result.success && result.data) {
        setReviewData({
          quizData: quiz,
          studentAnswers: result.data.studentAnswers,
          score: result.data.score,
        });
        setReviewModalOpened(true);
      } else {
        const { notifications } = await import("@mantine/notifications");
        notifications.show({
          title: "Error",
          message: result.error || "Gagal memuat detail jawaban",
          color: "red",
        });
      }
    } catch (error: any) {
      console.error("Error loading quiz review:", error);
    }
  };

  if (isQuizActive) {
    return (
      <Stack gap="lg">
        {accessExpiresAt && (
          <CountdownTimer
            expiresAt={accessExpiresAt}
            type="course"
            showProgress={false}
            startedAt={enrolledAt}
          />
        )}
        <ActiveQuizPlayer
          quizData={quiz}
          courseId={course.course_id}
          enrollmentId={enrollmentId}
          attemptNumber={attemptsMade + 1}
          onFinish={onFinish}
        />
      </Stack>
    );
  }

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

      {/* Header - Responsive */}
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="wrap-reverse">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Title 
              order={3}
              mb="xs"
              style={{
                fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
              }}
            >
              {quiz.quiz_title}
            </Title>
            {quiz.quiz_description && (
              <Text size="sm" c="dimmed" lineClamp={2}>
                {quiz.quiz_description}
              </Text>
            )}
          </Box>
          {isPassed && (
            <Badge
              size="xl"
              leftSection={<IconTrophy size={18} />}
              variant="gradient"
              gradient={{ from: "teal", to: "green", deg: 45 }}
            >
              LULUS
            </Badge>
          )}
        </Group>
      </Stack>

      {/* Latest Attempt Card - Responsive */}
      {latestQuizAttempt && (
        <Card
          withBorder
          p="lg"
          radius="md"
          style={{
            background:
              latestQuizAttempt.status === "passed"
                ? "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)"
                : "linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)",
          }}
        >
          <Stack gap="md">
            {/* Header with Ring Progress - Responsive Stack on Mobile */}
            <Stack gap="md">
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <Group gap="md">
                  <ThemeIcon
                    size={60}
                    radius="xl"
                    color={
                      latestQuizAttempt.status === "passed" ? "green" : "red"
                    }
                    variant="light"
                    visibleFrom="sm"
                  >
                    <IconCheck size={32} />
                  </ThemeIcon>
                  <ThemeIcon
                    size={50}
                    radius="xl"
                    color={
                      latestQuizAttempt.status === "passed" ? "green" : "red"
                    }
                    variant="light"
                    hiddenFrom="sm"
                  >
                    {latestQuizAttempt.status === "passed" ? (
                      <IconCheck size={24} />
                    ) : (
                      <IconX size={24} />
                    )}
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Percobaan ke-{latestQuizAttempt.attempt_session}
                    </Text>
                    <Title 
                      order={4}
                      mt={4}
                      style={{
                        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                      }}
                    >
                      {latestQuizAttempt.status === "passed"
                        ? "Quiz Lulus!"
                        : "Belum Lulus"}
                    </Title>
                  </Box>
                </Group>

                <RingProgress
                  size={100}
                  thickness={10}
                  sections={[
                    {
                      value: latestQuizAttempt.score,
                      color:
                        latestQuizAttempt.status === "passed" ? "green" : "red",
                    },
                  ]}
                  label={
                    <Center>
                      <Stack gap={0} align="center">
                        <Text size="xl" fw={700}>
                          {latestQuizAttempt.score}%
                        </Text>
                        <Text size="xs" c="dimmed">
                          Skor
                        </Text>
                      </Stack>
                    </Center>
                  }
                  visibleFrom="xs"
                />
              </Group>
            </Stack>

            <Divider />

            {/* Stats Grid - Responsive */}
            <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm">
              <Paper withBorder p="sm" radius="md" bg="white">
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon size="sm" color="blue" variant="light">
                    <IconTarget size={14} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">
                      Skor Anda
                    </Text>
                    <Text 
                      fw={700}
                      style={{
                        fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                      }}
                    >
                      {latestQuizAttempt.score}%
                    </Text>
                  </Box>
                </Group>
              </Paper>

              <Paper withBorder p="sm" radius="md" bg="white">
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon size="sm" color="orange" variant="light">
                    <IconChartBar size={14} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">
                      Minimum
                    </Text>
                    <Text 
                      fw={700}
                      style={{
                        fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                      }}
                    >
                      {quiz.passing_score}%
                    </Text>
                  </Box>
                </Group>
              </Paper>

              <Paper withBorder p="sm" radius="md" bg="white">
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon size="sm" color="grape" variant="light">
                    <IconClock size={14} />
                  </ThemeIcon>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" c="dimmed">
                      Selesai
                    </Text>
                    <Text size="sm" fw={500} lineClamp={1}>
                      {new Date(
                        latestQuizAttempt.completed_at
                      ).toLocaleDateString("id-ID")}
                    </Text>
                  </Box>
                </Group>
              </Paper>
            </SimpleGrid>

            <Alert
              color={latestQuizAttempt.status === "passed" ? "green" : "red"}
              variant="light"
              icon={
                latestQuizAttempt.status === "passed" ? (
                  <IconCheck />
                ) : (
                  <IconAlertCircle />
                )
              }
            >
              <Text size="sm" fw={500}>
                {latestQuizAttempt.status === "passed" ? (
                  <>✓ Selamat! Anda telah lulus quiz ini dengan skor{" "}
                  {latestQuizAttempt.score}%</>
                ) : (
                  <>✗ Skor belum mencapai nilai minimum ({quiz.passing_score}%).
                  {canRetry &&
                    ` Anda masih memiliki ${attemptsRemaining} kesempatan lagi.`}</>
                )}
              </Text>
            </Alert>

            <Group justify="center">
              <Button
                variant="light"
                leftSection={<IconEye size={16} />}
                onClick={() => handleReviewAttempt(latestQuizAttempt)}
                w={{ base: '100%', xs: 'auto' }}
              >
                Lihat Review Jawaban
              </Button>
            </Group>
          </Stack>
        </Card>
      )}

      {/* Quiz Rules Card - Responsive */}
      <Card withBorder p="lg" radius="md" shadow="sm">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Title order={5}>Peraturan Quiz</Title>
          <Badge
            size="lg"
            color={attemptsRemaining > 0 ? "blue" : "orange"}
            variant="light"
            leftSection={<IconInfoCircle size={14} />}
          >
            {attemptsRemaining} Percobaan Tersisa
          </Badge>
        </Group>

        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon size={20} radius="xl" color="blue" variant="light">
                <IconCheck size={12} />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Text size="sm">Jumlah Pertanyaan:</Text>
                <Badge variant="light" mt={4}>{quiz.questions?.length || 0} Soal</Badge>
              </Box>
            </Group>
            
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon size={20} radius="xl" color="green" variant="light">
                <IconCheck size={12} />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Text size="sm">Skor Kelulusan:</Text>
                <Badge color="green" variant="light" mt={4}>
                  {quiz.passing_score}%
                </Badge>
              </Box>
            </Group>

            <Group gap="xs" wrap="nowrap">
              <ThemeIcon size={20} radius="xl" color="orange" variant="light">
                <IconCheck size={12} />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Text size="sm">Batas Waktu:</Text>
                <Badge color="orange" variant="light" mt={4}>
                  {quiz.time_limit} Menit
                </Badge>
              </Box>
            </Group>

            <Group gap="xs" wrap="nowrap">
              <ThemeIcon size={20} radius="xl" color="grape" variant="light">
                <IconCheck size={12} />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Text size="sm">Maksimal Percobaan:</Text>
                <Badge color="grape" variant="light" mt={4}>
                  {maxAttempts} kali
                </Badge>
              </Box>
            </Group>
          </SimpleGrid>
        </Stack>
      </Card>

      {/* Attempt History - Responsive */}
      {currentQuizAttempts.length > 0 && (
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="md" wrap="wrap">
            <Title order={5}>Riwayat Percobaan</Title>
            <Badge variant="light" color="gray">
              {attemptsMade} dari {maxAttempts}
            </Badge>
          </Group>

          <Progress
            value={(attemptsMade / maxAttempts) * 100}
            size="sm"
            radius="xl"
            mb="lg"
            color={attemptsMade >= maxAttempts ? "red" : "blue"}
          />

          <Timeline
            active={currentQuizAttempts.length}
            bulletSize={24}
            lineWidth={2}
          >
            {[...currentQuizAttempts]
              .filter(
                (attempt: any, index: number, self: any[]) =>
                  index ===
                  self.findIndex(
                    (a: any) => a.attempt_session === attempt.attempt_session
                  )
              )
              .sort((a: any, b: any) => b.attempt_session - a.attempt_session)
              .map((attempt: any, index: number) => (
                <TimelineItem
                  key={`${attempt.quiz_id}-${attempt.attempt_session}-${index}`}
                  bullet={
                    attempt.status === "passed" ? (
                      <IconCheck size={14} />
                    ) : (
                      <IconX size={14} />
                    )
                  }
                  title={
                    <Stack gap="xs">
                      <Group gap="sm" wrap="wrap">
                        <Text fw={500} size="sm">
                          Percobaan ke-{attempt.attempt_session}
                        </Text>
                        <Badge
                          color={attempt.status === "passed" ? "green" : "red"}
                          variant="filled"
                          size="lg"
                        >
                          {attempt.score}%
                        </Badge>
                        {attempt.status === "passed" && (
                          <Badge
                            color="green"
                            variant="light"
                            leftSection={<IconTrophy size={12} />}
                          >
                            LULUS
                          </Badge>
                        )}
                      </Group>
                    </Stack>
                  }
                  color={attempt.status === "passed" ? "green" : "red"}
                >
                  <Text size="xs" c="dimmed" mt={4}>
                    {new Date(attempt.completed_at).toLocaleString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Group gap="xs" mt="xs" wrap="wrap">
                    <Badge
                      size="xs"
                      variant="light"
                      color={
                        attempt.score >= quiz.passing_score ? "green" : "red"
                      }
                    >
                      {attempt.score >= quiz.passing_score
                        ? "Di atas minimum"
                        : "Di bawah minimum"}
                    </Badge>
                    <Button
                      size="xs"
                      variant="subtle"
                      leftSection={<IconEye size={12} />}
                      onClick={() => handleReviewAttempt(attempt)}
                    >
                      Review
                    </Button>
                  </Group>
                </TimelineItem>
              ))}
          </Timeline>
        </Card>
      )}

      {/* Start Button - Responsive */}
      <Stack align="center" mt="xl">
        <Box w={{ base: '100%', xs: 'auto' }} maw={400}>
          <Button
            size="xl"
            onClick={onStartQuiz}
            disabled={!canRetry}
            leftSection={
              attemptsMade > 0 && canRetry ? (
                <IconRefresh size={20} />
              ) : (
                <IconPlayerPlay size={20} />
              )
            }
            variant="gradient"
            gradient={
              isPassed
                ? { from: "teal", to: "green", deg: 45 }
                : canRetry
                  ? { from: "blue", to: "cyan", deg: 45 }
                  : { from: "gray", to: "gray", deg: 45 }
            }
            fullWidth
            h={60}
          >
            <Text 
              fw={600}
              style={{
                fontSize: 'clamp(0.9rem, 2vw, 1.125rem)',
              }}
            >
              {isPassed
                ? "✓ Quiz Sudah Lulus"
                : attemptsMade > 0 && canRetry
                  ? `🔄 Ulangi Quiz (${attemptsMade}/${maxAttempts})`
                  : attemptsMade >= maxAttempts
                    ? "🚫 Batas Percobaan Habis"
                    : "▶️ Mulai Quiz Sekarang"}
            </Text>
          </Button>
        </Box>
      </Stack>

      {/* Alerts - Responsive */}
      {!canRetry && !isPassed && attemptsMade >= maxAttempts && (
        <Alert
          color="orange"
          icon={<IconAlertCircle size={20} />}
          title="Batas Percobaan Tercapai"
          variant="light"
        >
          <Stack gap="sm">
            <Text size="sm">
              Anda telah mencapai batas maksimal{" "}
              <strong>{maxAttempts} percobaan</strong> untuk quiz ini.
            </Text>
            <Text size="sm" c="dimmed">
              💡 Saran: Hubungi dosen pengampu untuk mendapat kesempatan
              tambahan atau review materi kembali.
            </Text>
          </Stack>
        </Alert>
      )}

      {!isPassed && canRetry && attemptsMade > 0 && (
        <Alert
          color="blue"
          icon={<IconInfoCircle />}
          title="💪 Jangan Menyerah!"
        >
          <Text size="sm">
            Anda masih memiliki <strong>{attemptsRemaining} kesempatan</strong>{" "}
            lagi. Pelajari kembali materi dan coba lagi untuk mencapai skor
            minimum {quiz.passing_score}%.
          </Text>
        </Alert>
      )}

      {reviewData && (
        <QuizReviewModal
          opened={reviewModalOpened}
          onClose={() => setReviewModalOpened(false)}
          quizData={reviewData.quizData}
          studentAnswers={reviewData.studentAnswers}
          score={reviewData.score}
        />
      )}
    </Stack>
  );
}