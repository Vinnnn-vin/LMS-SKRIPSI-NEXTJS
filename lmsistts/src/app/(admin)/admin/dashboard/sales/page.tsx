// lmsistts\src\app\(admin)\admin\dashboard\sales\page.tsx
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
  Stack,
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
  getAllPaymentsForAdmin,
  getCourseSalesStats,
  getFinancialTrendData,
  getMonthlySalesData,
} from "@/app/actions/admin.actions"; // Impor kedua fungsi
import { SalesManagementTable } from "@/components/admin/SalesManagementTable";
import { CoursePopularityChart } from "@/components/admin/CoursePopularityChart"; // Impor chart baru

import { SalesChart } from "@/components/admin/SalesChart";
import { FinancialTrendChart } from "@/components/admin/FinancialTrendChart"; // Impor chart baru

export default async function ManageSalesPage() {
  // Ambil data secara paralel
  const [
    paymentsResult,
    courseStatsResult,
    statsResult,
    salesDataResult,
    trendDataResult,
  ] = await Promise.all([
    getAllPaymentsForAdmin(), // Pertimbangkan filter default jika perlu
    getCourseSalesStats(),
    getAdminDashboardStats(),
    getMonthlySalesData(),
    getFinancialTrendData(),
  ]);

  const hasError =
    !paymentsResult.success ||
    !courseStatsResult.success ||
    !statsResult.success ||
    !salesDataResult.success ||
    !trendDataResult.success;
  const errorMessage =
    paymentsResult.error ||
    courseStatsResult.error ||
    statsResult.error ||
    salesDataResult.error ||
    trendDataResult.error;

  if (hasError) {
    return (
      <Container py="xl">
        <Alert
          color="red"
          title="Gagal Memuat Data Dashboard"
          icon={<IconAlertCircle />}
        >
          {errorMessage}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Title order={3} mb="lg">
        Manajemen Penjualan
      </Title>

      {hasError ? (
        <Alert color="red" title="Gagal Memuat Data" icon={<IconAlertCircle />}>
          {errorMessage || "Tidak dapat mengambil data penjualan."}
        </Alert>
      ) : (
        <Stack gap="xl">
          {/* Tabel Penjualan */}
          <div>
            <Title order={4} mb="sm">
              Detail Transaksi
            </Title>
            <SalesManagementTable payments={paymentsResult.data as any[]} />
          </div>
          {/* Chart Baru: Pergerakan Keuangan */}
          <FinancialTrendChart data={trendDataResult.data as any[]} />

          {/* Chart yang sudah ada */}
          <SimpleGrid cols={{ base: 1, lg: 2 }}>
            <SalesChart data={salesDataResult.data as any[]} />
            <CoursePopularityChart data={courseStatsResult.data as any[]} />
          </SimpleGrid>
        </Stack>
      )}
    </Container>
  );
}
