// lmsistts\src\app\(public)\categories\[category_id]\page.tsx

import { Container, Title, Text, SimpleGrid, Card, Image, Badge, Group, Button, Alert, Stack, rem, CardSection } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryDetailsById } from '@/app/actions/category.actions';

// Helper untuk format harga (bisa dipindahkan ke file utilitas nanti)
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined || price === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};

export default async function CategoryDetailPage({ params }: { params: { category_id: string } }) {
  const categoryId = parseInt(params.category_id, 10);
  if (isNaN(categoryId)) {
    notFound(); // Tampilkan halaman 404 jika ID tidak valid
  }

  const { success, data: category, error } = await getCategoryDetailsById(categoryId);

  if (!success || !category) {
    if (error === 'Kategori tidak ditemukan.') {
      notFound();
    }
    return (
      <Container py="xl">
        <Alert color="red" title="Terjadi Kesalahan" icon={<IconAlertCircle />}>{error || 'Gagal memuat kategori.'}</Alert>
      </Container>
    );
  }

  const courses = category.courses || []; // Ambil data kursus dari hasil include

  return (
    <Container py="xl">
      <Title order={1} ta="center" mb="md">
        Kategori: {category.category_name}
      </Title>
      {category.category_description && (
          <Text c="dimmed" ta="center" size="lg" mb="xl">
            {category.category_description}
          </Text>
      )}

      {error && (
        <Alert color="red" title="Terjadi Kesalahan Memuat Kursus" icon={<IconAlertCircle />} mt="lg">
          {error}
        </Alert>
      )}

      {courses.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg" verticalSpacing="xl" mt="xl">
          {courses.map((course: any) => (
            <Card shadow="sm" padding="lg" radius="md" withBorder key={course.course_id}>
              <CardSection>
                <Image
                  src={course.thumbnail_url || 'https://placehold.co/600x400?text=No+Image'}
                  height={160}
                  alt={course.course_title || 'Course thumbnail'}
                />
              </CardSection>
              
              <Stack justify="space-between" mt="md" h={rem(150)}>
                <div>
                  <Group justify="space-between" mb="xs">
                    <Text fw={500} size="md" lineClamp={2}>{course.course_title}</Text>
                  </Group>
                  {/* Kategori tidak perlu ditampilkan lagi di sini */}
                  <Text size="xs" c="dimmed" mt="sm">
                    oleh {course.lecturer ? `${course.lecturer.first_name || ''} ${course.lecturer.last_name || ''}`.trim() : 'N/A'}
                  </Text>
                </div>

                <Group justify="space-between">
                  <Text size="lg" fw={700} c="blue">{formatPrice(course.course_price)}</Text>
                  <Button
                    component={Link}
                    href={`/courses/${course.course_id}`}
                    variant="light"
                    color="blue"
                    size="xs"
                    radius="md"
                  >
                    Detail
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