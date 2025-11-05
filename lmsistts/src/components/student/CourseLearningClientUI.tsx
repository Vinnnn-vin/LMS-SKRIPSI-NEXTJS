// UPDATE CourseLearningClientUI.tsx

"use client";

import React, { useState, useMemo } from "react";
import { Box, Grid, Paper, Stack, Title, Text, Accordion, NavLink, ThemeIcon, Center, Alert } from "@mantine/core";
import { IconVideo, IconFileText, IconLink, IconPencil, IconQuestionMark, IconCircleCheckFilled, IconPlayerPlay, IconInfoCircle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

// Import komponen terpisah
import { LearningHeader } from "./LearningHeader";
import { MaterialContent } from "./MaterialContent";
import { AssignmentContent } from "./AssignmentContent";
import { QuizContent } from "./QuizContent";
import GlobalTimer from "./GlobalTimer"; // ✅ Import GlobalTimer
import { resetCourseProgressAndExtendAccess } from "@/app/actions/student.actions"; // ✅ Import action
import { Group } from "@mantine/core";

// ============================================
// TYPES & INTERFACES
// ============================================
interface QuizAttempt {
  quiz_id: number;
  attempt_session: number;
  score: number;
  status: "pending" | "passed" | "failed";
  completed_at: Date;
}

interface CompletedItems {
  details: Set<number>;
  quizzes: Set<number>;
  assignments: Set<number>;
}

interface CourseLearningClientUIProps {
  course: any;
  completedItems: CompletedItems;
  enrollmentId: number;
  totalProgress: number;
  initialSubmissionData?: any[];
  initialQuizAttempts?: QuizAttempt[];
  submissionHistoryMap?: Record<number, any[]>;
  accessExpiresAt?: Date | string | null;
  enrolledAt: Date | string; // ✅ Tidak optional, wajib ada
  learningStartedAt?: Date | string | null;
  courseDuration?: number;
  isAccessExpired?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const getMaterialIcon = (type: number) => {
  switch (type) {
    case 1:
      return <IconVideo size={16} />;
    case 2:
      return <IconFileText size={16} />;
    case 3:
      return <IconLink size={16} />;
    case 4:
      return <IconPencil size={16} />;
    default:
      return null;
  }
};

// ============================================
// MAIN COMPONENT
// ============================================
export function CourseLearningClientUI({
  course,
  completedItems,
  enrollmentId,
  totalProgress,
  initialSubmissionData = [],
  initialQuizAttempts = [],
  submissionHistoryMap = {},
  accessExpiresAt,
  enrolledAt,
  learningStartedAt, // ✅ Terima dari props
  courseDuration = 0, // ✅ Terima dari props
  isAccessExpired = false, // ✅ Terima dari props
}: CourseLearningClientUIProps) {
  const router = useRouter();
  const [activeContent, setActiveContent] = useState<any>(null);
  const [contentType, setContentType] = useState<"detail" | "quiz" | null>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);

  const { details: completedDetails, quizzes: completedQuizzes, assignments: completedAssignments } = completedItems;

  // Find current submission for active assignment
  const currentSubmission = useMemo(() => {
    if (contentType === "detail" && activeContent?.material_detail_type === 4 && initialSubmissionData) {
      return initialSubmissionData.find((s: any) => s.material_detail_id === activeContent.material_detail_id);
    }
    return null;
  }, [activeContent, contentType, initialSubmissionData]);

  // Get submission history for current assignment
  const currentSubmissionHistory = useMemo(() => {
    if (contentType === "detail" && activeContent?.material_detail_type === 4) {
      return submissionHistoryMap[activeContent.material_detail_id] || [];
    }
    return [];
  }, [activeContent, contentType, submissionHistoryMap]);

  // Find quiz attempts for active quiz
  const currentQuizAttempts = useMemo(() => {
    if (contentType === "quiz" && activeContent?.quiz_id && initialQuizAttempts) {
      return initialQuizAttempts.filter((attempt: any) => attempt.quiz_id === activeContent.quiz_id);
    }
    return [];
  }, [activeContent, contentType, initialQuizAttempts]);

  const latestQuizAttempt = useMemo(() => {
    if (currentQuizAttempts.length === 0) return null;
    return [...currentQuizAttempts].sort((a: any, b: any) => b.attempt_session - a.attempt_session)[0];
  }, [currentQuizAttempts]);

  // ✅ HANDLE TIMER EXPIRED
  const handleTimeExpired = async () => {
    try {
      const result = await resetCourseProgressAndExtendAccess(
        course.course_id,
        enrollmentId
      );

      if (result.success) {
        notifications.show({
          title: "✅ Progress Direset",
          message: result.message || "Anda dapat memulai pembelajaran kembali!",
          color: "blue",
        });
        
        // Refresh halaman untuk load data baru
        router.refresh();
      } else {
        notifications.show({
          title: "❌ Gagal Reset",
          message: result.error || "Terjadi kesalahan",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error resetting progress:", error);
      notifications.show({
        title: "❌ Error",
        message: "Gagal mereset progress",
        color: "red",
      });
    }
  };

  const handleSelectContent = (content: any, type: "detail" | "quiz") => {
    setActiveContent(content);
    setContentType(type);
    setIsQuizActive(false);
  };

  const handleStartQuiz = () => {
    const maxAttempts = activeContent?.max_attempts || 1;
    const uniqueAttempts = new Set(currentQuizAttempts.map((a: any) => a.attempt_session));

    if (uniqueAttempts.size >= maxAttempts) {
      notifications.show({
        title: "Batas Percobaan Habis",
        message: `Anda sudah mencapai batas maksimal ${maxAttempts} percobaan untuk quiz ini.`,
        color: "orange",
      });
      return;
    }
    setIsQuizActive(true);
  };

  const handleQuizFinish = (result: { score: number; status: "passed" | "failed" }) => {
    setIsQuizActive(false);
    notifications.show({
      title: result.status === "passed" ? "🎉 Quiz Lulus!" : "Quiz Belum Lulus",
      message: `Skor Anda: ${result.score}%. Minimum kelulusan: ${activeContent?.passing_score}%`,
      color: result.status === "passed" ? "green" : "red",
      autoClose: 10000,
    });
    router.refresh();
  };

  // Render main content area
  const renderContent = () => {
    if (!activeContent) {
      return (
        <Center h="100%">
          <Stack align="center" gap="xs">
            <IconPlayerPlay size={48} stroke={1} color="gray" />
            <Title order={4}>Selamat Datang</Title>
            <Text c="dimmed">Pilih materi dari sidebar untuk memulai.</Text>
          </Stack>
        </Center>
      );
    }

    // MATERIAL (Video, PDF, YouTube) - Type 1, 2, 3
    if (contentType === "detail" && [1, 2, 3].includes(activeContent.material_detail_type)) {
      return (
        <MaterialContent
          detail={activeContent}
          course={course}
          enrollmentId={enrollmentId}
          isCompleted={completedDetails.has(activeContent.material_detail_id)}
          accessExpiresAt={accessExpiresAt}
          enrolledAt={enrolledAt}
          onComplete={() => router.refresh()}
        />
      );
    }

    // ASSIGNMENT - Type 4
    if (contentType === "detail" && activeContent.material_detail_type === 4) {
      return (
        <AssignmentContent
          detail={activeContent}
          course={course}
          enrollmentId={enrollmentId}
          existingSubmission={currentSubmission}
          submissionHistory={currentSubmissionHistory}
          accessExpiresAt={accessExpiresAt}
          enrolledAt={enrolledAt}
          onSubmit={() => router.refresh()}
        />
      );
    }

    // QUIZ
    if (contentType === "quiz") {
      return (
        <QuizContent
          quiz={activeContent}
          course={course}
          enrollmentId={enrollmentId}
          currentQuizAttempts={currentQuizAttempts}
          completedQuizzes={completedQuizzes}
          onStartQuiz={handleStartQuiz}
          isQuizActive={isQuizActive}
          onFinish={handleQuizFinish}
          accessExpiresAt={accessExpiresAt}
          enrolledAt={enrolledAt}
          latestQuizAttempt={latestQuizAttempt}
        />
      );
    }

    return null;
  };

  return (
    <Box>
      {/* Header */}
      <LearningHeader courseTitle={course.course_title} totalProgress={totalProgress} />

      <Grid gutter={0}>
        {/* Sidebar - Curriculum */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder radius={0} p="md" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>
            {/* ✅ TAMBAHKAN GLOBAL TIMER DI SINI */}
            <Box mb="md">
              <GlobalTimer
                courseId={course.course_id}
                enrollmentId={enrollmentId}
                courseDuration={courseDuration || 0}
                learningStartedAt={learningStartedAt ? String(learningStartedAt) : String(enrolledAt)}
                enrolledAt={String(enrolledAt)}
                onTimeExpired={handleTimeExpired}
              />
            </Box>

            <Title order={5} mb="md">
              Kurikulum Kursus
            </Title>

            {course.materials?.length === 0 && (
              <Alert color="gray" icon={<IconInfoCircle />}>
                Belum ada materi tersedia untuk kursus ini.
              </Alert>
            )}

            <Accordion chevronPosition="left" variant="separated" defaultValue={course.materials?.[0]?.material_id.toString()}>
              {course.materials?.map((material: any) => {
                // Count completed items in this material
                const detailsCount = material.details?.length || 0;
                const quizzesCount = material.quizzes?.length || 0;
                const totalItems = detailsCount + quizzesCount;

                let completedCount = 0;
                material.details?.forEach((d: any) => {
                  if (d.material_detail_type === 4) {
                    if (completedAssignments.has(d.material_detail_id)) completedCount++;
                  } else {
                    if (completedDetails.has(d.material_detail_id)) completedCount++;
                  }
                });
                material.quizzes?.forEach((q: any) => {
                  if (completedQuizzes.has(q.quiz_id)) completedCount++;
                });

                const isChapterComplete = totalItems > 0 && completedCount === totalItems;

                return (
                  <Accordion.Item key={material.material_id} value={String(material.material_id)}>
                    <Accordion.Control>
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm" fw={500} lineClamp={2}>
                          {material.material_name}
                        </Text>
                        {isChapterComplete && <IconCircleCheckFilled size={16} color="green" />}
                      </Group>
                      <Text size="xs" c="dimmed" mt={4}>
                        {completedCount}/{totalItems} selesai
                      </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="xs">
                        {/* Material Details */}
                        {material.details?.map((detail: any) => {
                          const isCompleted =
                            detail.material_detail_type === 4
                              ? completedAssignments.has(detail.material_detail_id)
                              : completedDetails.has(detail.material_detail_id);

                          return (
                            <NavLink
                              key={`detail-${detail.material_detail_id}`}
                              label={detail.material_detail_name}
                              leftSection={
                                <ThemeIcon variant="light" color={isCompleted ? "green" : "gray"} size={20}>
                                  {getMaterialIcon(detail.material_detail_type)}
                                </ThemeIcon>
                              }
                              rightSection={
                                isCompleted ? <IconCircleCheckFilled size={16} style={{ color: "var(--mantine-color-green-5)" }} /> : null
                              }
                              onClick={() => handleSelectContent(detail, "detail")}
                              active={contentType === "detail" && activeContent?.material_detail_id === detail.material_detail_id}
                              styles={{ label: { fontSize: "0.875rem" } }}
                            />
                          );
                        })}

                        {/* Quizzes */}
                        {material.quizzes?.map((quiz: any) => {
                          const isCompleted = completedQuizzes.has(quiz.quiz_id);
                          return (
                            <NavLink
                              key={`quiz-${quiz.quiz_id}`}
                              label={quiz.quiz_title}
                              leftSection={
                                <ThemeIcon variant="light" color={isCompleted ? "green" : "orange"} size={20}>
                                  <IconQuestionMark size={16} />
                                </ThemeIcon>
                              }
                              rightSection={
                                isCompleted ? <IconCircleCheckFilled size={16} style={{ color: "var(--mantine-color-green-5)" }} /> : null
                              }
                              onClick={() => handleSelectContent(quiz, "quiz")}
                              active={contentType === "quiz" && activeContent?.quiz_id === quiz.quiz_id}
                              styles={{ label: { fontSize: "0.875rem" } }}
                            />
                          );
                        })}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          </Paper>
        </Grid.Col>

        {/* Main Content Area */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Box
            p="lg"
            style={{
              height: "calc(100vh - 70px)",
              overflowY: "auto",
              backgroundColor: "var(--mantine-color-gray-0)",
            }}
          >
            {renderContent()}
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}