// lmsistts/src/app/(public)/categories/[category_id]/page.tsx

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
  rem,
  CardSection,
  Paper,
  ThemeIcon,
  Divider,
} from "@mantine/core";
import { IconAlertCircle, IconBook } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryDetailsById } from "@/app/actions/category.actions";

const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined || price === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ category_id: string }>;
}) {
  const categoryId = parseInt((await params).category_id, 10);
  if (isNaN(categoryId)) notFound();

  const {
    success,
    data: category,
    error,
  } = await getCategoryDetailsById(categoryId);

  if (!success || !category) {
    if (error === "Kategori tidak ditemukan.") notFound();
    return (
      <Container py="xl">
        <Alert color="red" title="Terjadi Kesalahan" icon={<IconAlertCircle />}>
          {error || "Gagal memuat kategori."}
        </Alert>
      </Container>
    );
  }

  const courses = category.courses || [];

  return (
    <Container py="xl" size="lg">
      <Paper radius="md" p="xl" mb="xl" withBorder shadow="xs" ta="center">
        <Stack align="center" gap="sm">
          <ThemeIcon variant="light" color="blue" size={60} radius="xl">
            <IconBook size={34} />
          </ThemeIcon>
          <Title order={2}>{category.category_name}</Title>
          {category.category_description ? (
            <Text c="dimmed" size="lg" maw={600}>
              {category.category_description}
            </Text>
          ) : (
            <Text c="dimmed" size="sm">
              Koleksi kursus terbaik dalam kategori ini.
            </Text>
          )}
          <Divider my="sm" w={120} />
          <Badge variant="light" color="blue">
            {courses.length} Kursus Tersedia
          </Badge>
        </Stack>
      </Paper>

      {error && (
        <Alert
          color="red"
          title="Terjadi Kesalahan Memuat Kursus"
          icon={<IconAlertCircle />}
          mt="lg"
        >
          {error}
        </Alert>
      )}

      {courses.length > 0 ? (
        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 3 }}
          spacing="xl"
          verticalSpacing="xl"
          mt="xl"
        >
          {courses.map((course: any) => (
            <Card
              key={course.course_id}
              radius="md"
              withBorder
              shadow="xs"
              style={{
                transition: "all 180ms ease",
              }}
              component={Link}
              href={`/courses/${course.course_id}`}
            >
              <CardSection>
                <Image
                  src={
                    course.thumbnail_url ||
                    "https://placehold.co/600x400?text=No+Image"
                  }
                  height={160}
                  alt={course.course_title || "Course thumbnail"}
                  radius="md"
                />
              </CardSection>

              <Stack justify="space-between" mt="md" h={rem(150)}>
                <div>
                  <Title order={5} lineClamp={2}>
                    {course.course_title}
                  </Title>
                  <Text size="xs" c="dimmed" mt="xs">
                    oleh{" "}
                    {course.lecturer
                      ? `${course.lecturer.first_name || ""} ${
                          course.lecturer.last_name || ""
                        }`.trim()
                      : "N/A"}
                  </Text>
                </div>

                <Group justify="space-between" align="center">
                  <Text size="lg" fw={700} c="blue">
                    {formatPrice(course.course_price)}
                  </Text>
                  <Button variant="light" color="blue" size="xs" radius="md">
                    Lihat Detail
                  </Button>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Text ta="center" c="dimmed" mt="xl">
          Belum ada kursus yang tersedia untuk kategori ini.
        </Text>
      )}
    </Container>
  );
}
