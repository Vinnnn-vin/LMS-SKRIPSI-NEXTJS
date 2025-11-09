// lmsistts\src\app\(lecturer)\lecturer\dashboard\courses\[course_id]\quizzes\[quiz_id]\edit\page.tsx

import {
  Container,
  Title,
  Text,
  Alert,
  Breadcrumbs,
  Anchor,
  Stack,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuizForEditPage } from "@/app/actions/lecturer.actions";
import { QuizQuestionManager } from "@/components/lecturer/QuizQuestionManager";
import { QuizDetailEditor } from "@/components/lecturer/QuizDetailEditor";
import type { QuizWithRelations } from "@/lib/schemas/quiz.schema";

export default async function EditQuizPage({
  params,
}: {
  params: { course_id: string; quiz_id: string };
}) {
  const courseId = parseInt(params.course_id, 10);
  const quizId = parseInt(params.quiz_id, 10);

  if (isNaN(courseId) || isNaN(quizId)) notFound();

  const result = await getQuizForEditPage(quizId);

  if (!result.success) {
    if (result.error?.includes("tidak ditemukan")) notFound();
    return (
      <Container py="xl">
        <Alert
          color="red"
          title="Gagal Memuat Data Quiz"
          icon={<IconAlertCircle />}
        >
          {result.error}
        </Alert>
      </Container>
    );
  }

  const quiz: QuizWithRelations = result.data;

  const breadcrumbItems = [
    { title: "Dashboard", href: "/lecturer/dashboard" },
    { title: "Manajemen Kursus", href: "/lecturer/dashboard/courses" },
    {
      title: quiz.course?.course_title || "Kursus",
      href: `/lecturer/dashboard/courses/${courseId}/materials`,
    },
    {
      title: quiz.material?.material_name || "Materi",
      href: `/lecturer/dashboard/courses/${courseId}/materials/${quiz.material_id}`,
    },
    { title: `Edit Quiz: ${quiz.quiz_title}`, href: "#" },
  ].map((item, index) => (
    <Anchor component={Link} href={item.href} key={index}>
      {item.title}
    </Anchor>
  ));

  return (
    <Container fluid>
      <Breadcrumbs mb="lg">{breadcrumbItems}</Breadcrumbs>

      <Title order={3}>Kelola Quiz: {quiz.quiz_title}</Title>
      <Text c="dimmed" mb="lg">
        Edit detail quiz, tambah, atau hapus pertanyaan dan jawaban.
      </Text>

      <Stack gap="xl">
        <QuizDetailEditor
          quizId={quizId}
          courseId={courseId}
          initialData={{
            quiz_title: quiz.quiz_title,
            quiz_description: quiz.quiz_description,
            passing_score: quiz.passing_score,
            time_limit: quiz.time_limit,
            max_attempts: quiz.max_attempts,
          }}
        />

        <QuizQuestionManager
          quizId={quizId}
          initialQuestions={quiz.questions || []}
        />
      </Stack>
    </Container>
  );
}
