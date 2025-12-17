"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  Group,
  Badge,
  Tooltip,
  Container,
  Progress,
  ActionIcon,
  Drawer,
  Button,
  Divider,
  Card,
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
  IconMenu2,
  IconX,
  IconChevronRight,
  IconChevronLeft,
  IconTrophy,
  IconClock,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLock,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { useMediaQuery, useDisclosure } from "@mantine/hooks";

import { LearningHeader } from "./LearningHeader";
import { MaterialContent } from "./MaterialContent";
import { AssignmentContent } from "./AssignmentContent";
import { QuizContent } from "./QuizContent";
import { CourseCompletionBar } from "./CourseCompletionBar";
import {
  resetCourseProgressAndExtendAccess,
  saveCheckpoint,
} from "@/app/actions/student.actions";

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
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  const contentAreaRef = useRef<HTMLDivElement>(null);

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

  // Get all contents in order for navigation
  const allContents = useMemo(() => {
    const contents: Array<{ type: "detail" | "quiz"; content: any }> = [];

    for (const material of course.materials || []) {
      if (material.details && material.details.length > 0) {
        for (const detail of material.details) {
          contents.push({ type: "detail", content: detail });
        }
      }
      if (material.quizzes && material.quizzes.length > 0) {
        for (const quiz of material.quizzes) {
          contents.push({ type: "quiz", content: quiz });
        }
      }
    }

    return contents;
  }, [course.materials]);

  // Get current index and navigation info
  const { currentIndex, previousContent, nextContent } = useMemo(() => {
    if (!activeContent || !contentType) {
      return { currentIndex: -1, previousContent: null, nextContent: null };
    }

    const currentId =
      contentType === "detail"
        ? activeContent.material_detail_id
        : activeContent.quiz_id;

    const index = allContents.findIndex((item) => {
      const itemId =
        item.type === "detail"
          ? item.content.material_detail_id
          : item.content.quiz_id;
      return item.type === contentType && itemId === currentId;
    });

    const prev = index > 0 ? allContents[index - 1] : null;
    const next = index < allContents.length - 1 ? allContents[index + 1] : null;

    return { currentIndex: index, previousContent: prev, nextContent: next };
  }, [activeContent, contentType, allContents]);

  const navigateToContent = (direction: "prev" | "next") => {
    const targetContent = direction === "next" ? nextContent : previousContent;
    if (targetContent) {
      handleSelectContent(
        targetContent.content,
        targetContent.type as "detail" | "quiz"
      );

      // Scroll to top
      if (contentAreaRef.current) {
        contentAreaRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const scrollToElement = (key: string, delay: number = 200) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const element = activeNavLinkRefs.current.get(key);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }, delay);
  };

  const handleSelectContent = async (content: any, type: "detail" | "quiz") => {
    setActiveContent(content);
    setContentType(type);
    setIsQuizActive(false);

    // Close drawer on mobile
    if (isMobile) {
      closeDrawer();
    }

    const contentId =
      type === "detail" ? content.material_detail_id : content.quiz_id;
    const targetMaterialId = findMaterialIdForContent(
      course.materials || [],
      type,
      contentId
    );

    if (targetMaterialId && targetMaterialId !== accordionValue) {
      setAccordionValue(targetMaterialId);
      scrollToElement(`${type}-${contentId}`, 400);
    } else {
      scrollToElement(`${type}-${contentId}`, 150);
    }

    try {
      await saveCheckpoint({
        courseId: course.course_id,
        enrollmentId: enrollmentId,
        contentType: type,
        contentId: contentId,
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

    if (result.status === "passed" && nextContent) {
      setTimeout(() => {
        navigateToContent("next");
      }, 2000);
    }
  };

  const handleMaterialComplete = () => {
    router.refresh();
    if (nextContent) {
      setTimeout(() => {
        navigateToContent("next");
      }, 1000);
    }
  };

  const isCheckpointContent = (type: "detail" | "quiz", id: number) => {
    return lastCheckpoint?.type === type && lastCheckpoint?.id === id;
  };

  // Sidebar Content Component
  const SidebarContent = () => (
    <Box p="lg">
      {/* Progress Card */}
      <Card shadow="sm" radius="md" mb="lg" p="md" withBorder>
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            <IconTrophy size={20} color="var(--mantine-color-yellow-6)" />
            <Text size="sm" fw={600}>
              Progress Kursus
            </Text>
          </Group>
          <Badge
            size="lg"
            variant="gradient"
            gradient={{ from: "blue", to: "cyan" }}
          >
            {totalProgress}%
          </Badge>
        </Group>
        <Progress value={totalProgress} size="lg" radius="xl" />
        <Text size="xs" c="dimmed" mt="xs" ta="center">
          {completedDetails.size +
            completedQuizzes.size +
            completedAssignments.size}{" "}
          dari total materi diselesaikan
        </Text>
      </Card>

      <Divider label="Kurikulum Kursus" labelPosition="center" mb="md" />

      {course.materials?.length === 0 && (
        <Alert color="gray" icon={<IconInfoCircle size={18} />} radius="md">
          <Text size="sm">Belum ada materi tersedia untuk kursus ini.</Text>
        </Alert>
      )}

      <Accordion
        chevronPosition="left"
        variant="separated"
        value={accordionValue}
        onChange={setAccordionValue}
        styles={{
          item: {
            border: "1px solid #dee2e6",
            marginBottom: "0.75rem",
            borderRadius: "12px",
            overflow: "hidden",
            transition: "all 0.2s ease",
            "&:hover": {
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            },
          },
          control: {
            padding: "1rem",
            "&:hover": {
              backgroundColor: "#f8f9fa",
            },
          },
          content: {
            padding: "0.5rem",
          },
          chevron: {
            marginRight: "0.5rem",
          },
        }}
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
              if (completedDetails.has(d.material_detail_id)) completedCount++;
            }
          });
          material.quizzes?.forEach((q: any) => {
            if (completedQuizzes.has(q.quiz_id)) completedCount++;
          });

          const isChapterComplete =
            totalItems > 0 && completedCount === totalItems;
          const chapterProgress =
            totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

          return (
            <Accordion.Item
              key={material.material_id}
              value={String(material.material_id)}
            >
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap" gap="xs">
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={500} lineClamp={2} mb={4}>
                      {material.material_name}
                    </Text>
                    <Progress
                      value={chapterProgress}
                      size="xs"
                      radius="xl"
                      color={isChapterComplete ? "green" : "blue"}
                    />
                    <Text size="xs" c="dimmed" mt={6}>
                      {completedCount}/{totalItems} selesai
                    </Text>
                  </Box>
                  {isChapterComplete && (
                    <IconCircleCheckFilled
                      size={22}
                      color="#37b24d"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </Group>
              </Accordion.Control>

              <Accordion.Panel>
                <Stack gap={6}>
                  {material.details?.map((detail: any) => {
                    const isCompleted =
                      detail.material_detail_type === 4
                        ? completedAssignments.has(detail.material_detail_id)
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
                            <Group gap={8} wrap="nowrap">
                              <Text
                                size="sm"
                                style={{ flex: 1, minWidth: 0 }}
                                lineClamp={2}
                              >
                                {detail.material_detail_name}
                              </Text>
                              {isCheckpoint && (
                                <Tooltip label="Checkpoint terakhir">
                                  <IconBookmark
                                    size={14}
                                    color="var(--mantine-color-blue-6)"
                                    style={{ flexShrink: 0 }}
                                  />
                                </Tooltip>
                              )}
                            </Group>
                          }
                          leftSection={
                            <ThemeIcon
                              variant="light"
                              color={isCompleted ? "green" : "gray"}
                              size={32}
                              radius="md"
                            >
                              {getMaterialIcon(detail.material_detail_type)}
                            </ThemeIcon>
                          }
                          rightSection={
                            isCompleted ? (
                              <IconCircleCheckFilled
                                size={18}
                                style={{
                                  color: "var(--mantine-color-green-5)",
                                  flexShrink: 0,
                                }}
                              />
                            ) : null
                          }
                          onClick={() => handleSelectContent(detail, "detail")}
                          active={isActive}
                          styles={{
                            root: {
                              borderRadius: "8px",
                              padding: "0.75rem",
                              transition: "all 0.15s ease",
                            },
                            label: {
                              fontSize: "0.875rem",
                              fontWeight: 450,
                            },
                          }}
                        />
                      </div>
                    );
                  })}

                  {material.quizzes?.map((quiz: any) => {
                    const isCompleted = completedQuizzes.has(quiz.quiz_id);
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
                            <Group gap={8} wrap="nowrap">
                              <Text
                                size="sm"
                                style={{ flex: 1, minWidth: 0 }}
                                lineClamp={2}
                              >
                                {quiz.quiz_title}
                              </Text>
                              {isCheckpoint && (
                                <Tooltip label="Checkpoint terakhir">
                                  <IconBookmark
                                    size={14}
                                    color="var(--mantine-color-blue-6)"
                                    style={{ flexShrink: 0 }}
                                  />
                                </Tooltip>
                              )}
                            </Group>
                          }
                          leftSection={
                            <ThemeIcon
                              variant="light"
                              color={isCompleted ? "green" : "orange"}
                              size={32}
                              radius="md"
                            >
                              <IconQuestionMark size={16} />
                            </ThemeIcon>
                          }
                          rightSection={
                            isCompleted ? (
                              <IconCircleCheckFilled
                                size={18}
                                style={{
                                  color: "var(--mantine-color-green-5)",
                                  flexShrink: 0,
                                }}
                              />
                            ) : null
                          }
                          onClick={() => handleSelectContent(quiz, "quiz")}
                          active={isActive}
                          styles={{
                            root: {
                              borderRadius: "8px",
                              padding: "0.75rem",
                              transition: "all 0.15s ease",
                            },
                            label: {
                              fontSize: "0.875rem",
                              fontWeight: 450,
                            },
                          }}
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
    </Box>
  );

  const renderContent = () => {
    if (!activeContent) {
      return (
        <Center h="100%" style={{ minHeight: "500px" }}>
          <Stack align="center" gap="lg">
            <ThemeIcon size={100} radius="xl" variant="light" color="blue">
              <IconPlayerPlay size={50} stroke={1.5} />
            </ThemeIcon>
            <Stack align="center" gap="sm">
              <Title order={2} c="dark">
                Selamat Datang! 👋
              </Title>
              <Text c="dimmed" size="md" ta="center" maw={400}>
                Pilih materi dari kurikulum kursus untuk memulai pembelajaran
                Anda
              </Text>
            </Stack>
            {lastCheckpoint && (
              <Badge
                color="blue"
                variant="dot"
                size="xl"
                leftSection={<IconBookmark size={16} />}
                mt="md"
              >
                Checkpoint tersimpan - Klik untuk melanjutkan
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
          onComplete={handleMaterialComplete}
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

  // Show checkpoint notification on mount
  useEffect(() => {
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
  }, []);

  // Calculate progress percentage
  const progressPercentage =
    allContents.length > 0 && currentIndex >= 0
      ? ((currentIndex + 1) / allContents.length) * 100
      : 0;

  return (
    <Box>
      <LearningHeader
        courseTitle={course.course_title}
        totalProgress={totalProgress}
      />

      {/* Mobile: Floating Menu Button */}
      {isMobile && (
        <ActionIcon
          size="xl"
          radius="xl"
          variant="filled"
          color="blue"
          style={{
            position: "fixed",
            bottom: "6.5rem",
            right: "1rem",
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          onClick={openDrawer}
        >
          <IconMenu2 size={24} />
        </ActionIcon>
      )}

      {/* Mobile: Drawer Sidebar */}
      {isMobile && (
        <Drawer
          opened={drawerOpened}
          onClose={closeDrawer}
          title={
            <Group gap="xs">
              <IconBookmark size={20} />
              <Text fw={600}>Kurikulum</Text>
            </Group>
          }
          padding="md"
          size="85%"
          position="left"
        >
          <SidebarContent />
        </Drawer>
      )}

      <Grid gutter={0}>
        {/* Desktop: Collapsible Sidebar */}
        {!isMobile && (
          <Grid.Col span={sidebarCollapsed ? 0 : 4}>
            <Paper
              withBorder
              radius={0}
              style={{
                height: "calc(100vh - 70px)",
                overflowY: "auto",
                transition: "all 0.3s ease",
                display: sidebarCollapsed ? "none" : "block",
              }}
            >
              <SidebarContent />
            </Paper>
          </Grid.Col>
        )}

        {/* Content Area */}
        <Grid.Col span={!isMobile && sidebarCollapsed ? 12 : isMobile ? 12 : 8}>
          <Box
            ref={contentAreaRef}
            style={{
              height: "calc(100vh - 70px)",
              overflowY: "auto",
              backgroundColor: "#f8f9fa",
              position: "relative",
              paddingBottom: activeContent ? "6rem" : "0",
            }}
          >
            {/* Desktop: Sidebar Toggle Button */}
            {!isMobile && (
              <ActionIcon
                size="lg"
                radius="md"
                variant="light"
                color="blue"
                style={{
                  position: "absolute",
                  top: "1rem",
                  left: "1rem",
                  zIndex: 10,
                }}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? (
                  <IconLayoutSidebarLeftExpand size={20} />
                ) : (
                  <IconLayoutSidebarLeftCollapse size={20} />
                )}
              </ActionIcon>
            )}

            <Container size="xl" p="xl" pt={isMobile ? "xl" : "5rem"}>
              {renderContent()}
            </Container>

            {/* ✅ FLOATING NAVIGATION BAR - Style 3 */}
            {activeContent && (
              <Paper
                shadow="lg"
                p="md"
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: isMobile ? 0 : sidebarCollapsed ? 0 : "33.333%",
                  right: 0,
                  borderTop: "2px solid #dee2e6",
                  borderTopLeftRadius: "16px",
                  borderTopRightRadius: "16px",
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  zIndex: 50,
                  transition: "left 0.3s ease",
                }}
              >
                <Box style={{ maxWidth: "1200px", margin: "0 auto" }}>
                  <Group justify="space-between" gap="md" wrap="nowrap">
                    {/* Previous Button */}
                    <Button
                      variant="light"
                      color="gray"
                      leftSection={<IconChevronLeft size={16} />}
                      disabled={!previousContent}
                      onClick={() => navigateToContent("prev")}
                      size={isMobile ? "sm" : "md"}
                      styles={{
                        root: {
                          transition: "all 0.2s ease",
                        },
                        section: {
                          transition: "transform 0.2s ease",
                        },
                      }}
                      onMouseEnter={(e) => {
                        const icon = e.currentTarget.querySelector("svg");
                        if (icon && !e.currentTarget.disabled) {
                          icon.style.transform = "translateX(-4px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const icon = e.currentTarget.querySelector("svg");
                        if (icon) {
                          icon.style.transform = "translateX(0)";
                        }
                      }}
                    >
                      {!isMobile && previousContent && (
                        <Box style={{ textAlign: "left", minWidth: 0 }}>
                          <Text size="xs" c="dimmed" fw={400}>
                            Sebelumnya
                          </Text>
                          <Text
                            size="sm"
                            fw={500}
                            truncate
                            style={{ maxWidth: "150px" }}
                          >
                            {previousContent.type === "detail"
                              ? previousContent.content.material_detail_name
                              : previousContent.content.quiz_title}
                          </Text>
                        </Box>
                      )}
                      {(isMobile || !previousContent) && "Sebelumnya"}
                    </Button>
                    {/* Center Progress Info */}
                    <Box
                      style={{
                        flex: 1,
                        textAlign: "center",
                        minWidth: 0,
                        px: "sm",
                      }}
                    >
                      <Group justify="center" gap="xs" mb={6}>
                        {contentType === "detail" &&
                        completedDetails.has(
                          activeContent.material_detail_id
                        ) ? (
                          <IconCircleCheckFilled
                            size={16}
                            color="var(--mantine-color-green-6)"
                          />
                        ) : contentType === "quiz" &&
                          completedQuizzes.has(activeContent.quiz_id) ? (
                          <IconCircleCheckFilled
                            size={16}
                            color="var(--mantine-color-green-6)"
                          />
                        ) : (
                          <IconPlayerPlay
                            size={16}
                            color="var(--mantine-color-blue-6)"
                          />
                        )}
                        <Text size="sm" fw={600}>
                          {currentIndex + 1} / {allContents.length}
                        </Text>
                      </Group>
                      <Box style={{ width: "100%", position: "relative" }}>
                        <Progress
                          value={progressPercentage}
                          size="sm"
                          radius="xl"
                          color="blue"
                          style={{
                            background: "#e9ecef",
                          }}
                        />
                        <Box
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            width: `${progressPercentage}%`,
                            background:
                              "linear-gradient(90deg, #4c6ef5 0%, #5f3dc4 100%)",
                            borderRadius: "var(--mantine-radius-xl)",
                            transition: "width 0.5s ease",
                            pointerEvents: "none",
                          }}
                        />
                      </Box>
                      {/* {!isMobile && (
                        <Text size="xs" c="dimmed" mt={4}>
                          {Math.round(progressPercentage)}% Selesai
                        </Text>
                      )} */}
                    </Box>
                    {/* Next Button */}
                    <Button
                      variant="gradient"
                      gradient={{ from: "blue", to: "indigo" }}
                      rightSection={
                        nextContent ? <IconChevronRight size={16} /> : null
                      }
                      disabled={!nextContent}
                      onClick={() => navigateToContent("next")}
                      size={isMobile ? "sm" : "md"}
                      styles={{
                        root: {
                          transition: "all 0.2s ease",
                          boxShadow: nextContent
                            ? "0 4px 12px rgba(79, 70, 229, 0.3)"
                            : "none",
                          "&:hover:not(:disabled)": {
                            transform: "scale(1.05)",
                            boxShadow: "0 6px 16px rgba(79, 70, 229, 0.4)",
                          },
                        },
                        section: {
                          transition: "transform 0.2s ease",
                        },
                      }}
                      onMouseEnter={(e) => {
                        const icon = e.currentTarget.querySelector("svg");
                        if (icon && !e.currentTarget.disabled) {
                          icon.style.transform = "translateX(4px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const icon = e.currentTarget.querySelector("svg");
                        if (icon) {
                          icon.style.transform = "translateX(0)";
                        }
                      }}
                    >
                      {!isMobile && nextContent && (
                        <Box style={{ textAlign: "right", minWidth: 0 }}>
                          <Text size="xs" style={{ opacity: 0.9 }} fw={400}>
                            Selanjutnya
                          </Text>
                          <Text
                            size="sm"
                            fw={500}
                            truncate
                            style={{ maxWidth: "150px" }}
                          >
                            {nextContent.type === "detail"
                              ? nextContent.content.material_detail_name
                              : nextContent.content.quiz_title}
                          </Text>
                        </Box>
                      )}
                      {(isMobile || !nextContent) && "Selanjutnya"}
                    </Button>
                  </Group>
                </Box>
              </Paper>
            )}
          </Box>
        </Grid.Col>
      </Grid>

      {/* Course Completion Bar */}
      <CourseCompletionBar
        totalProgress={totalProgress}
        courseId={course.course_id}
        certificateNumber={certificate?.certificate_number || null}
        existingReview={existingReview}
      />
    </Box>
  );
}
