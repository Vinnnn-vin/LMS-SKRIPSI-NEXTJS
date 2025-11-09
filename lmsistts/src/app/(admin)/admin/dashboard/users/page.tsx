// lmsistts\src\app\(admin)\admin\dashboard\users\page.tsx

import { Container, Title, Text, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { getAllUsersForAdmin } from "@/app/actions/admin.actions";
import { UserManagementTable } from "@/components/admin/UserManagementTable";

export default async function ManageUsersPage() {
  const result = await getAllUsersForAdmin();

  return (
    <Container fluid>
      <Title order={3}>Manajemen Pengguna</Title>
      <Text c="dimmed" mb="lg">
        Lihat, edit, dan kelola semua pengguna terdaftar.
      </Text>

      {result?.success ? (
        <UserManagementTable users={result.data as any[]} />
      ) : (
        <Alert color="red" title="Gagal Memuat Data" icon={<IconAlertCircle />}>
          {result?.error}
        </Alert>
      )}
    </Container>
  );
}
