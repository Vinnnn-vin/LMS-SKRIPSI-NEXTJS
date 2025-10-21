import {
  Container,
  Title,
  Text,
  Alert,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import {
  getAdminDashboardStats,
  getAllPaymentsForAdmin,
  getCourseSalesStats,
  getFinancialTrendData,
  getMonthlySalesData,
} from "@/app/actions/admin.actions"; // Impor kedua fungsi
import { SalesManagementTable } from "@/components/admin/SalesManagementTable";
import { CoursePopularityChart } from "@/components/admin/CoursePopularityChart"; // Impor chart baru
import { FinancialTrendChart } from "@/components/admin/FinancialTrendChart";
import { SalesChart } from "@/components/admin/SalesChart";

const formatNumber = (num: number) =>
  new Intl.NumberFormat("id-ID").format(num);
const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);

export default async function ManageSalesPage() {
  // Ambil data secara paralel
  const [paymentsResult, courseStatsResult, salesDataResult, trendDataResult] =
    await Promise.all([
      getAllPaymentsForAdmin(), // Pertimbangkan filter default jika perlu
      getCourseSalesStats(),
      getAdminDashboardStats(),
      getMonthlySalesData(),
      getFinancialTrendData(),
      getCourseSalesStats(),
    ]);

  const hasError = !paymentsResult.success || !courseStatsResult.success;
  const errorMessage = paymentsResult.error || courseStatsResult.error;

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

          {/* Chart Kursus Terlaris */}
          <CoursePopularityChart data={courseStatsResult.data as any[]} />
        </Stack>
      )}

      <Stack mt="xl" gap="xl">
        {/* Chart Baru: Pergerakan Keuangan */}
        <FinancialTrendChart data={trendDataResult.data as any[]} />

        {/* Chart yang sudah ada */}
        <SimpleGrid cols={{ base: 1, lg: 2 }}>
          {/* <SalesChart data={salesDataResult.data as any[]} /> */}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
