// lmsistts\src\app\(admin)\admin\dashboard\page.tsx

import {
  Container,
  SimpleGrid,
  Paper,
  Text,
  Title,
  Group,
  ThemeIcon,
  rem,
  Alert,
} from "@mantine/core";
import {
  IconUsers,
  IconBook,
  IconCash,
  IconCertificate,
  IconAlertCircle,
} from "@tabler/icons-react";
import {
  getAdminDashboardStats,
  getMonthlySalesData,
} from "@/app/actions/admin.actions";
import { SalesChart } from "@/components/admin/SalesChart";

// Helper untuk format angka
const formatNumber = (num: number) =>
  new Intl.NumberFormat("id-ID").format(num);
const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);

export default async function AdminDashboardPage() {
  const statsResult = await getAdminDashboardStats();
  const salesDataResult = await getMonthlySalesData();

  if (!statsResult.success || !salesDataResult.success) {
    return (
      <Container py="xl">
        <Alert color="red" title="Gagal Memuat Data" icon={<IconAlertCircle />}>
          {statsResult.error || salesDataResult.error}
        </Alert>
      </Container>
    );
  }

  const stats = [
    {
      title: "Total User",
      value: formatNumber(statsResult.data.totalUsers),
      icon: IconUsers,
      color: "blue",
    },
    {
      title: "Total Kursus",
      value: formatNumber(statsResult.data.totalCourses),
      icon: IconBook,
      color: "violet",
    },
    {
      title: "Total Penjualan",
      value: formatRupiah(statsResult.data.totalSales),
      icon: IconCash,
      color: "green",
    },
    {
      title: "Total Pendaftaran",
      value: formatNumber(statsResult.data.totalEnrollments),
      icon: IconCertificate,
      color: "orange",
    },
  ];

  return (
    <Container fluid>
      <Title order={3} mb="lg">
        Overview
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
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

      <SimpleGrid cols={{ base: 1, lg: 2 }} mt="xl">
        <SalesChart data={salesDataResult.data as any[]} />
        {/* Placeholder untuk chart atau statistik lainnya */}
        <Paper withBorder p="lg" radius="md">
          <Title order={5}>Statistik Lainnya</Title>
          <Text c="dimmed" size="sm" mt="md">
            Grafik dan statistik tambahan akan ditampilkan di sini.
          </Text>
        </Paper>
      </SimpleGrid>
    </Container>
  );
}
