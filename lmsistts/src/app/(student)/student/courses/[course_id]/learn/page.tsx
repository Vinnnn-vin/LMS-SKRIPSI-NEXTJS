// UPDATE learn/page.tsx

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
} from "@mantine/core";
import { getCourseLearningData } from "@/app/actions/student.actions";
import { notFound } from "next/navigation";
import { CourseLearningClientUI } from "@/components/student/CourseLearningClientUI";
import { Suspense } from "react";
import Link from "next/link";
import {
  IconAlertCircle,
  IconArrowLeft,
} from "@tabler/icons-react";
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
    // ✅ HAPUS ATAU KOMENTAR BLOCK EXPIRED INI
    // Karena sekarang handling expired ada di client side (GlobalTimer)
    /*
    if (result.error === "Akses Anda ke kursus ini telah berakhir.") {
      return (
        <Container size="sm" py={100}>
          <Paper withBorder p="xl" radius="md" ta="center">
            <Stack align="center">
              <IconClockCancel
                size={60}
                stroke={1.5}
                color="var(--mantine-color-orange-6)"
              />
              <Title order={3} mt="md">
                Akses Berakhir
              </Title>
              <Text c="dimmed" size="sm">
                Masa akses Anda untuk kursus ini telah habis. Progress Anda telah direset ke 0.
              </Text>
              <Text c="dimmed" size="xs" mt="xs">
                Silakan daftar ulang untuk melanjutkan pembelajaran.
              </Text>
              <Button
                component={Link}
                href="/student/dashboard"
                leftSection={<IconArrowLeft size={16} />}
                mt="lg"
                variant="outline"
              >
                Kembali ke Dashboard
              </Button>
            </Stack>
          </Paper>
        </Container>
      );
    }
    */

    if (result.error?.includes("Anda tidak terdaftar")) {
      return (
        <Container py="xl">
          <Alert color="red" title="Akses Ditolak" icon={<IconAlertCircle />}>
            <Text>
              {result.error}{" "}
              <Anchor component={Link} href={`/courses/${courseId}`}>
                Lihat detail kursus.
              </Anchor>
            </Text>
            <Button
              component={Link}
              href="/student/dashboard"
              mt="md"
              variant="outline"
            >
              Kembali ke Dashboard
            </Button>
          </Alert>
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
      <Container py="xl">
        <Alert
          color="red"
          title="Error Data Tidak Lengkap"
          icon={<IconAlertCircle />}
        >
          Gagal memuat data pembelajaran. Silakan coba lagi nanti atau hubungi
          support.
        </Alert>
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
    learningStartedAt, // ✅ Tambahkan
    courseDuration, // ✅ Tambahkan
    isAccessExpired, // ✅ Tambahkan
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

  // Filter quiz attempts to remove 'pending' status
  const validQuizAttempts = initialQuizAttempts
    ? initialQuizAttempts.filter(
        (attempt: any) => attempt.status === "passed" || attempt.status === "failed"
      )
    : [];

  return (
    <Suspense
      fallback={
        <Center h="100vh">
          <Loader />
        </Center>
      }
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
        learningStartedAt={learningStartedAt} // ✅ Pass ke client
        courseDuration={courseDuration} // ✅ Pass ke client
        isAccessExpired={isAccessExpired} // ✅ Pass ke client
        submissionHistoryMap={submissionHistoryMap || {}}
      />
    </Suspense>
  );
}