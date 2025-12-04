// src/app/(admin)/admin/dashboard/transactions/page.tsx

import { getPendingPaymentsForAdmin } from "@/app/actions/admin.actions";
import {
  Container,
  Title,
  Paper,
  Text,
  Badge,
  Group,
  Stack,
  Alert,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import PendingTransactionTable from "@/components/admin/PendingTransactionTable"; // Kita buat komponen terpisah agar rapi

export const dynamic = "force-dynamic"; // Agar data selalu fresh

export default async function AdminTransactionsPage() {
  const { success, data, error } = await getPendingPaymentsForAdmin();

  const pendingPayments = success && data ? data : [];

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        <div>
          <Title order={2}>Verifikasi Pembayaran</Title>
          <Text c="dimmed">
            Konfirmasi pembayaran manual dari siswa untuk mengaktifkan akses kursus.
          </Text>
        </div>

        {error && (
          <Alert color="red" title="Error" icon={<IconInfoCircle />}>
            {error}
          </Alert>
        )}

        <Paper withBorder p="md" radius="md">
          {pendingPayments.length === 0 ? (
            <Text ta="center" py="xl" c="dimmed">
              Tidak ada pembayaran yang menunggu konfirmasi saat ini.
            </Text>
          ) : (
            <PendingTransactionTable payments={pendingPayments} />
          )}
        </Paper>
      </Stack>
    </Container>
  );
}