// lmsistts\src\app\(lecturer)\lecturer\dashboard\page.tsx

import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Paper,
  Group,
  ThemeIcon,
  rem,
  Alert,
  Stack,
} from "@mantine/core";
import {
  IconBook,
  IconUsers,
  IconCash,
  IconAlertCircle,
} from "@tabler/icons-react";
import { getLecturerDashboardStats } from "@/app/actions/lecturer.actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Helper untuk format angka
const formatNumber = (num: number) =>
  new Intl.NumberFormat("id-ID").format(num);
const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);

export default async function LecturerDashboardPage() {
  const session = await getServerSession(authOptions);
  const statsResult = await getLecturerDashboardStats();

  // Tampilkan pesan error jika pengambilan data gagal
  if (!statsResult.success) {
    return (
      <Container py="xl">
        <Alert color="red" title="Gagal Memuat Data" icon={<IconAlertCircle />}>
          {statsResult.error}
        </Alert>
      </Container>
    );
  }

  // Data untuk kartu statistik
  const stats = [
    {
      title: "Total Kursus Anda",
      value: formatNumber(statsResult.data.totalCourses),
      icon: IconBook,
      color: "violet",
    },
    {
      title: "Total Siswa Anda",
      value: formatNumber(statsResult.data.totalStudents),
      icon: IconUsers,
      color: "blue",
    },
    {
      title: "Total Pendapatan",
      value: formatRupiah(statsResult.data.totalSales),
      icon: IconCash,
      color: "green",
    },
  ];

  return (
    <Container fluid>
      <Stack>
        <Title order={3}>
          Selamat Datang, {session?.user?.name || "Dosen"}
        </Title>
        <Text c="dimmed">
          Berikut adalah ringkasan aktivitas mengajar Anda di platform iClick.
        </Text>
      </Stack>

      {/* Kartu Statistik */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mt="xl">
        {stats.map((stat) => (
          <Paper withBorder p="md" radius="md" key={stat.title}>
            <Group>
              <ThemeIcon
                color={stat.color}
                variant="light"
                size={60}
                radius={60}
              >
                <stat.icon
                  style={{ width: rem(32), height: rem(32) }}
                  stroke={1.5}
                />
              </ThemeIcon>
              <div>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                  {stat.title}
                </Text>
                <Text fw={700} size="xl">
                  {stat.value}
                </Text>
              </div>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Placeholder untuk fitur mendatang */}
      <Paper withBorder p="lg" radius="md" mt="xl">
        <Title order={5}>Aktivitas Terbaru</Title>
        <Text c="dimmed" size="sm" mt="md">
          (Fitur aktivitas terbaru akan segera hadir di sini...)
        </Text>
      </Paper>
    </Container>
  );
}
