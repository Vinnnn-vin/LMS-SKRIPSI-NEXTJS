// lmsistts\src\app\(public)\page.tsx

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
  Rating,
  Avatar,
  Paper,
  ThemeIcon,
  rem,
  CardSection,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCertificate,
  IconUsers,
  IconBook,
  IconPalette,
  IconHeart,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  getPlatformStats,
  getFeaturedCourses,
  getFeaturedCategories,
  getRecentReviews,
} from "@/app/actions/landing.actions";
import { HeroBanner } from "@/components/landing/HeroBanner";

// Helper for price formatting
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined || price === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

// --- Row 2: Overview / Stats ---
function StatsSection({ stats }: { stats: any }) {
  const data = [
    { title: "Kursus Tersedia", value: stats.courses, icon: IconBook },
    { title: "Siswa Terdaftar", value: stats.students, icon: IconUsers },
    {
      title: "Pembelajaran Selesai",
      value: stats.enrollments,
      icon: IconCertificate,
    },
  ];
  const items = data.map((item) => (
    <Paper withBorder p="md" radius="md" key={item.title}>
      <Group>
        <ThemeIcon variant="light" size={60} radius={60}>
          <item.icon style={{ width: rem(32), height: rem(32) }} stroke={1.5} />
        </ThemeIcon>
        <Stack gap={0}>
          <Text size="xl" fw={700}>
            {item.value.toLocaleString("id-ID")}+
          </Text>
          <Text size="sm" c="dimmed">
            {item.title}
          </Text>
        </Stack>
      </Group>
    </Paper>
  ));
  return (
    <Container py="xl">
      <SimpleGrid cols={{ base: 1, sm: 3 }}>{items}</SimpleGrid>
    </Container>
  );
}

// --- Row 3: Featured Courses ---
function FeaturedCourses({ courses }: { courses: any[] }) {
  // 👇 Hapus prop `fluid` dan `bg` dari Container ini
  return (
    <Container py="xl">
      <Title order={2} ta="center" mb="lg">
        Kursus Unggulan
      </Title>
      <Text ta="center" c="dimmed" mb="xl" size="lg">
        Pilih dari kursus-kursus terbaik yang paling diminati saat ini.
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {courses.map((course) => (
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            key={course.course_id}
          >
            <CardSection>
              <Image
                src={
                  course.thumbnail_url ||
                  "https://placehold.co/600x400?text=No+Image"
                }
                height={180}
              />
            </CardSection>
            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={500} size="lg" lineClamp={1}>
                {course.course_title}
              </Text>
              <Badge color="pink">
                {course.category?.category_name || "General"}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              oleh{" "}
              {course.lecturer
                ? `${course.lecturer.first_name || ""} ${course.lecturer.last_name || ""}`.trim()
                : "N/A"}
            </Text>
            <Group justify="space-between" mt="md">
              <Text size="xl" fw={700} c="blue">
                {formatPrice(course.course_price)}
              </Text>
              <Button
                component={Link}
                href={`/courses/${course.course_id}`}
                variant="light"
              >
                Lihat Detail
              </Button>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
      <Group justify="center" mt="xl">
        <Button component={Link} href="/courses" size="lg" variant="outline">
          Lihat Semua Kursus
        </Button>
      </Group>
    </Container>
  );
}

// --- Row 4: Keunggulan iClick ---
function FeaturesSection() {
  const features = [
    {
      icon: IconPalette,
      title: "Desain Modern",
      description: "Antarmuka yang bersih dan intuitif.",
    },
    {
      icon: IconBook,
      title: "Konten Berkualitas",
      description: "Materi disusun oleh para ahli industri.",
    },
    {
      icon: IconCertificate,
      title: "Sertifikat Kelulusan",
      description: "Tingkatkan nilai CV Anda.",
    },
    {
      icon: IconHeart,
      title: "Dukungan Penuh",
      description: "Tim kami siap membantu Anda.",
    },
  ];
  return (
    <Container py="xl">
      <Title order={2} ta="center" mb="lg">
        Kenapa Memilih iClick?
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
        {features.map((feature) => (
          <Group key={feature.title}>
            <ThemeIcon variant="light" size={44} radius="md">
              <feature.icon style={{ width: rem(24), height: rem(24) }} />
            </ThemeIcon>
            <div>
              <Text fw={500}>{feature.title}</Text>
              <Text size="sm" c="dimmed">
                {feature.description}
              </Text>
            </div>
          </Group>
        ))}
      </SimpleGrid>
    </Container>
  );
}

// --- Row 5: Promosi Kategori ---
function CategoryPromotion({ categories }: { categories: any[] }) {
  return (
    <Container py="xl">
      <Title order={2} ta="center" mb="lg">
        Jelajahi Berdasarkan Kategori
      </Title>
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
        {categories.map((cat) => (
          <Button
            key={cat.category_id}
            component={Link}
            href={`/categories/${cat.category_id}`}
            variant="outline"
            size="xl"
            radius="md"
          >
            {cat.category_name}
          </Button>
        ))}
      </SimpleGrid>
    </Container>
  );
}

// --- Row 6: Testimonials ---
function Testimonials({ reviews }: { reviews: any[] }) {
  // 👇 Hapus prop `fluid` dan `bg` dari Container ini
  return (
    <Container py="xl">
      <Title order={2} ta="center" mb="lg">
        Apa Kata Mereka?
      </Title>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        {reviews.map((review) => (
          <Paper withBorder p="lg" radius="md" key={review.review_id}>
            <Stack>
              <Rating value={review.rating} readOnly />
              <Text size="sm" c="dimmed" style={{ fontStyle: "italic" }}>
                "{review.review_text}"
              </Text>
              <Group>
                <Avatar size="md" radius="xl" />
                <Text fw={500} size="sm">
                  {review.reviewer
                    ? `${review.reviewer.first_name || ""} ${review.reviewer.last_name || ""}`.trim()
                    : "Siswa"}
                </Text>
              </Group>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Container>
  );
}

// --- Komponen Halaman Utama ---
export default async function HomePage() {
  const [statsResult, coursesResult, categoriesResult, reviewsResult] =
    await Promise.all([
      getPlatformStats(),
      getFeaturedCourses(),
      getFeaturedCategories(),
      getRecentReviews(),
    ]);

  return (
    <Stack gap={0}>
      <HeroBanner />
      {statsResult.success && <StatsSection stats={statsResult.data} />}
      {coursesResult.success && coursesResult.data && (
        <FeaturedCourses courses={coursesResult.data} />
      )}
      <FeaturesSection />
      {categoriesResult.success && categoriesResult.data && (
        <CategoryPromotion categories={categoriesResult.data} />
      )}
      {reviewsResult.success && reviewsResult.data && (
        <Testimonials reviews={reviewsResult.data} />
      )}
      {(statsResult.error ||
        coursesResult.error ||
        categoriesResult.error ||
        reviewsResult.error) && (
        <Container py="xl">
          <Alert
            color="red"
            title="Terjadi Kesalahan"
            icon={<IconAlertCircle />}
          >
            Gagal memuat sebagian data halaman.
          </Alert>
        </Container>
      )}
    </Stack>
  );
}
