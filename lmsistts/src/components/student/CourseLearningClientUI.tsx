// lmsistts\src\components\student\CourseLearningClientUI.tsx

"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Box,
  Grid,
  Paper,
  Stack,
  Title,
  Text,
  Accordion,
  NavLink,
  ThemeIcon,
  Center,
  Alert,
} from "@mantine/core";
import {
  IconVideo,
  IconFileText,
  IconLink,
  IconPencil,
  IconQuestionMark,
  IconCircleCheckFilled,
  IconPlayerPlay,
  IconInfoCircle,
  IconBookmark,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

import { LearningHeader } from "./LearningHeader";
import { MaterialContent } from "./MaterialContent";
import { AssignmentContent } from "./AssignmentContent";
import { QuizContent } from "./QuizContent";
import { CourseCompletionBar } from "./CourseCompletionBar";
import GlobalTimer from "./GlobalTimer";
import {
  resetCourseProgressAndExtendAccess,
  saveCheckpoint,
} from "@/app/actions/student.actions";
import { Group, Badge, Tooltip } from "@mantine/core";

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

interface Checkpoint {
  type: "detail" | "quiz";
  id: number;
  updatedAt: Date | string;
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
  enrolledAt: Date | string;
  learningStartedAt?: Date | string | null;
  courseDuration?: number;
  isAccessExpired?: boolean;
  lastCheckpoint?: Checkpoint | null;
  initialContent?: any | null;
  initialContentType?: "detail" | "quiz" | null;
  certificate: { certificate_number: string } | null;
  existingReview: { rating: number; review_text: string } | null;
}

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

const findMaterialIdForContent = (
  materials: any[],
  contentType: "detail" | "quiz",
  contentId: number
): string | null => {
  for (const material of materials) {
    if (contentType === "detail") {
      const hasDetail = material.details?.some(
        (d: any) => d.material_detail_id === contentId
      );
      if (hasDetail) return material.material_id.toString();
    } else if (contentType === "quiz") {
      const hasQuiz = material.quizzes?.some(
        (q: any) => q.quiz_id === contentId
      );
      if (hasQuiz) return material.material_id.toString();
    }
  }
  return null;
};

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
  learningStartedAt,
  courseDuration = 0,
  isAccessExpired = false,
  lastCheckpoint = null,
  initialContent = null,
  initialContentType = null,
  certificate,
  existingReview,
}: CourseLearningClientUIProps) {
  const router = useRouter();

  const [activeContent, setActiveContent] = useState<any>(initialContent);
  const [contentType, setContentType] = useState<"detail" | "quiz" | null>(
    initialContentType
  );
  const [isQuizActive, setIsQuizActive] = useState(false);

  const initialAccordionValue = useMemo(() => {
    if (!initialContent || !initialContentType) {
      return course.materials?.[0]?.material_id.toString() || null;
    }

    const contentId =
      initialContentType === "detail"
        ? initialContent.material_detail_id
        : initialContent.quiz_id;

    return findMaterialIdForContent(
      course.materials || [],
      initialContentType,
      contentId
    );
  }, [initialContent, initialContentType, course.materials]);

  const [accordionValue, setAccordionValue] = useState<string | null>(
    initialAccordionValue
  );

  const activeNavLinkRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    details: completedDetails,
    quizzes: completedQuizzes,
    assignments: completedAssignments,
  } = completedItems;

  const currentSubmission = useMemo(() => {
    if (
      contentType === "detail" &&
      activeContent?.material_detail_type === 4 &&
      initialSubmissionData
    ) {
      return initialSubmissionData.find(
        (s: any) => s.material_detail_id === activeContent.material_detail_id
      );
    }
    return null;
  }, [activeContent, contentType, initialSubmissionData]);

  const currentSubmissionHistory = useMemo(() => {
    if (contentType === "detail" && activeContent?.material_detail_type === 4) {
      return submissionHistoryMap[activeContent.material_detail_id] || [];
    }
    return [];
  }, [activeContent, contentType, submissionHistoryMap]);

  const currentQuizAttempts = useMemo(() => {
    if (
      contentType === "quiz" &&
      activeContent?.quiz_id &&
      initialQuizAttempts
    ) {
      return initialQuizAttempts.filter(
        (attempt: any) => attempt.quiz_id === activeContent.quiz_id
      );
    }
    return [];
  }, [activeContent, contentType, initialQuizAttempts]);

  const latestQuizAttempt = useMemo(() => {
    if (currentQuizAttempts.length === 0) return null;
    return [...currentQuizAttempts].sort(
      (a: any, b: any) => b.attempt_session - a.attempt_session
    )[0];
  }, [currentQuizAttempts]);

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

  const scrollToElement = (key: string, delay: number = 200) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const element = activeNavLinkRefs.current.get(key);
      if (element) {
        console.log(`📜 Scrolling to: ${key}`);
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      } else {
        console.warn(`⚠️ Element not found for key: ${key}`);
      }
    }, delay);
  };

  const handleSelectContent = async (content: any, type: "detail" | "quiz") => {
    setActiveContent(content);
    setContentType(type);
    setIsQuizActive(false);

    const contentId =
      type === "detail" ? content.material_detail_id : content.quiz_id;
    const targetMaterialId = findMaterialIdForContent(
      course.materials || [],
      type,
      contentId
    );

    console.log(
      `🎯 Selected: ${type} ${contentId}, Material: ${targetMaterialId}`
    );

    if (targetMaterialId && targetMaterialId !== accordionValue) {
      console.log(`📂 Expanding accordion: ${targetMaterialId}`);
      setAccordionValue(targetMaterialId);

      scrollToElement(`${type}-${contentId}`, 400);
    } else {
      scrollToElement(`${type}-${contentId}`, 150);
    }

    try {
      saveCheckpoint({
        courseId: course.course_id,
        enrollmentId: enrollmentId,
        contentType: type,
        contentId: contentId,
      })
        .then(() => {
          console.log(`✅ Checkpoint saved: ${type} ${contentId}`);
        })
        .catch((error) => {
          console.error("Failed to save checkpoint:", error);
        });
    } catch (error) {
      console.error("Checkpoint error:", error);
    }
  };

  const handleStartQuiz = () => {
    const maxAttempts = activeContent?.max_attempts || 1;
    const uniqueAttempts = new Set(
      currentQuizAttempts.map((a: any) => a.attempt_session)
    );

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

  const handleQuizFinish = (result: {
    score: number;
    status: "passed" | "failed";
  }) => {
    setIsQuizActive(false);
    notifications.show({
      title: result.status === "passed" ? "🎉 Quiz Lulus!" : "Quiz Belum Lulus",
      message: `Skor Anda: ${result.score}%. Minimum kelulusan: ${activeContent?.passing_score}%`,
      color: result.status === "passed" ? "green" : "red",
      autoClose: 10000,
    });
    router.refresh();
  };

  const isCheckpointContent = (type: "detail" | "quiz", id: number) => {
    return lastCheckpoint?.type === type && lastCheckpoint?.id === id;
  };

  const renderContent = () => {
    if (!activeContent) {
      return (
        <Center h="100%">
          <Stack align="center" gap="xs">
            <IconPlayerPlay size={48} stroke={1} color="gray" />
            <Title order={4}>Selamat Datang</Title>
            <Text c="dimmed">Pilih materi dari sidebar untuk memulai.</Text>
            {lastCheckpoint && (
              <Badge
                color="blue"
                variant="light"
                leftSection={<IconBookmark size={12} />}
                mt="md"
              >
                Ada checkpoint tersimpan
              </Badge>
            )}
          </Stack>
        </Center>
      );
    }

    if (
      contentType === "detail" &&
      [1, 2, 3].includes(activeContent.material_detail_type)
    ) {
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

  if (initialContent && initialContentType && typeof window !== "undefined") {
    const notifKey = `checkpoint_notif_${course.course_id}`;
    if (!sessionStorage.getItem(notifKey)) {
      setTimeout(() => {
        notifications.show({
          title: "📌 Checkpoint Dimuat",
          message: "Melanjutkan dari terakhir kali Anda belajar",
          color: "blue",
          autoClose: 4000,
        });
      }, 500);
      sessionStorage.setItem(notifKey, "shown");

      const contentId =
        initialContentType === "detail"
          ? initialContent.material_detail_id
          : initialContent.quiz_id;
      scrollToElement(`${initialContentType}-${contentId}`, 600);
    }
  }

  return (
    <Box>
      <LearningHeader
        courseTitle={course.course_title}
        totalProgress={totalProgress}
      />

      <Grid gutter={0}>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper
            withBorder
            radius={0}
            p="md"
            style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}
          >
            <Box mb="md">
              <GlobalTimer
                courseId={course.course_id}
                enrollmentId={enrollmentId}
                courseDuration={courseDuration || 0}
                learningStartedAt={
                  learningStartedAt
                    ? String(learningStartedAt)
                    : String(enrolledAt)
                }
                enrolledAt={String(enrolledAt)}
                onTimeExpired={handleTimeExpired}
                totalProgress={totalProgress}
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

            <Accordion
              chevronPosition="left"
              variant="separated"
              value={accordionValue}
              onChange={setAccordionValue}
            >
              {course.materials?.map((material: any) => {
                const detailsCount = material.details?.length || 0;
                const quizzesCount = material.quizzes?.length || 0;
                const totalItems = detailsCount + quizzesCount;

                let completedCount = 0;
                material.details?.forEach((d: any) => {
                  if (d.material_detail_type === 4) {
                    if (completedAssignments.has(d.material_detail_id))
                      completedCount++;
                  } else {
                    if (completedDetails.has(d.material_detail_id))
                      completedCount++;
                  }
                });
                material.quizzes?.forEach((q: any) => {
                  if (completedQuizzes.has(q.quiz_id)) completedCount++;
                });

                const isChapterComplete =
                  totalItems > 0 && completedCount === totalItems;

                return (
                  <Accordion.Item
                    key={material.material_id}
                    value={String(material.material_id)}
                  >
                    <Accordion.Control>
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm" fw={500} lineClamp={2}>
                          {material.material_name}
                        </Text>
                        {isChapterComplete && (
                          <IconCircleCheckFilled size={16} color="green" />
                        )}
                      </Group>
                      <Text size="xs" c="dimmed" mt={4}>
                        {completedCount}/{totalItems} selesai
                      </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="xs">
                        {material.details?.map((detail: any) => {
                          const isCompleted =
                            detail.material_detail_type === 4
                              ? completedAssignments.has(
                                  detail.material_detail_id
                                )
                              : completedDetails.has(detail.material_detail_id);

                          const isCheckpoint = isCheckpointContent(
                            "detail",
                            detail.material_detail_id
                          );
                          const isActive =
                            contentType === "detail" &&
                            activeContent?.material_detail_id ===
                              detail.material_detail_id;
                          const refKey = `detail-${detail.material_detail_id}`;

                          return (
                            <div
                              key={refKey}
                              ref={(el) => {
                                if (el) {
                                  activeNavLinkRefs.current.set(refKey, el);
                                } else {
                                  activeNavLinkRefs.current.delete(refKey);
                                }
                              }}
                            >
                              <NavLink
                                label={
                                  <Group gap="xs" wrap="nowrap">
                                    <Text size="sm" style={{ flex: 1 }}>
                                      {detail.material_detail_name}
                                    </Text>
                                    {isCheckpoint && (
                                      <Tooltip label="Checkpoint terakhir">
                                        <IconBookmark
                                          size={14}
                                          color="var(--mantine-color-blue-6)"
                                        />
                                      </Tooltip>
                                    )}
                                  </Group>
                                }
                                leftSection={
                                  <ThemeIcon
                                    variant="light"
                                    color={isCompleted ? "green" : "gray"}
                                    size={20}
                                  >
                                    {getMaterialIcon(
                                      detail.material_detail_type
                                    )}
                                  </ThemeIcon>
                                }
                                rightSection={
                                  isCompleted ? (
                                    <IconCircleCheckFilled
                                      size={16}
                                      style={{
                                        color: "var(--mantine-color-green-5)",
                                      }}
                                    />
                                  ) : null
                                }
                                onClick={() =>
                                  handleSelectContent(detail, "detail")
                                }
                                active={isActive}
                                styles={{ label: { fontSize: "0.875rem" } }}
                              />
                            </div>
                          );
                        })}

                        {material.quizzes?.map((quiz: any) => {
                          const isCompleted = completedQuizzes.has(
                            quiz.quiz_id
                          );
                          const isCheckpoint = isCheckpointContent(
                            "quiz",
                            quiz.quiz_id
                          );
                          const isActive =
                            contentType === "quiz" &&
                            activeContent?.quiz_id === quiz.quiz_id;
                          const refKey = `quiz-${quiz.quiz_id}`;

                          return (
                            <div
                              key={refKey}
                              ref={(el) => {
                                if (el) {
                                  activeNavLinkRefs.current.set(refKey, el);
                                } else {
                                  activeNavLinkRefs.current.delete(refKey);
                                }
                              }}
                            >
                              <NavLink
                                label={
                                  <Group gap="xs" wrap="nowrap">
                                    <Text size="sm" style={{ flex: 1 }}>
                                      {quiz.quiz_title}
                                    </Text>
                                    {isCheckpoint && (
                                      <Tooltip label="Checkpoint terakhir">
                                        <IconBookmark
                                          size={14}
                                          color="var(--mantine-color-blue-6)"
                                        />
                                      </Tooltip>
                                    )}
                                  </Group>
                                }
                                leftSection={
                                  <ThemeIcon
                                    variant="light"
                                    color={isCompleted ? "green" : "orange"}
                                    size={20}
                                  >
                                    <IconQuestionMark size={16} />
                                  </ThemeIcon>
                                }
                                rightSection={
                                  isCompleted ? (
                                    <IconCircleCheckFilled
                                      size={16}
                                      style={{
                                        color: "var(--mantine-color-green-5)",
                                      }}
                                    />
                                  ) : null
                                }
                                onClick={() =>
                                  handleSelectContent(quiz, "quiz")
                                }
                                active={isActive}
                                styles={{ label: { fontSize: "0.875rem" } }}
                              />
                            </div>
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
      <CourseCompletionBar
        totalProgress={totalProgress}
        courseId={course.course_id}
        certificateNumber={certificate?.certificate_number || null}
        existingReview={existingReview}
      />
    </Box>
  );
}
