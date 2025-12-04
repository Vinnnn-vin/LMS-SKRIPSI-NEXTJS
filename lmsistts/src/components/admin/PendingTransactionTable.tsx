// lmsistts\src\components\admin\PendingTransactionTable.tsx
"use client";

import {
  Table,
  Button,
  Badge,
  Group,
  Text,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconX, IconEye } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import {
  confirmPaymentManual,
  rejectPaymentManual,
} from "@/app/actions/admin.actions";
import { use, useState } from "react";
import { useRouter } from "next/navigation";

interface PaymentItem {
  payment_id: number;
  gateway_external_id: string; // Invoice ID
  amount: number;
  created_at: string | Date;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  course?: {
    course_title: string;
  };
}

export default function PendingTransactionTable({
  payments,
}: {
  payments: PaymentItem[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleConfirm = async (id: number) => {
    if (
      !confirm(
        "Apakah Anda yakin uang sudah masuk? Kursus akan langsung aktif."
      )
    )
      return;

    setLoadingId(id);
    const res = await confirmPaymentManual(id);
    setLoadingId(null);

    if (res.success) {
      notifications.show({
        title: "Berhasil",
        message: res.success,
        color: "green",
      });
      router.refresh(); // Refresh halaman untuk update tabel
    } else {
      notifications.show({
        title: "Gagal",
        message: res.error,
        color: "red",
      });
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Batalkan invoice ini?")) return;

    setLoadingId(id);
    const res = await rejectPaymentManual(id);
    setLoadingId(null);

    if (res.success) {
      notifications.show({
        title: "Dibatalkan",
        message: res.success,
        color: "orange",
      });
      router.refresh();
    } else {
      notifications.show({
        title: "Error",
        message: res.error,
        color: "red",
      });
    }
  };

  const rows = payments.map((item) => (
    <Table.Tr key={item.payment_id}>
      <Table.Td>
        <Text size="sm" fw={500}>
          {item.gateway_external_id}
        </Text>
        <Text size="xs" c="dimmed">
          {new Date(item.created_at).toLocaleString("id-ID")}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>
          {item.user?.first_name} {item.user?.last_name}
        </Text>
        <Text size="xs" c="dimmed">
          {item.user?.email}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" lineClamp={1}>
          {item.course?.course_title}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color="blue" size="lg">
          {formatCurrency(item.amount)}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Konfirmasi Lunas (Aktifkan)">
            <Button
              size="xs"
              color="green"
              leftSection={<IconCheck size={14} />}
              loading={loadingId === item.payment_id}
              onClick={() => handleConfirm(item.payment_id)}
            >
              Terima
            </Button>
          </Tooltip>

          <Tooltip label="Batalkan Invoice">
            <ActionIcon
              variant="light"
              color="red"
              size="input-xs"
              loading={loadingId === item.payment_id}
              onClick={() => handleReject(item.payment_id)}
            >
              <IconX size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Invoice ID / Tanggal</Table.Th>
            <Table.Th>Siswa</Table.Th>
            <Table.Th>Kursus</Table.Th>
            <Table.Th>Nominal</Table.Th>
            <Table.Th>Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
