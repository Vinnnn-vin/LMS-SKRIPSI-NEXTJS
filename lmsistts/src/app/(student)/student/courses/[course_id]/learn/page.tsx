// lmsistts\src\app\(student)\student\courses\[course_id]\learn\page.tsx
import {
  Container,
  Alert,
  Loader,
  Center,
  Anchor,
  Text,
  Button,
  Stack,
  Title,
  Paper,
  Box,
  Group,
} from "@mantine/core";
import { getCourseLearningData } from "@/app/actions/student.actions";
import { notFound } from "next/navigation";
import { CourseLearningClientUI } from "@/components/student/CourseLearningClientUI";
import { Suspense } from "react";
import Link from "next/link";
import { IconAlertCircle, IconArrowLeft } from "@tabler/icons-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function LearnCoursePage({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  const courseId = parseInt((await params).course_id, 10);
  if (isNaN(courseId)) notFound();

  const result = await getCourseLearningData(courseId);

  if (!result.success) {
    if (result.error?.includes("Anda tidak terdaftar")) {
      return (
        <Container size="md" py={{ base: "md", sm: "xl" }} px={{ base: "sm", sm: "md" }}>
          <Stack gap="md">
            <Button
              component={Link}
              href="/student/dashboard"
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              size="sm"
            >
              Kembali
            </Button>
            
            <Alert 
              color="red" 
              title="Akses Ditolak" 
              icon={<IconAlertCircle />}
              styles={{
                root: {
                  borderRadius: 12,
                },
              }}
            >
              <Stack gap="sm">
                <Text size="sm">
                  {result.error}{" "}
                  <Anchor 
                    component={Link} 
                    href={`/courses/${courseId}`}
                    fw={500}
                  >
                    Lihat detail kursus.
                  </Anchor>
                </Text>
                <Group gap="xs" mt="xs">
                  <Button
                    component={Link}
                    href="/student/dashboard"
                    variant="light"
                    size="sm"
                    fullWidth
                  >
                    Kembali ke Dashboard
                  </Button>
                </Group>
              </Stack>
            </Alert>
          </Stack>
        </Container>
      );
    }

    console.error("Learn Page Error:", result.error);
    notFound();
  }

  if (!result.data || !result.data.course || !result.data.completedItems) {
    console.error(
      "Error: Incomplete data received from getCourseLearningData",
      result.data
    );
    return (
      <Container size="md" py={{ base: "md", sm: "xl" }} px={{ base: "sm", sm: "md" }}>
        <Stack gap="md">
          <Button
            component={Link}
            href="/student/dashboard"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            size="sm"
          >
            Kembali
          </Button>
          
          <Alert
            color="red"
            title="Error Data Tidak Lengkap"
            icon={<IconAlertCircle />}
            styles={{
              root: {
                borderRadius: 12,
              },
            }}
          >
            <Text size="sm">
              Gagal memuat data pembelajaran. Silakan coba lagi nanti atau hubungi support.
            </Text>
          </Alert>
        </Stack>
      </Container>
    );
  }

  const {
    course,
    completedItems,
    enrollment_id,
    totalProgress,
    initialSubmissionData,
    initialQuizAttempts,
    accessExpiresAt,
    enrolledAt,
    learningStartedAt,
    courseDuration,
    isAccessExpired,
    lastCheckpoint,
    submissionHistoryMap,
  } = result.data;

  const validCompletedItems =
    completedItems &&
    completedItems.details instanceof Set &&
    completedItems.quizzes instanceof Set &&
    completedItems.assignments instanceof Set
      ? completedItems
      : {
          details: new Set<number>(),
          quizzes: new Set<number>(),
          assignments: new Set<number>(),
        };

  const validQuizAttempts = initialQuizAttempts
    ? initialQuizAttempts.filter(
        (attempt: any) =>
          attempt.status === "passed" || attempt.status === "failed"
      )
    : [];

  let initialContent = null;
  let initialContentType: "detail" | "quiz" | null = null;

  if (lastCheckpoint) {
    console.log("📌 [SERVER] Resolving checkpoint:", lastCheckpoint);

    if (lastCheckpoint.type === "detail") {
      for (const material of course.materials || []) {
        const detail = material.details?.find(
          (d: any) => d.material_detail_id === lastCheckpoint.id
        );
        if (detail) {
          initialContent = detail;
          initialContentType = "detail";
          console.log(
            `✅ [SERVER] Found checkpoint detail: ${detail.material_detail_name}`
          );
          break;
        }
      }
    } else if (lastCheckpoint.type === "quiz") {
      for (const material of course.materials || []) {
        const quiz = material.quizzes?.find(
          (q: any) => q.quiz_id === lastCheckpoint.id
        );
        if (quiz) {
          initialContent = quiz;
          initialContentType = "quiz";
          console.log(`✅ [SERVER] Found checkpoint quiz: ${quiz.quiz_title}`);
          break;
        }
      }
    }
  }

  return (
    <Suspense
      fallback={
        <Center h="100vh">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text size="sm" c="dimmed">
              Memuat pembelajaran...
            </Text>
          </Stack>
        </Center>
      }
    >
      <Box
        style={{
          minHeight: '100vh',
          background: 'var(--mantine-color-gray-0)',
        }}
      >
        <CourseLearningClientUI
          key={courseId}
          course={course as any}
          completedItems={validCompletedItems}
          enrollmentId={enrollment_id as number}
          totalProgress={totalProgress}
          initialSubmissionData={initialSubmissionData}
          initialQuizAttempts={validQuizAttempts}
          accessExpiresAt={accessExpiresAt}
          enrolledAt={enrolledAt}
          learningStartedAt={learningStartedAt}
          courseDuration={courseDuration}
          isAccessExpired={isAccessExpired}
          submissionHistoryMap={submissionHistoryMap || {}}
          lastCheckpoint={lastCheckpoint}
          initialContent={initialContent}
          initialContentType={initialContentType}
          certificate={{
            certificate_number: ""
          }}
          existingReview={{
            rating: 0,
            review_text: ""
          }}
        />
      </Box>
    </Suspense>
  );
}