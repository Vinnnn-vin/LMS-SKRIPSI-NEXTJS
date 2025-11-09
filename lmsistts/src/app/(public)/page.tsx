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
  ThemeIcon,
  rem,
  CardSection,
  Box,
  Center,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCertificate,
  IconUsers,
  IconBook,
  IconPalette,
  IconHeart,
  IconSparkles,
  IconTrophy,
  IconArrowRight,
  IconStar,
  IconPlayCard,
  IconClock,
  IconArrowNarrowRight,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  getPlatformStats,
  getFeaturedCourses,
  getFeaturedCategories,
  getRecentReviews,
} from "@/app/actions/landing.actions";
import { HeroBanner } from "@/components/landing/HeroBanner";
import classes from "./page.module.css";

const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined || price === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

function FloatingElements() {
  return (
    <>
      <div className={classes.floatingElement1}></div>
      <div className={classes.floatingElement2}></div>
      <div className={classes.floatingElement3}></div>
      <div className={classes.floatingElement4}></div>
    </>
  );
}

function StatsSection({ stats }: { stats: any }) {
  const data = [
    {
      title: "Kursus Premium",
      value: stats.courses || 50,
      icon: IconBook,
      gradient: { from: "blue", to: "cyan" },
      description: "Kursus berkualitas",
    },
    {
      title: "Siswa Aktif",
      value: stats.students || 10000,
      icon: IconUsers,
      gradient: { from: "grape", to: "pink" },
      description: "Bergabung bersama kami",
    },
    {
      title: "Pembelajaran",
      value: stats.enrollments || 25000,
      icon: IconCertificate,
      gradient: { from: "orange", to: "red" },
      description: "Telah diselesaikan",
    },
    {
      title: "Rating Platform",
      value: 4.9,
      icon: IconStar,
      gradient: { from: "yellow", to: "orange" },
      description: "Dari 5.0 bintang",
    },
  ];

  const items = data.map((item, index) => (
    <Card
      p="lg"
      radius="lg"
      key={item.title}
      className={classes.statsCard}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <Group align="center" gap="md">
        <ThemeIcon
          variant="gradient"
          gradient={item.gradient}
          size={60}
          radius="lg"
          className={classes.statsIcon}
        >
          <item.icon style={{ width: rem(28), height: rem(28) }} stroke={1.5} />
        </ThemeIcon>
        <Stack gap={2}>
          <Text size="2rem" fw={900} lh={1} className={classes.statsNumber}>
            {typeof item.value === "number"
              ? item.value.toLocaleString("id-ID")
              : item.value}
            {item.title === "Rating Platform" ? "" : "+"}
          </Text>
          <Text size="md" fw={600} className={classes.statsTitle}>
            {item.title}
          </Text>
          <Text size="sm" c="dimmed">
            {item.description}
          </Text>
        </Stack>
      </Group>
    </Card>
  ));

  return (
    <Box className={classes.statsSection}>
      <FloatingElements />
      <Container size="xl" py={80}>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          {items}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

function FeaturedCourses({ courses }: { courses: any[] }) {
  const featuredCourses = courses?.slice(0, 6) || [];

  return (
    <Box className={classes.coursesSection}>
      <FloatingElements />
      <Container size="xl" py={80}>
        <Stack align="center" mb={50}>
          <Badge
            size="xl"
            variant="gradient"
            gradient={{ from: "blue", to: "cyan" }}
            className={classes.sectionBadge}
          >
            <IconSparkles size={16} style={{ marginRight: 8 }} />
            Pilihan Terbaik
          </Badge>
          <Title order={1} ta="center" className={classes.sectionTitle}>
            Kursus <span className={classes.gradientText}>Unggulan</span>
          </Title>
          <Text ta="center" c="dimmed" size="xl" maw={700}>
            Temukan kursus-kursus terbaik yang dipilih khusus untuk karir Anda
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
          {featuredCourses.map((course, index) => (
            <Card
              shadow="md"
              padding="lg"
              radius="lg"
              key={course.course_id}
              className={classes.courseCard}
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            >
              <CardSection className={classes.courseImageWrapper}>
                <div className={classes.imageContainer}>
                  <Image
                    src={
                      course.thumbnail_url ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                    }
                    height={200}
                    className={classes.courseImage}
                  />
                  <div className={classes.courseOverlay} />
                  <Badge
                    size="md"
                    variant="filled"
                    className={classes.courseBadge}
                  >
                    {course.category?.category_name || "General"}
                  </Badge>
                  <div className={classes.courseHoverContent}>
                    <Button
                      component={Link}
                      href={`/courses/${course.course_id}`}
                      variant="white"
                      size="sm"
                      radius="lg"
                      leftSection={<IconPlayCard size={16} />}
                    >
                      Lihat Kursus
                    </Button>
                  </div>
                </div>
              </CardSection>

              <Stack gap="md" mt="md">
                <Title order={4} lineClamp={2} className={classes.courseTitle}>
                  {course.course_title}
                </Title>

                <Group gap="xs" align="center">
                  <Avatar size="sm" radius="xl" src={course.lecturer?.image}>
                    {course.lecturer?.first_name?.[0] || "I"}
                  </Avatar>
                  <Text size="sm" c="dimmed" fw={500}>
                    {course.lecturer
                      ? `${course.lecturer.first_name || ""} ${course.lecturer.last_name || ""}`.trim()
                      : "Instruktur"}
                  </Text>
                </Group>

                <Group justify="space-between" align="center">
                  <Rating value={4.5} fractions={2} readOnly size="sm" />
                  <Text size="sm" c="dimmed">
                    {Math.floor(Math.random() * 100) + 50} siswa
                  </Text>
                </Group>

                <Group justify="space-between" align="center" mt="xs">
                  <div>
                    <Text size="lg" fw={900} className={classes.coursePrice}>
                      {formatPrice(course.course_price)}
                    </Text>
                  </div>
                  <Button
                    component={Link}
                    href={`/courses/${course.course_id}`}
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan" }}
                    size="md"
                    radius="lg"
                    className={classes.courseButton}
                    rightSection={<IconArrowNarrowRight size={18} />}
                  >
                    Bergabung Sekarang
                  </Button>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        <Center mt={50}>
          <Button
            component={Link}
            href="/courses"
            size="xl"
            variant="gradient"
            gradient={{ from: "blue", to: "cyan" }}
            radius="lg"
            className={classes.ctaButton}
            rightSection={<IconArrowRight size={20} />}
          >
            Jelajahi Semua Kursus
          </Button>
        </Center>
      </Container>
    </Box>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: IconPalette,
      title: "Desain Modern",
      description:
        "Antarmuka yang intuitif dan nyaman digunakan dengan pengalaman belajar terbaik",
      gradient: { from: "blue", to: "cyan" },
    },
    {
      icon: IconBook,
      title: "Konten Berkualitas",
      description:
        "Materi pembelajaran terkini yang disusun oleh para ahli dan praktisi industri",
      gradient: { from: "grape", to: "pink" },
    },
    {
      icon: IconCertificate,
      title: "Sertifikat Resmi",
      description:
        "Dapatkan sertifikat kelulusan yang diakui industri untuk meningkatkan karir Anda",
      gradient: { from: "orange", to: "red" },
    },
    {
      icon: IconHeart,
      title: "Dukungan 24/7",
      description:
        "Tim support kami siap membantu menyelesaikan masalah pembelajaran Anda kapan saja",
      gradient: { from: "teal", to: "lime" },
    },
    {
      icon: IconClock,
      title: "Akses Seumur Hidup",
      description:
        "Akses materi kursus selamanya setelah pembelian, termasuk update terbaru",
      gradient: { from: "indigo", to: "violet" },
    },
    {
      icon: IconUsers,
      title: "Komunitas Aktif",
      description:
        "Bergabung dengan komunitas belajar yang supportive dan berbagi pengalaman",
      gradient: { from: "red", to: "orange" },
    },
  ];

  return (
    <Box className={classes.featuresSection}>
      <FloatingElements />
      <Container size="xl" py={80}>
        <Stack align="center" mb={50}>
          <Badge
            size="xl"
            variant="gradient"
            gradient={{ from: "grape", to: "pink" }}
            className={classes.sectionBadge}
          >
            <IconTrophy size={16} style={{ marginRight: 8 }} />
            Keunggulan Kami
          </Badge>
          <Title order={1} ta="center" className={classes.sectionTitle}>
            Kenapa Memilih <span className={classes.gradientText}>iClick</span>?
          </Title>
          <Text ta="center" c="dimmed" size="xl" maw={700}>
            Platform pembelajaran online terdepan dengan pengalaman belajar yang
            tak tertandingi
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              p="xl"
              radius="lg"
              className={classes.featureCard}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <Stack gap="lg" align="flex-start">
                <ThemeIcon
                  variant="gradient"
                  gradient={feature.gradient}
                  size={70}
                  radius="lg"
                  className={classes.featureIcon}
                >
                  <feature.icon style={{ width: rem(32), height: rem(32) }} />
                </ThemeIcon>
                <Stack gap="xs">
                  <Title order={3} fw={700}>
                    {feature.title}
                  </Title>
                  <Text size="md" c="dimmed" lh={1.6}>
                    {feature.description}
                  </Text>
                </Stack>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

function CategoryPromotion({ categories }: { categories: any[] }) {
  const featuredCategories = categories?.slice(0, 8) || [];

  const categoryColors = [
    { from: "blue", to: "cyan" },
    { from: "grape", to: "pink" },
    { from: "orange", to: "red" },
    { from: "teal", to: "lime" },
    { from: "violet", to: "pink" },
    { from: "yellow", to: "orange" },
    { from: "indigo", to: "cyan" },
    { from: "green", to: "teal" },
  ];

  return (
    <Box className={classes.categoriesSection}>
      <FloatingElements />
      <Container size="xl" py={80}>
        <Stack align="center" mb={50}>
          <Badge
            size="xl"
            variant="gradient"
            gradient={{ from: "orange", to: "red" }}
            className={classes.sectionBadge}
          >
            <IconBook size={16} style={{ marginRight: 8 }} />
            Kategori Populer
          </Badge>
          <Title order={1} ta="center" className={classes.sectionTitle}>
            Jelajahi Berdasarkan{" "}
            <span className={classes.gradientText}>Kategori</span>
          </Title>
          <Text ta="center" c="dimmed" size="xl" maw={700}>
            Temukan kursus yang sesuai dengan minat dan kebutuhan karir Anda
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 2, sm: 4, lg: 4 }} spacing="lg">
          {featuredCategories.map((cat, index) => (
            <Button
              key={cat.category_id}
              component={Link}
              href={`/categories/${cat.category_id}`}
              variant="gradient"
              gradient={categoryColors[index % categoryColors.length]}
              size="xl"
              radius="lg"
              h={120}
              className={classes.categoryButton}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <Stack gap={4} align="center">
                <Text size="lg" fw={800} ta="center">
                  {cat.category_name}
                </Text>
                <Text size="sm" opacity={0.9} ta="center">
                  {Math.floor(Math.random() * 50) + 10} kursus
                </Text>
              </Stack>
            </Button>
          ))}
        </SimpleGrid>

        <Center mt={40}>
          <Button
            component={Link}
            href="/categories"
            variant="light"
            size="lg"
            radius="lg"
            rightSection={<IconArrowRight size={18} />}
          >
            Lihat Semua Kategori
          </Button>
        </Center>
      </Container>
    </Box>
  );
}

function Testimonials({ reviews }: { reviews: any[] }) {
  if (!reviews || reviews.length === 0) {
    return (
      <Box className={classes.testimonialsSection}>
        <Container size="xl" py={80}>
          <Stack align="center" mb={50}>
            <Badge
              size="xl"
              variant="gradient"
              gradient={{ from: "blue", to: "cyan" }}
              className={classes.sectionBadge}
            >
              <IconSparkles size={16} style={{ marginRight: 8 }} />
              Testimoni
            </Badge>
            <Title order={1} ta="center" className={classes.sectionTitle}>
              Apa Kata <span className={classes.gradientText}>Mereka</span>?
            </Title>
            <Text ta="center" c="dimmed" size="xl" maw={700}>
              Belum ada testimoni saat ini. Jadilah yang pertama memberikan
              ulasan!
            </Text>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box className={classes.testimonialsSection}>
      <Container size="xl" py={80}>
        <Stack align="center" mb={50}>
          <Badge
            size="xl"
            variant="gradient"
            gradient={{ from: "blue", to: "cyan" }}
            className={classes.sectionBadge}
          >
            <IconSparkles size={16} style={{ marginRight: 8 }} />
            Testimoni
          </Badge>
          <Title order={1} ta="center" className={classes.sectionTitle}>
            Apa Kata <span className={classes.gradientText}>Mereka</span>?
          </Title>
          <Text ta="center" c="dimmed" size="xl" maw={700}>
            Pengalaman nyata dari siswa-siswa iClick
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xl">
          {reviews.map((review, index) => (
            <Card
              key={review.review_id || index}
              p="xl"
              radius="lg"
              className={classes.testimonialCard}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <Stack gap="lg">
                <Group justify="space-between" align="center">
                  <Rating
                    value={review.rating || 5}
                    readOnly
                    size="lg"
                    color="yellow"
                  />
                  <IconSparkles size={24} className={classes.sparkleIcon} />
                </Group>

                <Text
                  size="md"
                  c="dimmed"
                  style={{ fontStyle: "italic" }}
                  lh={1.7}
                >
                  "
                  {review.review_text ||
                    "Review sangat membantu dalam proses belajar"}
                  "
                </Text>

                <Group gap="md">
                  <Avatar
                    size={60}
                    radius="lg"
                    src={review.reviewer?.image}
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan" }}
                  >
                    {review.reviewer?.first_name?.[0] ||
                      review.reviewer?.name?.[0] ||
                      "S"}
                  </Avatar>
                  <Stack gap={2}>
                    <Text fw={700} size="lg">
                      {review.reviewer
                        ? `${review.reviewer.first_name || ""} ${review.reviewer.last_name || ""}`.trim() ||
                          review.reviewer.name ||
                          "Siswa iClick"
                        : "Siswa iClick"}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {review.course?.course_title
                        ? `Siswa ${review.course.course_title}`
                        : "Verified Student"}
                    </Text>
                  </Stack>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        {reviews.length > 6 && (
          <Center mt={40}>
            <Button
              component={Link}
              href="/reviews"
              variant="light"
              size="lg"
              radius="lg"
              rightSection={<IconArrowRight size={18} />}
            >
              Lihat Semua Testimoni
            </Button>
          </Center>
        )}
      </Container>
    </Box>
  );
}

function CTASection() {
  return (
    <Box className={classes.ctaSection}>
      <Container size="xl" py={100}>
        <Stack align="center" gap="xl">
          <Title order={1} ta="center" c="white" className={classes.ctaTitle}>
            Siap Memulai Perjalanan Belajar Anda?
          </Title>
          <Text ta="center" c="rgba(255, 255, 255, 0.9)" size="xl" maw={600}>
            Bergabunglah dengan ribuan pelajar lainnya dan raih kesuksesan karir
            impian Anda
          </Text>
          <Group mt={20}>
            <Button
              component={Link}
              href="/register"
              size="xl"
              variant="white"
              radius="lg"
              className={classes.ctaButton}
              rightSection={<IconArrowRight size={20} />}
            >
              Daftar Sekarang
            </Button>
            <Button
              component={Link}
              href="/courses"
              size="xl"
              variant="outline"
              color="white"
              radius="lg"
            >
              Lihat Kursus
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}

export default async function HomePage() {
  const [statsResult, coursesResult, categoriesResult, reviewsResult] =
    await Promise.allSettled([
      getPlatformStats(),
      getFeaturedCourses(),
      getFeaturedCategories(),
      getRecentReviews(),
    ]);

  const stats =
    statsResult.status === "fulfilled" && statsResult.value.success
      ? statsResult.value.data
      : null;
  const courses =
    coursesResult.status === "fulfilled" && coursesResult.value.success
      ? coursesResult.value.data
      : [];
  const categories =
    categoriesResult.status === "fulfilled" && categoriesResult.value.success
      ? categoriesResult.value.data
      : [];
  const reviews =
    reviewsResult.status === "fulfilled" && reviewsResult.value.success
      ? reviewsResult.value.data
      : [];

  return (
    <Stack gap={0}>
      <HeroBanner />
      <StatsSection stats={stats} />
      <FeaturedCourses courses={courses} />
      <FeaturesSection />
      <CategoryPromotion categories={categories} />
      <Testimonials reviews={reviews} />
      <CTASection />

      {(statsResult.status === "rejected" ||
        coursesResult.status === "rejected" ||
        categoriesResult.status === "rejected" ||
        reviewsResult.status === "rejected") && (
        <Container py="xl">
          <Alert color="yellow" title="Peringatan" icon={<IconAlertCircle />}>
            Beberapa data mungkin tidak dapat dimuat. Silakan refresh halaman.
          </Alert>
        </Container>
      )}
    </Stack>
  );
}
