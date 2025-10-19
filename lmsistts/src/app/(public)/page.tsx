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
  CardSection,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";
import { getAllPublishedCourses } from "@/app/actions/course.actions";

// Helper untuk format harga
const formatPrice = (price: number | null) => {
  if (price === null || price === 0) {
    return "Gratis";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

export default async function HomePage() {
  const { success, data: courses, error } = await getAllPublishedCourses();

  return (
    <Container py="xl">
      <Title order={2} ta="center" mb="lg">
        Jelajahi Kursus Unggulan Kami
      </Title>

      {error && (
        <Alert
          color="red"
          title="Terjadi Kesalahan"
          icon={<IconAlertCircle />}
          mb="lg"
        >
          {error}
        </Alert>
      )}

      {success && courses && courses.length > 0 ? (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3 }}
          spacing="lg"
          verticalSpacing="lg"
        >
          {courses.map((course) => (
            <Card
              key={`course-${course.course_id}`}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
            >
              <CardSection>
                <Image
                  src={
                    course.thumbnail_url ||
                    "https://placehold.co/600x400?text=No+Image"
                  }
                  height={160}
                  alt={course.course_title || "Course thumbnail"}
                />
              </CardSection>

              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={500} size="lg" truncate>
                  {course.course_title}
                </Text>
                {course.category && (
                  <Badge color="pink" key={`badge-${course.course_id}`}>
                    {course.category.category_name}
                  </Badge>
                )}
              </Group>

              {course.lecturer && (
                <Text size="sm" c="dimmed">
                  oleh {course.lecturer.name}
                </Text>
              )}

              <Group justify="space-between" mt="md">
                <Text size="xl" fw={700} c="blue">
                  {formatPrice(course.course_price)}
                </Text>
                <Button
                  component={Link}
                  href={`/courses/${course.course_id}`}
                  variant="light"
                  color="blue"
                >
                  Lihat Detail
                </Button>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Text ta="center" c="dimmed" mt="xl">
          Saat ini belum ada kursus yang tersedia.
        </Text>
      )}
    </Container>
  );
}
