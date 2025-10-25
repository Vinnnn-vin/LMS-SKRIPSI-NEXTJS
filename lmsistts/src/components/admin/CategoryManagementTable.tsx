// lmsistts\src\components\admin\CategoryManagementTable.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import {
  Box,
  Button,
  Group,
  Modal,
  TextInput,
  Textarea,
  ActionIcon,
  Text,
  Tooltip,
  LoadingOverlay,
  Stack,
  Popover,
  PopoverTarget,
  PopoverDropdown,
  List,
  ListItem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconBook,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import sortBy from "lodash/sortBy";
import {
  createCategorySchema,
  updateCategorySchema,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/schemas/category.schema";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/admin.actions";
import { zod4Resolver } from "mantine-form-zod-resolver";

interface CategoryData {
  category_id: number;
  category_name: string | null;
  category_description: string | null;
  image_url: string | null;
  created_at?: string | null; // Opsional
  course_count?: number; // Kolom baru dari server action
  courses?: {
    course_id: number;
    course_title: string;
  }[];
}

const PAGE_SIZE = 15;

export function CategoryManagementTable({
  categories: initialCategories,
}: {
  categories: CategoryData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<
    DataTableSortStatus<CategoryData>
  >({ columnAccessor: "category_name", direction: "asc" });
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<CategoryData[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(
    null
  );
  const [
    deleteConfirmOpened,
    { open: openDeleteConfirm, close: closeDeleteConfirm },
  ] = useDisclosure(false);
  const [formModalOpened, { open: openFormModal, close: closeFormModal }] =
    useDisclosure(false);
  const isEditing = modalMode === "edit";

  const form = useForm<CreateCategoryInput | UpdateCategoryInput>({
    initialValues: {
      category_name: "",
      category_description: "",
      image_url: "",
    },
    validate: zod4Resolver(
      isEditing ? updateCategorySchema : createCategorySchema
    ),
  });

  useEffect(() => {
    let data = [...initialCategories];
    if (query)
      data = data.filter((cat) =>
        cat.category_name?.toLowerCase().includes(query.toLowerCase())
      );
    setTotalRecords(data.length);
    data = sortBy(data, sortStatus.columnAccessor) as CategoryData[];
    if (sortStatus.direction === "desc") data.reverse();
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setRecords(data.slice(from, to));
  }, [initialCategories, query, sortStatus, page]);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedCategory(null);
    form.reset();
    openFormModal();
  };

  const handleOpenEditModal = (category: CategoryData) => {
    setModalMode("edit");
    setSelectedCategory(category);
    form.setValues({
      category_name: category.category_name ?? "",
      category_description: category.category_description ?? "",
      image_url: category.image_url ?? "",
    });
    openFormModal();
  };

  const handleOpenDeleteConfirm = (category: CategoryData) => {
    setSelectedCategory(category);
    openDeleteConfirm();
  };

  const handleSubmit = (values: CreateCategoryInput | UpdateCategoryInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateCategory(
            selectedCategory!.category_id,
            values as UpdateCategoryInput
          )
        : await createCategory(values as CreateCategoryInput);

      if (result?.success) {
        notifications.show({
          title: "Sukses",
          message: result.success,
          color: "green",
        });
        closeFormModal();
        router.refresh();
      } else {
        notifications.show({
          title: "Gagal",
          message: result?.error,
          color: "red",
        });
      }
    });
  };

  const handleDelete = () => {
    if (!selectedCategory) return;
    startTransition(async () => {
      const result = await deleteCategory(selectedCategory.category_id);
      if (result?.success) {
        notifications.show({
          title: "Sukses",
          message: result.success,
          color: "teal",
        });
        closeDeleteConfirm();
        router.refresh();
      } else {
        notifications.show({
          title: "Gagal",
          message: result?.error,
          color: "red",
        });
      }
    });
  };

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isPending} overlayProps={{ blur: 2 }} />

      {/* Modal Form Create/Edit */}
      <Modal
        opened={formModalOpened}
        onClose={closeFormModal}
        title={isEditing ? "Edit Kategori" : "Tambah Kategori Baru"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nama Kategori"
              required
              {...form.getInputProps("category_name")}
            />
            <Textarea
              label="Deskripsi (Opsional)"
              {...form.getInputProps("category_description")}
            />
            <TextInput
              label="URL Gambar (Opsional)"
              type="url"
              {...form.getInputProps("image_url")}
            />
            <Button type="submit" mt="md" loading={isPending}>
              {isEditing ? "Update Kategori" : "Simpan Kategori"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Modal Konfirmasi Delete */}
      <Modal
        opened={deleteConfirmOpened}
        onClose={closeDeleteConfirm}
        title="Konfirmasi Hapus"
        centered
        size="sm"
      >
        <Text size="sm">
          Yakin ingin menghapus kategori{" "}
          <strong>{selectedCategory?.category_name}</strong>? Kursus terkait
          tidak akan dihapus, tetapi kategorinya akan hilang.
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closeDeleteConfirm}>
            Batal
          </Button>
          <Button color="red" onClick={handleDelete} loading={isPending}>
            Hapus
          </Button>
        </Group>
      </Modal>

      {/* Filter & Add Button */}
      <Group justify="space-between" mb="md">
        <TextInput
          placeholder="Cari nama kategori..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            setPage(1);
          }}
        />
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleOpenCreateModal}
        >
          Tambah Kategori
        </Button>
      </Group>

      {/* Tabel Kategori */}
      <DataTable<CategoryData>
        idAccessor="category_id"
        withTableBorder
        borderRadius="sm"
        highlightOnHover
        records={records}
        columns={[
          { accessor: "category_name", title: "Nama Kategori", sortable: true },
          {
            accessor: "category_description",
            title: "Deskripsi",
            render: (cat) => cat.category_description || "-",
          },
          // --- KOLOM JUMLAH KURSUS YANG DIPERBARUI DENGAN POPOVER ---
          {
            accessor: "course_count", // Kita sort berdasarkan kolom virtual ini
            title: "Jumlah Kursus",
            sortable: true,
            textAlign: "center",
            render: (cat) => {
              const courseCount = cat.courses?.length ?? 0;
              return (
                <Popover
                  width={300}
                  withArrow
                  shadow="md"
                  position="bottom"
                  middlewares={{ flip: true }}
                >
                  <PopoverTarget>
                    <Group
                      gap="xs"
                      justify="center"
                      style={{ cursor: "pointer" }}
                    >
                      <IconBook size={16} />
                      <Text size="sm">{courseCount}</Text>
                    </Group>
                  </PopoverTarget>
                  <PopoverDropdown>
                    {courseCount > 0 ? (
                      <Stack gap="xs">
                        <Text size="sm" fw={500}>
                          Kursus di Kategori Ini:
                        </Text>
                        <List size="xs" icon="-">
                          {cat.courses?.slice(0, 5).map(
                            (
                              course // Batasi 5 item untuk tampilan
                            ) => (
                              <ListItem key={course.course_id}>
                                {course.course_title}
                              </ListItem>
                            )
                          )}
                          {courseCount > 5 && (
                            <Text size="xs" c="dimmed">
                              ...dan {courseCount - 5} lainnya.
                            </Text>
                          )}
                        </List>
                      </Stack>
                    ) : (
                      <Text size="xs" c="dimmed">
                        Tidak ada kursus dalam kategori ini.
                      </Text>
                    )}
                  </PopoverDropdown>
                </Popover>
              );
            },
          },
          // --------------------------------------------------------
          {
            accessor: "actions",
            title: "Aksi",
            textAlign: "right",
            render: (cat) => (
              <Group gap="xs" justify="flex-end">
                <Tooltip label="Edit Kategori">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    onClick={() => handleOpenEditModal(cat)}
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Hapus Kategori">
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => handleOpenDeleteConfirm(cat)}
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
        totalRecords={
          initialCategories.filter((cat) =>
            cat.category_name?.toLowerCase().includes(query.toLowerCase())
          ).length
        }
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={(p) => setPage(p)}
        minHeight={200}
        fetching={isPending}
        noRecordsText="Tidak ada kategori yang cocok"
      />
    </Box>
  );
}
