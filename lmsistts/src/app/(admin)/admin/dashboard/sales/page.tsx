// lmsistts\src\app\(admin)\admin\dashboard\sales\page.tsx

import { Container, SimpleGrid, Title, Alert, Stack } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import {
  getAdminDashboardStats,
  getAllPaymentsForAdmin,
  getCourseSalesStats,
  getFinancialTrendData,
  getMonthlySalesData,
} from "@/app/actions/admin.actions";
import { SalesManagementTable } from "@/components/admin/SalesManagementTable";
import { CoursePopularityChart } from "@/components/admin/CoursePopularityChart";

import { SalesChart } from "@/components/admin/SalesChart";
import { FinancialTrendChart } from "@/components/admin/FinancialTrendChart";

export default async function ManageSalesPage() {
  const [
    paymentsResult,
    courseStatsResult,
    statsResult,
    salesDataResult,
    trendDataResult,
  ] = await Promise.all([
    getAllPaymentsForAdmin(),
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
          <div>
            <Title order={4} mb="sm">
              Detail Transaksi
            </Title>
            <SalesManagementTable payments={paymentsResult.data as any[]} />
          </div>
          <FinancialTrendChart data={trendDataResult.data as any[]} />

          <SimpleGrid cols={{ base: 1, lg: 2 }}>
            <SalesChart data={salesDataResult.data as any[]} />
            <CoursePopularityChart data={courseStatsResult.data as any[]} />
          </SimpleGrid>
        </Stack>
      )}
    </Container>
  );
}
