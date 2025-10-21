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
  Select,
  NumberInput,
  ActionIcon,
  Text,
  Tooltip,
  Badge,
  Stack,
  Switch,
  Image,
  LoadingOverlay,
  FileInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import sortBy from "lodash/sortBy";

import {
  createCourseSchema,
  updateCourseSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
} from "@/lib/schemas/course.schema";

import {
  getCourseByIdForAdmin,
  createCourseByAdmin,
  updateCourseByAdmin,
  deleteCourseByAdmin,
} from "@/app/actions/admin.actions";

import type { CategoryAttributes } from "@/lib/models/Category";
import { zod4Resolver } from "mantine-form-zod-resolver";

/* 🔹 Hapus interface manual & gunakan Zod sebagai sumber kebenaran */
type CourseData = UpdateCourseInput & {
  course_id: number;
  course_title: string | null;
  thumbnail_url?: string | null;
  lecturer?: { first_name?: string | null; last_name?: string | null };
  category?: { category_name?: string | null };
};

const PAGE_SIZE = 10;

export function CourseManagementTable({
  courses: initialCourses,
  categories,
  lecturers,
}: {
  courses: CourseData[];
  categories: CategoryAttributes[];
  lecturers: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<CourseData>>(
    {
      columnAccessor: "course_title",
      direction: "asc",
    }
  );
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<CourseData[]>([]);
  const [totalRecords, setTotalRecords] = useState(initialCourses.length);

  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [formModalOpened, { open: openForm, close: closeForm }] =
    useDisclosure(false);
  const [deleteModalOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const isEditing = !!selectedCourse;

  /* 🔹 Gunakan zod4Resolver sesuai mode edit/create */
  const form = useForm<CreateCourseInput | UpdateCourseInput>({
    initialValues: {
      course_title: "",
      course_description: "",
      course_level: "Beginner",
      category_id: null,
      user_id: null,
      course_price: 0,
      course_duration: 0,
      publish_status: 0,
      thumbnail_file: undefined,
    },
    validate: zod4Resolver(isEditing ? updateCourseSchema : createCourseSchema),
  });

  useEffect(() => {
    let data = [...initialCourses];
    if (query) {
      data = data.filter((course) =>
        course.course_title?.toLowerCase().includes(query.toLowerCase())
      );
    }
    setTotalRecords(data.length);
    data = sortBy(data, sortStatus.columnAccessor);
    if (sortStatus.direction === "desc") {
      data.reverse();
    }
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setRecords(data.slice(from, to));
  }, [initialCourses, query, sortStatus, page]);

  const lecturerOptions = lecturers.map((l) => ({
    value: String(l.user_id),
    label: `${l.first_name || ""} ${l.last_name || ""}`.trim() || l.email,
  }));

  const categoryOptions = categories.map((c) => ({
    value: String(c.category_id),
    label: c.category_name || "Tanpa Nama",
  }));

  const handleOpenEdit = async (course: CourseData) => {
    setIsFetchingDetails(true);
    setSelectedCourse(course);
    const detailsResult = await getCourseByIdForAdmin(course.course_id);
    setIsFetchingDetails(false);

    if (detailsResult.success && detailsResult.data) {
      const courseDetails = detailsResult.data;

      form.setValues({
        course_title: courseDetails.course_title ?? "",
        course_description: courseDetails.course_description ?? "",
        course_level: courseDetails.course_level ?? "Beginner",
        category_id: form.values.category_id
          ? Number(form.values.category_id)
          : null,
        user_id: form.values.user_id ? Number(form.values.user_id) : null,
        course_price: courseDetails.course_price ?? 0,
        course_duration: courseDetails.course_duration ?? 0,
        publish_status: form.values.publish_status as 0 | 1,
        thumbnail_file: undefined,
      });

      form.setInitialValues(form.values);
      setThumbnailPreview(courseDetails.thumbnail_url || null);
      openForm();
    } else {
      notifications.show({
        title: "Error",
        message: "Gagal mengambil detail kursus.",
        color: "red",
      });
    }
  };

  const handleOpenCreate = () => {
    setSelectedCourse(null);
    form.reset();
    setThumbnailPreview(null);
    openForm();
  };

  const handleThumbnailChange = (file: File | null) => {
    form.setFieldValue("thumbnail_file", file ?? undefined);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setThumbnailPreview(selectedCourse?.thumbnail_url || null);
    }
  };

  const handleSubmit = (values: typeof form.values) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key !== "thumbnail_file" && value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      const fileInput = values.thumbnail_file;
      if (fileInput instanceof File) {
        formData.append("thumbnail_file", fileInput);
      } else if (
        isEditing &&
        fileInput === null &&
        thumbnailPreview !== selectedCourse?.thumbnail_url
      ) {
        formData.append("thumbnail_file", "");
      }

      const result = isEditing
        ? await updateCourseByAdmin(selectedCourse!.course_id, formData)
        : await createCourseByAdmin(formData);

      if (result.success) {
        notifications.show({
          title: "Sukses",
          message: result.success,
          color: "green",
        });
        closeForm();
        router.refresh();
      } else {
        notifications.show({
          title: "Gagal",
          message: result.error,
          color: "red",
        });
      }
    });
  };

  const handleDelete = () => {
    if (!selectedCourse) return;
    startTransition(async () => {
      const result = await deleteCourseByAdmin(selectedCourse.course_id);
      if (result.success) {
        notifications.show({
          title: "Sukses",
          message: result.success,
          color: "green",
        });
        closeDelete();
        router.refresh();
      } else {
        notifications.show({
          title: "Gagal",
          message: result.error,
          color: "red",
        });
      }
    });
  };

  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={isPending || isFetchingDetails}
        overlayProps={{ blur: 2 }}
      />
      <Modal
        opened={formModalOpened}
        onClose={closeForm}
        title={isEditing ? `Edit Kursus` : "Tambah Kursus Baru"}
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Judul Kursus"
              required
              {...form.getInputProps("course_title")}
            />
            <Textarea
              label="Deskripsi"
              minRows={3}
              {...form.getInputProps("course_description")}
            />
            <Group grow>
              <Select
                label="Level"
                data={["Beginner", "Intermediate", "Advanced"]}
                {...form.getInputProps("course_level")}
              />
              <Select
                label="Kategori"
                placeholder="Pilih kategori"
                data={categoryOptions}
                {...form.getInputProps("category_id")}
                clearable
                required
              />
            </Group>
            <Select
              label="Dosen/Lecturer"
              placeholder="Pilih dosen pengajar"
              data={lecturerOptions}
              value={form.values.user_id ? String(form.values.user_id) : null}
              onChange={(val) =>
                form.setFieldValue("user_id", val ? Number(val) : null)
              }
              searchable
              required
              description="Pilih dosen yang akan mengajar kursus ini"
            />
            <NumberInput
              label="Harga"
              required
              min={0}
              {...form.getInputProps("course_price")}
            />
            <FileInput
              label="Thumbnail Kursus"
              placeholder="Pilih gambar (.jpg, .png, .webp)"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleThumbnailChange}
              clearable
              description="Ukuran maks 5MB"
            />
            {thumbnailPreview && (
              <Image
                src={thumbnailPreview}
                maw={200}
                mt="xs"
                alt="Thumbnail Preview"
              />
            )}
            <Switch
              label="Publikasikan Kursus"
              description="Jika aktif, kursus tampil. Harga harus > 0."
              checked={form.values.publish_status === 1}
              onChange={(e) =>
                form.setFieldValue(
                  "publish_status",
                  e.currentTarget.checked ? 1 : 0
                )
              }
              onLabel="ON"
              offLabel="OFF"
            />

            <Button type="submit" mt="md" loading={isPending}>
              {isEditing ? "Update Kursus" : "Simpan Kursus"}
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
          Yakin ingin menghapus kursus{" "}
          <strong>{selectedCourse?.course_title}</strong>?
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
        <TextInput
          placeholder="Cari judul kursus..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            setPage(1);
          }}
        />
        <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
          Tambah Kursus
        </Button>
      </Group>

      <DataTable<CourseData>
        idAccessor="course_id"
        withTableBorder
        borderRadius="sm"
        highlightOnHover
        records={records}
        columns={[
          {
            accessor: "course_title",
            title: "Judul Kursus",
            sortable: true,
            width: 250,
          },
          {
            accessor: "lecturer.name",
            title: "Dosen",
            sortable: true,
            render: (c) =>
              `${c.lecturer?.first_name || ""} ${c.lecturer?.last_name || ""}`.trim() ||
              "N/A",
          },
          {
            accessor: "category.category_name",
            title: "Kategori",
            sortable: true,
            render: (c) => c.category?.category_name || "-",
          },
          {
            accessor: "course_level",
            title: "Level",
            sortable: true,
            render: (c) => c.course_level || "-",
          },
          {
            accessor: "publish_status",
            title: "Status",
            sortable: true,
            render: (c) => (
              <Badge color={c.publish_status ? "green" : "gray"}>
                {c.publish_status ? "Published" : "Draft"}
              </Badge>
            ),
          },
          {
            accessor: "course_price",
            title: "Harga",
            sortable: true,
            render: (c) =>
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(c.course_price ?? 0),
          },
          {
            accessor: "actions",
            title: "Aksi",
            textAlign: "right",
            render: (course) => (
              <Group gap="xs" justify="flex-end">
                <Tooltip label="Edit Kursus">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    onClick={() => handleOpenEdit(course)}
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Hapus Kursus">
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => {
                      setSelectedCourse(course);
                      openDelete();
                    }}
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
        fetching={isPending || isFetchingDetails}
        noRecordsText="Tidak ada kursus yang cocok dengan pencarian"
      />
    </Box>
  );
}
