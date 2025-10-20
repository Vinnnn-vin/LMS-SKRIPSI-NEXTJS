import { Container, Title, Text, SimpleGrid, Paper, Alert, Group, rem, Stack } from '@mantine/core';
import { IconAlertCircle, IconBook } from '@tabler/icons-react';
import Link from 'next/link';
import { getAllCategoriesWithCourseCount } from '@/app/actions/category.actions';

export default async function CategoriesPage() {
  const { success, data: categories, error } = await getAllCategoriesWithCourseCount();

  return (
    <Container py="xl">
      <Title order={1} ta="center" mb="md">
        Jelajahi Berdasarkan Kategori
      </Title>
      <Text c="dimmed" ta="center" size="lg" mb="xl">
        Temukan kursus berdasarkan bidang yang paling Anda minati.
      </Text>

      {error && (
        <Alert color="red" title="Terjadi Kesalahan" icon={<IconAlertCircle />}>
          {error}
        </Alert>
      )}

      {success && categories && categories.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {categories.map((category: any) => (
            <Paper
              key={category.category_id}
              component={Link}
              href={`/categories/${category.category_id}`} // Link ke halaman detail kategori
              withBorder
              p="xl"
              radius="md"
              style={{ textDecoration: 'none' }}
            >
              <Stack align="center" gap="md">
                <Title order={4}>{category.category_name}</Title>
                <Group gap="xs" c="dimmed">
                    <IconBook style={{width: rem(16), height: rem(16)}}/>
                    <Text size="sm">{category.course_count} Kursus</Text>
                </Group>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      ) : (
        <Text ta="center" c="dimmed" mt="xl">
          Tidak ada kategori yang tersedia saat ini.
        </Text>
      )}
    </Container>
  );
}
