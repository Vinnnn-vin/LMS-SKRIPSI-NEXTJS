// lmsistts\src\app\(student)\student\dashboard\my-courses\page.tsx

import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Image,
  Badge,
  Group,
  Button,
  Alert,
  Stack,
  Progress,
  Tabs,
  Anchor,
  Paper,
  CardSection,
  TabsList,
  TabsTab,
  TabsPanel,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconPlayerPlay,
  IconCertificate,
} from "@tabler/icons-react";
import { getMyEnrolledCoursesWithProgress } from "@/app/actions/student.actions";
import Link from "next/link";
import { ViewCertificateButton } from "@/components/student/ViewCertificateButton";

function MyCourseCard({ course }: { course: any }) {
  const isCompleted = course.status === "completed" || course.progress === 100;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <CardSection>
        <Image
          src={
            course.thumbnail_url || "https://placehold.co/600x400?text=Course"
          }
          height={160}
          alt={course.course_title}
        />
      </CardSection>
      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500} size="lg" lineClamp={1}>
          {course.course_title}
        </Text>
        <Badge color="pink" variant="light">
          {course.category?.category_name || "General"}
        </Badge>
      </Group>
      <Stack gap="xs" mt="sm">
        <Text size="xs" c="dimmed">
          {course.progress}% Selesai
        </Text>
        <Progress
          value={course.progress}
          radius="sm"
          animated={!isCompleted}
          color={isCompleted ? "green" : "blue"}
        />
      </Stack>

      {isCompleted ? (
        <Stack mt="md" gap="xs">
          <ViewCertificateButton courseId={course.course_id} fullWidth={true} />
          <Button
            component={Link}
            href={`/student/courses/${course.course_id}/learn`}
            variant="subtle"
            color="blue"
            fullWidth
            radius="md"
            leftSection={<IconPlayerPlay size={16} />}
          >
            Review Materi
          </Button>
        </Stack>
      ) : (
        <Button
          component={Link}
          href={`/student/courses/${course.course_id}/learn`}
          variant="light"
          color="blue"
          fullWidth
          mt="md"
          radius="md"
          leftSection={<IconPlayerPlay size={16} />}
        >
          {course.progress > 0 ? "Lanjutkan Belajar" : "Mulai Belajar"}
        </Button>
      )}
    </Card>
  );
}

export default async function MyCoursesPage() {
  const result = await getMyEnrolledCoursesWithProgress();

  if (!result.success) {
    return (
      <Container py="xl">
        <Alert color="red" title="Gagal Memuat Data">
          {result.error}
        </Alert>
      </Container>
    );
  }

  const { active, completed } = result.data;

  return (
    <Container fluid>
      <Title order={3} mb="lg">
        Kursus Saya
      </Title>
      <Tabs defaultValue="active" variant="outline" radius="md">
        <TabsList>
          <TabsTab value="active">Kursus Aktif ({active.length})</TabsTab>
          <TabsTab value="completed">
            Kursus Selesai ({completed.length})
          </TabsTab>
        </TabsList>

        <TabsPanel value="active" pt="lg">
          {active.length > 0 ? (
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
              {active.map((course: any) => (
                <MyCourseCard key={course.enrollment_id} course={course} />
              ))}
            </SimpleGrid>
          ) : (
            <Paper withBorder p="xl" radius="md" ta="center" mt="xl">
              <Text c="dimmed">Anda belum mendaftar di kursus aktif.</Text>
              <Button component={Link} href="/" mt="md" variant="outline">
                Jelajahi Kursus
              </Button>
            </Paper>
          )}
        </TabsPanel>

        <TabsPanel value="completed" pt="lg">
          {completed.length > 0 ? (
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
              {completed.map((course: any) => (
                <MyCourseCard key={course.enrollment_id} course={course} />
              ))}
            </SimpleGrid>
          ) : (
            <Text c="dimmed" ta="center" mt="xl">
              Belum ada kursus yang selesai.
            </Text>
          )}
        </TabsPanel>
      </Tabs>
    </Container>
  );
}
