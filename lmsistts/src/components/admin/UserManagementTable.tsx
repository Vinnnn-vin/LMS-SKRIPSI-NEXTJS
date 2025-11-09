// lmsistts\src\components\admin\UserManagementTable.tsx

"use client";

import { useState, useTransition, useMemo } from "react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import {
  Box,
  Button,
  Group,
  Modal,
  TextInput,
  Select,
  PasswordInput,
  ActionIcon,
  Text,
  Tooltip,
  LoadingOverlay,
  Badge,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import {
  showSuccessNotification,
  showErrorNotification,
  notifyCreate,
  notifyUpdate,
  notifyDelete,
} from "@/lib/notifications";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconKey,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import sortBy from "lodash/sortBy";
import {
  adminCreateUserSchema,
  AdminCreateUserInput,
  adminUpdateUserSchema,
  AdminUpdateUserInput,
  adminChangePasswordSchema,
  AdminChangePasswordInput,
} from "@/lib/schemas/user.schema";
import {
  createUserByAdmin,
  updateUserByAdmin,
  changeUserPasswordByAdmin,
  deleteUserByAdmin,
} from "@/app/actions/admin.actions";
import { zod4Resolver } from "mantine-form-zod-resolver";

interface UserData extends Record<string, unknown> {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: "admin" | "lecturer" | "student" | null;
  created_at: string | null;
}

const PAGE_SIZE = 15;

export function UserManagementTable({
  users: initialUsers,
}: {
  users: UserData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<UserData>>({
    columnAccessor: "created_at",
    direction: "desc",
  });
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const [createModalOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [editModalOpened, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const [passwordModalOpened, { open: openPassword, close: closePassword }] =
    useDisclosure(false);
  const [deleteModalOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

  const createForm = useForm<AdminCreateUserInput>({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "student",
      password: "",
    },
    validate: zod4Resolver(adminCreateUserSchema),
  });
  const editForm = useForm<AdminUpdateUserInput>({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "student",
    },
    validate: zod4Resolver(adminUpdateUserSchema),
  });
  const passwordForm = useForm<AdminChangePasswordInput>({
    initialValues: { new_password: "" },
    validate: zod4Resolver(adminChangePasswordSchema),
  });

  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { records, totalRecords } = useMemo(() => {
    let filteredData = initialUsers;

    if (query) {
      filteredData = filteredData.filter(
        (user) =>
          `${user.first_name || ""} ${user.last_name || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          user.email?.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (selectedRole) {
      filteredData = filteredData.filter((user) => user.role === selectedRole);
    }

    const sortedData = sortBy(filteredData, sortStatus.columnAccessor);
    if (sortStatus.direction === "desc") sortedData.reverse();

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;

    return {
      records: sortedData.slice(from, to),
      totalRecords: filteredData.length,
    };
  }, [initialUsers, query, selectedRole, sortStatus, page]);

  const handleCreate = (values: AdminCreateUserInput) => {
    startTransition(async () => {
      const result = await createUserByAdmin(values);
      if (result.success) {
        notifyCreate(`User "${values.email}"`);
        createForm.reset();
        closeCreate();
        router.refresh();
      } else {
        showErrorNotification({
          title: "Gagal Membuat User",
          message: result.error || "Email mungkin sudah terdaftar.",
        });
      }
    });
  };

  const handleEdit = (values: AdminUpdateUserInput) => {
    if (!selectedUser) return;
    startTransition(async () => {
      const result = await updateUserByAdmin(selectedUser.user_id, values);
      if (result.success) {
        notifyUpdate(`User "${values.email}"`);
        closeEdit();
        router.refresh();
      } else {
        showErrorNotification({
          title: "Gagal Memperbarui User",
          message:
            result.error || "Email mungkin sudah digunakan oleh user lain.",
        });
      }
    });
  };
  const handleChangePassword = (values: AdminChangePasswordInput) => {
    if (!selectedUser) return;
    startTransition(async () => {
      const result = await changeUserPasswordByAdmin(
        selectedUser.user_id,
        values
      );
      if (result.success) {
        showSuccessNotification({
          title: "Password Berhasil Diubah",
          message: `Password untuk ${selectedUser.email} telah diperbarui.`,
        });
        passwordForm.reset();
        closePassword();
      } else {
        showErrorNotification({
          title: "Gagal Mengubah Password",
          message: result.error || "Password harus minimal 8 karakter.",
        });
      }
    });
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    startTransition(async () => {
      const result = await deleteUserByAdmin(selectedUser.user_id);
      if (result.success) {
        notifyDelete(`User "${selectedUser.email}"`);
        closeDelete();
        router.refresh();
      } else {
        showErrorNotification({
          title: "Gagal Menghapus User",
          message: result.error || "User tidak dapat dihapus.",
        });
      }
    });
  };

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    editForm.setValues({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
      role: user.role ?? "student",
    });
    openEdit();
  };

  const openPasswordModal = (user: UserData) => {
    setSelectedUser(user);
    openPassword();
  };

  const openDeleteModal = (user: UserData) => {
    setSelectedUser(user);
    openDelete();
  };

  return (
    <Box>
      <LoadingOverlay visible={isPending} />

      <Modal
        opened={createModalOpened}
        onClose={closeCreate}
        title="Tambah User Baru"
        centered
      >
        <form onSubmit={createForm.onSubmit(handleCreate)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="user@example.com"
              required
              {...createForm.getInputProps("email")}
            />
            <TextInput
              label="Nama Depan"
              placeholder="John"
              {...createForm.getInputProps("first_name")}
            />
            <TextInput
              label="Nama Belakang"
              placeholder="Doe"
              {...createForm.getInputProps("last_name")}
            />
            <Select
              label="Role"
              data={["admin", "lecturer", "student"]}
              required
              {...createForm.getInputProps("role")}
            />
            <PasswordInput
              label="Password"
              placeholder="Min. 8 karakter"
              required
              {...createForm.getInputProps("password")}
            />
            <Button type="submit" mt="md" loading={isPending}>
              Simpan User
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={editModalOpened}
        onClose={closeEdit}
        title={`Edit User: ${selectedUser?.email}`}
        centered
      >
        <form onSubmit={editForm.onSubmit(handleEdit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="user@example.com"
              required
              {...editForm.getInputProps("email")}
            />
            <TextInput
              label="Nama Depan"
              placeholder="John"
              {...editForm.getInputProps("first_name")}
            />
            <TextInput
              label="Nama Belakang"
              placeholder="Doe"
              {...editForm.getInputProps("last_name")}
            />
            <Select
              label="Role"
              data={["admin", "lecturer", "student"]}
              required
              {...editForm.getInputProps("role")}
            />
            <Button type="submit" mt="md" loading={isPending}>
              Update User
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={passwordModalOpened}
        onClose={closePassword}
        title={`Ganti Password: ${selectedUser?.email}`}
        centered
        size="sm"
      >
        <form onSubmit={passwordForm.onSubmit(handleChangePassword)}>
          <Stack>
            <PasswordInput
              label="Password Baru"
              placeholder="Min. 8 karakter"
              required
              {...passwordForm.getInputProps("new_password")}
            />
            <Button type="submit" mt="md" loading={isPending}>
              Simpan Password
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDelete}
        title="Konfirmasi Hapus"
        centered
        size="sm"
      >
        <Text>
          Yakin ingin menghapus user <strong>{selectedUser?.email}</strong>?
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closeDelete}>
            Batal
          </Button>
          <Button color="red" onClick={handleDelete} loading={isPending}>
            Hapus
          </Button>
        </Group>
      </Modal>

      <Group justify="space-between" mb="md">
        <Group>
          <TextInput
            placeholder="Cari nama atau email..."
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          <Select
            placeholder="Filter Role"
            leftSection={<IconFilter size={16} />}
            data={[
              { value: "admin", label: "Admin" },
              { value: "lecturer", label: "Lecturer" },
              { value: "student", label: "Student" },
            ]}
            value={selectedRole}
            onChange={setSelectedRole}
            clearable
          />
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Tambah User
        </Button>
      </Group>

      <DataTable
        idAccessor="user_id"
        withTableBorder
        borderRadius="sm"
        withColumnBorders
        striped
        highlightOnHover
        records={records}
        columns={[
          { accessor: "user_id", title: "ID", sortable: true, width: 80 },
          {
            accessor: "name",
            title: "Nama User",
            sortable: true,
            render: (user) =>
              `${user.first_name || ""} ${user.last_name || ""}`.trim(),
          },
          { accessor: "email", title: "Email", sortable: true },
          {
            accessor: "role",
            title: "Role",
            sortable: true,
            render: (user) => (
              <Badge variant="light" tt="capitalize">
                {user.role}
              </Badge>
            ),
          },
          {
            accessor: "created_at",
            title: "Tgl Bergabung",
            sortable: true,
            render: (user) =>
              user.created_at
                ? new Date(user.created_at).toLocaleDateString("id-ID")
                : "-",
          },
          {
            accessor: "actions",
            title: "Aksi",
            textAlign: "right",
            render: (user) => (
              <Group gap="xs" justify="flex-end">
                <Tooltip label="Edit User">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    onClick={() => openEditModal(user)}
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Ganti Password">
                  <ActionIcon
                    variant="light"
                    color="orange"
                    onClick={() => openPasswordModal(user)}
                  >
                    <IconKey size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Hapus User">
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => openDeleteModal(user)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            ),
          },
        ]}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        totalRecords={totalRecords}
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={(p) => setPage(p)}
        minHeight={200}
        fetching={isPending}
      />
    </Box>
  );
}
