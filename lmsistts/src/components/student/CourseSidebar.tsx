// lmsistts\src\components\student\CourseSidebar.tsx

"use client";

import React from "react";
import { Paper, Group, Title, Badge, Box, Accordion, Stack, NavLink, ThemeIcon, Text, Alert } from "@mantine/core";
import { IconLock, IconInfoCircle, IconCircleCheckFilled, IconQuestionMark } from "@tabler/icons-react";
import { CountdownTimer } from "@/components/student/CountdownTimer";

export function CourseSidebar({
  course,
  completedDetails,
  completedQuizzes,
  completedAssignments,
  handleSelectContent,
  isAccessExpired,
  accessExpiresAt,
  enrolledAt,
}: {
  course: any;
  completedDetails: Set<number>;
  completedQuizzes: Set<number>;
  completedAssignments: Set<number>;
  handleSelectContent: (content: any, type: "detail" | "quiz") => void;
  isAccessExpired: boolean;
  accessExpiresAt?: Date | string | null;
  enrolledAt?: Date | string;
}) {
  return (
    <Paper
      withBorder
      radius={0}
      p="md"
      style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}
    >
      <Group justify="space-between" mb="md">
        <Title order={5}>Kurikulum Kursus</Title>
        {isAccessExpired && (
          <Badge color="red" leftSection={<IconLock size={12} />}>
            Terkunci
          </Badge>
        )}
      </Group>

      {accessExpiresAt && !isAccessExpired && (
        <Box mb="md">
          <CountdownTimer
            expiresAt={accessExpiresAt}
            type="course"
            showProgress={false}
            startedAt={enrolledAt}
          />
        </Box>
      )}

      {isAccessExpired && (
        <Alert color="red" mb="md">
          Akses kursus telah berakhir
        </Alert>
      )}

      {course.materials?.length === 0 && (
        <Alert color="gray">
          Belum ada materi tersedia untuk kursus ini.
        </Alert>
      )}

      <Accordion
        chevronPosition="left"
        variant="separated"
        defaultValue={course.materials?.[0]?.material_id?.toString?.()}
      >
        {course.materials?.map((material: any) => {
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
                            {detail.material_detail_type === 1 ? null : null}
                          </ThemeIcon>
                        }
                        rightSection={
                          isCompleted ? (
                            <IconCircleCheckFilled size={16} style={{ color: "var(--mantine-color-green-5)" }} />
                          ) : null
                        }
                        onClick={() => handleSelectContent(detail, "detail")}
                        disabled={isAccessExpired}
                        styles={{ label: { fontSize: "0.875rem" } }}
                      />
                    );
                  })}

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
                          isCompleted ? (
                            <IconCircleCheckFilled size={16} style={{ color: "var(--mantine-color-green-5)" }} />
                          ) : null
                        }
                        onClick={() => handleSelectContent(quiz, "quiz")}
                        disabled={isAccessExpired}
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
  );
}
