// lmsistts/src/app/(public)/categories/page.tsx

import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Paper,
  Alert,
  Group,
  Stack,
  ThemeIcon,
  Badge,
  HoverCard,
  HoverCardTarget,
  HoverCardDropdown,
} from "@mantine/core";
import { IconAlertCircle, IconBook } from "@tabler/icons-react";
import Link from "next/link";
import { getAllCategoriesWithCourseCount } from "@/app/actions/category.actions";

// [FIX] Pastikan halaman ini selalu dinamis
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; // Tambahan untuk memastikan tidak ada cache data

export default async function CategoriesPage() {
  const {
    success,
    data: categories,
    error,
  } = await getAllCategoriesWithCourseCount();

  // Helper untuk warna badge berdasarkan jumlah kursus
  const getBadgeColor = (count: number) => {
    if (count === 0) return "gray";
    if (count < 5) return "blue";
    return "green";
  };

  return (
    <Container py="xl" size="lg">
      <Stack align="center" mb="xl">
        <Title order={1} ta="center" fz={{ base: 28, sm: 36 }}>
          Jelajahi Berdasarkan Kategori
        </Title>
        <Text c="dimmed" ta="center" size="lg" maw={600}>
          Temukan kursus berdasarkan bidang yang paling Anda minati.
        </Text>
      </Stack>

      {error && (
        <Alert color="red" title="Terjadi Kesalahan" icon={<IconAlertCircle />}>
          {error}
        </Alert>
      )}

      {success && categories && categories.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl" mt="md">
          {categories.map((category: any) => (
            <HoverCard
              key={category.category_id}
              width={280}
              shadow="md"
              withArrow
              openDelay={200}
              closeDelay={400}
            >
              <HoverCardTarget>
                <Paper
                  component={Link}
                  href={`/categories/${category.category_id}`}
                  p="xl"
                  radius="lg"
                  withBorder
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  // Efek hover sederhana via style prop (opsional jika pakai CSS modules)
                >
                  <Stack align="center" gap="sm">
                    <ThemeIcon
                      variant="light"
                      color={category.course_count > 0 ? "blue" : "gray"}
                      size={60}
                      radius="xl"
                    >
                      <IconBook size={32} />
                    </ThemeIcon>

                    <Title order={4} ta="center" lineClamp={1}>
                      {category.category_name}
                    </Title>

                    <Badge
                      variant="light"
                      color={getBadgeColor(category.course_count)}
                    >
                      {category.course_count} Kursus
                    </Badge>
                  </Stack>
                </Paper>
              </HoverCardTarget>

              <HoverCardDropdown>
                <Text size="sm" fw={500}>
                  {category.category_name}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  {category.category_description || "Tidak ada deskripsi."}
                </Text>
                <Text size="xs" c="blue" mt="xs" fw={600}>
                  Klik untuk lihat detail →
                </Text>
              </HoverCardDropdown>
            </HoverCard>
          ))}
        </SimpleGrid>
      ) : (
        <Stack align="center" mt={50}>
          <IconBook size={48} color="gray" style={{ opacity: 0.5 }} />
          <Text ta="center" c="dimmed">
            Belum ada kategori yang tersedia saat ini.
          </Text>
        </Stack>
      )}
    </Container>
  );
}
