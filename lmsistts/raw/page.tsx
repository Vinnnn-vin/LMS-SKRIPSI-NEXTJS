import { Container, Title, Text, SimpleGrid, Card, Image, Badge, Group, Button, Alert, Stack, Rating, Avatar, Paper, ThemeIcon, CardSection } from '@mantine/core';
import { IconAlertCircle, IconCertificate, IconUsers, IconBook } from '@tabler/icons-react';
import Link from 'next/link';
import { getPlatformStats, getFeaturedCourses, getFeaturedCategories, getRecentReviews } from '@/app/actions/landing.actions';
import { HeroBanner } from '@/components/landing/HeroBanner';

// Helper untuk format harga
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined || price === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};

// --- Baris 2: Overview / Stats ---
function StatsSection({ stats }: { stats: any }) {
  const data = [
    { title: 'Kursus Tersedia', value: stats.courses, icon: IconBook },
    { title: 'Siswa Terdaftar', value: stats.students, icon: IconUsers },
    { title: 'Pembelajaran Selesai', value: stats.enrollments, icon: IconCertificate },
  ];

  const items = data.map((item) => (
    <Paper withBorder p="md" radius="md" key={item.title}>
      <Group>
        <ThemeIcon variant="light" size={60} radius={60}>
          <item.icon style={{ width: 'rem(32)', height: 'rem(32)' }} stroke={1.5} />
        </ThemeIcon>
        <Stack gap={0}>
          <Text size="xl" fw={700}>{item.value.toLocaleString('id-ID')}+</Text>
          <Text size="sm" c="dimmed">{item.title}</Text>
        </Stack>
      </Group>
    </Paper>
  ));

  return <Container py="xl"><SimpleGrid cols={{ base: 1, sm: 3 }}>{items}</SimpleGrid></Container>;
}


// --- Baris 3: Featured Courses ---
function FeaturedCourses({ courses }: { courses: any[] }) {
    return (
        <Container py="xl" fluid style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
            <Container>
                <Title order={2} ta="center" mb="lg">Kursus Unggulan</Title>
                <Text ta="center" c="dimmed" mb="xl">Pilih dari kursus-kursus terbaik yang paling diminati saat ini.</Text>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                    {courses.map((course) => (
                        <Card shadow="sm" padding="lg" radius="md" withBorder key={course.course_id}>
                            <CardSection><Image src={course.thumbnail_url || 'https://placehold.co/600x400?text=No+Image'} height={180} /></CardSection>
                            <Group justify="space-between" mt="md" mb="xs">
                                <Text fw={500} size="lg" lineClamp={1}>{course.course_title}</Text>
                                <Badge color="pink">{course.category?.category_name || 'General'}</Badge>
                            </Group>
                            <Text size="sm" c="dimmed">
                                oleh {course.lecturer ? `${course.lecturer.first_name || ''} ${course.lecturer.last_name || ''}`.trim() : 'N/A'}
                            </Text>
                            <Group justify="space-between" mt="md">
                                <Text size="xl" fw={700} c="blue">{formatPrice(course.course_price)}</Text>
                                <Button component={Link} href={`/courses/${course.course_id}`} variant="light">Lihat Detail</Button>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
                <Group justify="center" mt="xl">
                    <Button component={Link} href="/courses" size="lg" variant="outline">Lihat Semua Kursus</Button>
                </Group>
            </Container>
        </Container>
    );
}

// --- Baris 4: Keunggulan iClick ---
// ... (Anda bisa menambahkan komponen ini dengan data statis jika perlu)

// --- Baris 5: Promosi Kategori ---
function CategoryPromotion({ categories }: { categories: any[] }) {
    return (
        <Container py="xl">
            <Title order={2} ta="center" mb="lg">Jelajahi Berdasarkan Kategori</Title>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                {categories.map((cat) => (
                    <Paper key={cat.category_id} component={Link} href={`/categories/${cat.category_id}`} withBorder p="xl" radius="md" ta="center" style={{ textDecoration: 'none' }}>
                        <Text fw={500}>{cat.category_name}</Text>
                    </Paper>
                ))}
            </SimpleGrid>
        </Container>
    );
}


// --- Baris 6: Testimonials ---
function Testimonials({ reviews }: { reviews: any[] }) {
  return (
    <Container py="xl" fluid style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Container>
            <Title order={2} ta="center" mb="lg">Apa Kata Mereka?</Title>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {reviews.map((review) => (
                <Paper withBorder p="lg" radius="md" key={review.review_id}>
                    <Stack>
                    <Rating value={review.rating} readOnly />
                    <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>"{review.review_text}"</Text>
                    <Group>
                        <Avatar size="md" radius="xl" />
                        <Text fw={500} size="sm">
                            {review.reviewer ? `${review.reviewer.first_name || ''} ${review.reviewer.last_name || ''}`.trim() : 'Siswa'}
                        </Text>
                    </Group>
                    </Stack>
                </Paper>
                ))}
            </SimpleGrid>
        </Container>
    </Container>
  );
}


export default async function HomePage() {
  // Ambil semua data di server secara paralel
  const [statsResult, coursesResult, categoriesResult, reviewsResult] = await Promise.all([
    getPlatformStats(),
    getFeaturedCourses(),
    getFeaturedCategories(),
    getRecentReviews(),
  ]);

  return (
    <Stack gap={0}>
      {/* Baris 1: Banner */}
      <HeroBanner />

      {/* Baris 2: Overview */}
      {statsResult.success && <StatsSection stats={statsResult.data} />}

      {/* Baris 3: Featured Courses */}
      {coursesResult.success && coursesResult.data && <FeaturedCourses courses={coursesResult.data} />}
      
      {/* Baris 4: Keunggulan iClick (Statis) - Anda bisa membuat komponennya */}

      {/* Baris 5: Promosi Kategori */}
      {categoriesResult.success && categoriesResult.data && <CategoryPromotion categories={categoriesResult.data} />}

      {/* Baris 6: Reviews */}
      {reviewsResult.success && reviewsResult.data && <Testimonials reviews={reviewsResult.data} />}

      {/* Penanganan Error Gabungan */}
      {(coursesResult.error || reviewsResult.error) && (
         <Container py="xl">
            <Alert color="red" title="Terjadi Kesalahan" icon={<IconAlertCircle />}>
                Gagal memuat sebagian data halaman. Coba muat ulang halaman.
            </Alert>
         </Container>
      )}
    </Stack>
  );
}