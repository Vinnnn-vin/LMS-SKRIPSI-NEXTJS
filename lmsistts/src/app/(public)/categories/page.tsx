// lmsistts/src/app/(public)/categories/page.tsx

import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Paper,
  Alert,
  Group,
  rem,
  Stack,
  ThemeIcon,
  Badge,
  HoverCard,
  Transition,
  HoverCardTarget,
  HoverCardDropdown,
} from "@mantine/core";
import { IconAlertCircle, IconBook } from "@tabler/icons-react";
import Link from "next/link";
import { getAllCategoriesWithCourseCount } from "@/app/actions/category.actions";

export default async function CategoriesPage() {
  const { success, data: categories, error } = await getAllCategoriesWithCourseCount();

  return (
    <Container py="xl" size="lg">
      <Stack align="center" mb="xl">
        <Title order={1} ta="center" fz={{ base: 28, sm: 36 }}>
          Jelajahi Berdasarkan Kategori
        </Title>
        <Text c="dimmed" ta="center" size="lg" maw={600}>
          Temukan kursus berdasarkan bidang yang paling Anda minati dan mulai belajar sekarang.
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
              withinPortal
              openDelay={80}
              shadow="md"
              radius="md"
            >
              <HoverCardTarget>
                <Paper
                  component={Link}
                  href={`/categories/${category.category_id}`}
                  p="xl"
                  radius="lg"
                  withBorder
                  shadow="xs"
                  style={{
                    textDecoration: "none",
                    transition: "all 150ms ease",
                  }}
                  className="hover-card"
                >
                  <Stack align="center" gap="sm">
                    <ThemeIcon
                      variant="light"
                      color="blue"
                      size={50}
                      radius="xl"
                    >
                      <IconBook size={28} />
                    </ThemeIcon>

                    <Title order={4} ta="center">
                      {category.category_name}
                    </Title>

                    <Group gap="xs" c="dimmed">
                      <Text size="sm">{category.course_count} Kursus</Text>
                    </Group>

                    <Badge
                      mt="sm"
                      variant="light"
                      color="blue"
                      size="sm"
                    >
                      Lihat Kursus
                    </Badge>
                  </Stack>
                </Paper>
              </HoverCardTarget>

              <HoverCardDropdown>
                <Text size="sm" c="dimmed">
                  Klik untuk melihat semua kursus dalam kategori{" "}
                  <strong>{category.category_name}</strong>.
                </Text>
              </HoverCardDropdown>
            </HoverCard>
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
