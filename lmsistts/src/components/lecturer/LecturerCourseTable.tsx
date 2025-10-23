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
  ActionIcon,
  Text,
  Tooltip,
  Badge,
  Stack,
  Switch,
  Image,
  LoadingOverlay,
  FileInput,
  Menu,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconSend,
  IconDotsVertical,
  IconFilePlus,
  IconPencilQuestion,
  IconClipboardText,
  IconListDetails,
  IconUsers,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import sortBy from "lodash/sortBy";
import {
  lecturerCreateCourseSchema,
  lecturerUpdateCourseSchema,
} from "@/lib/schemas/course.schema"; // Gunakan skema lecturer
import {
  createCourseByLecturer,
  updateCourseByLecturer,
  deleteCourseByLecturer,
  requestCoursePublish,
} from "@/app/actions/lecturer.actions"; // Gunakan actions lecturer
import type { Category as CategoryType } from "@/lib/models";
import { zod4Resolver } from "mantine-form-zod-resolver";

// Interface disesuaikan untuk Lecturer
interface LecturerCourseData {
  course_id: number;
  course_title: string | null;
  course_description: string | null; // Tambah deskripsi untuk edit
  course_level: "Beginner" | "Intermediate" | "Advanced" | null;
  category_id: number | null;
  thumbnail_url: string | null;
  publish_status: number | null;
  publish_request_status?: "none" | "pending" | "approved" | "rejected" | null; // Tambah status permintaan
  category?: { category_name?: string | null };
}

const PAGE_SIZE = 10;

export function LecturerCourseTable({
  courses: initialCourses,
  categories,
}: {
  courses: LecturerCourseData[];
  categories: CategoryType[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<
    DataTableSortStatus<LecturerCourseData>
  >({ columnAccessor: "course_title", direction: "asc" });
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<LecturerCourseData[]>([]);

  const [selectedCourse, setSelectedCourse] =
    useState<LecturerCourseData | null>(null);
  const [formModalOpened, { open: openForm, close: closeForm }] =
    useDisclosure(false);
  const [deleteModalOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [publishModalOpened, { open: openPublish, close: closePublish }] =
    useDisclosure(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const isEditing = !!selectedCourse;

  // Form disesuaikan untuk lecturer (tanpa price/publish_status)
  const form = useForm({
    initialValues: {
      course_title: "",
      course_description: "",
      course_level: "Beginner" as const,
      category_id: null as string | null,
      thumbnail_file: undefined as File | undefined,
    },
    validate: zod4Resolver(
      isEditing ? lecturerUpdateCourseSchema : lecturerCreateCourseSchema
    ),
  });

  useEffect(() => {
    let data = [...initialCourses];
    if (query)
      data = data.filter((c) =>
        c.course_title?.toLowerCase().includes(query.toLowerCase())
      );
    data = sortBy(data, sortStatus.columnAccessor) as LecturerCourseData[];
    if (sortStatus.direction === "desc") data.reverse();
    setRecords(data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
  }, [initialCourses, query, sortStatus, page]);

  const handleOpenEdit = (course: LecturerCourseData) => {
    setSelectedCourse(course);
    form.setValues({
      course_title: course.course_title ?? "",
      course_description: course.course_description ?? "", // Perlu ada di data awal atau fetch
      course_level: course.course_level ?? "Beginner",
      category_id: course.category_id ? String(course.category_id) : null,
      thumbnail_file: undefined,
    });
    setThumbnailPreview(course.thumbnail_url || null);
    openForm();
  };
  const handleOpenCreate = () => {
    setSelectedCourse(null);
    form.reset();
    setThumbnailPreview(null);
    openForm();
  };
  const handleThumbnailChange = (file: File | null) => {
    form.setFieldValue("thumbnail_file", file || undefined);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailPreview(null);
    }
  };

  const handleSubmit = (values: typeof form.values) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key !== "thumbnail_file" && value !== null && value !== undefined)
          formData.append(key, String(value));
      });
      if (values.thumbnail_file instanceof File)
        formData.append("thumbnail_file", values.thumbnail_file);
      else if (isEditing && values.thumbnail_file === null)
        formData.append("thumbnail_file", "");

      const result = isEditing
        ? await updateCourseByLecturer(selectedCourse!.course_id, formData)
        : await createCourseByLecturer(formData);

      if (result.success) {
        notifications.show({
          title: "Sukses",
          message: isEditing
            ? "Kursus berhasil diperbarui."
            : "Kursus berhasil dibuat.",
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
      const result = await deleteCourseByLecturer(selectedCourse.course_id);
      if (result.success) {
        notifications.show({
          title: "Sukses",
          message: "Kursus berhasil dihapus.",
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

  // Handler baru untuk request publish
  const handleRequestPublish = (course: LecturerCourseData) => {
    setSelectedCourse(course);
    openPublish();
  };
  const confirmRequestPublish = () => {
    if (!selectedCourse) return;
    startTransition(async () => {
      const result = await requestCoursePublish(selectedCourse.course_id);
      if (result.success) {
        notifications.show({
          title: "Sukses",
          message: result.success,
          color: "blue",
        });
        closePublish();
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

  const categoryOptions = categories.map((c) => ({
    value: String(c.category_id),
    label: c.category_name || "Tanpa Nama",
  }));

  // Fungsi helper untuk status permintaan
  const getRequestStatusBadge = (
    status: LecturerCourseData["publish_request_status"]
  ) => {
    switch (status) {
      case "pending":
        return (
          <Badge color="yellow" variant="light">
            Menunggu Persetujuan
          </Badge>
        );
      case "approved":
        return (
          <Badge color="green" variant="light">
            Disetujui
          </Badge>
        );
      case "rejected":
        return (
          <Badge color="red" variant="light">
            Ditolak
          </Badge>
        );
      default:
        return (
          <Badge color="gray" variant="light">
            Belum Diajukan
          </Badge>
        );
    }
  };

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isPending} />
      {/* Modal Form Create/Edit */}
      <Modal
        opened={formModalOpened}
        onClose={closeForm}
        title={isEditing ? "Edit Kursus" : "Tambah Kursus Baru"}
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {/* Field form: Judul, Deskripsi, Level, Kategori, Thumbnail */}
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
                data={categoryOptions}
                {...form.getInputProps("category_id")}
                required
                clearable
              />
            </Group>
            <FileInput
              label="Thumbnail"
              accept="image/*"
              onChange={handleThumbnailChange}
              clearable
            />
            {thumbnailPreview && (
              <Image src={thumbnailPreview} maw={200} mt="xs" />
            )}
            <Button type="submit" mt="md" loading={isPending}>
              {isEditing ? "Update Kursus" : "Simpan Draft"}
            </Button>
          </Stack>
        </form>
      </Modal>
      {/* Modal Delete */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDelete}
        title="Konfirmasi Hapus"
        centered
        size="sm"
      >
        <Text size="sm">
          Anda yakin ingin menghapus kursus{" "}
          <strong>{selectedCourse?.course_title}</strong>? Tindakan ini tidak
          dapat dibatalkan.
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
      {/* Modal Request Publish */}
      <Modal
        opened={publishModalOpened}
        onClose={closePublish}
        title="Minta Publikasi Kursus"
        centered
        size="sm"
      >
        <Text size="sm">
          Anda yakin ingin mengirim permintaan publikasi untuk kursus{" "}
          <strong>{selectedCourse?.course_title}</strong> ke admin?
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closePublish}>
            Batal
          </Button>
          <Button
            color="blue"
            onClick={confirmRequestPublish}
            loading={isPending}
          >
            Kirim Permintaan
          </Button>
        </Group>
      </Modal>

      {/* Filter & Add Button */}
      <Group justify="space-between" mb="md">
        <TextInput
          placeholder="Cari judul..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
        <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
          Buat Kursus Baru
        </Button>
      </Group>

      <DataTable<LecturerCourseData>
        idAccessor="course_id"
        records={records}
        columns={[
          { accessor: "course_title", title: "Judul", sortable: true },
          {
            accessor: "category.category_name",
            title: "Kategori",
            sortable: true,
          },
          {
            accessor: "publish_status",
            title: "Status",
            render: (c) => (
              <Badge color={c.publish_status === 1 ? "green" : "gray"}>
                {c.publish_status === 1 ? "Published" : "Draft"}
              </Badge>
            ),
          },
          // --- Kolom Baru: Status Permintaan ---
          {
            accessor: "publish_request_status",
            title: "Permintaan Publish",
            render: (c) => getRequestStatusBadge(c.publish_request_status),
          },
          {
            accessor: "actions",
            title: "Aksi",
            textAlign: "right",
            render: (course) => (
              <Group gap="xs" justify="flex-end">
                {/* TOMBOL BARU: Lihat Mahasiswa */}
                <Tooltip label="Lihat Mahasiswa Terdaftar">
                  <ActionIcon
                    variant="light"
                    color="teal"
                    onClick={() =>
                      router.push(
                        `/lecturer/dashboard/courses/${course.course_id}/enrollments`
                      )
                    }
                  >
                    <IconUsers size={16} />
                  </ActionIcon>
                </Tooltip>

                <Tooltip label="Kelola Materi/Konten">
                  <ActionIcon
                    variant="light"
                    color="cyan"
                    onClick={() =>
                      router.push(
                        `/lecturer/dashboard/courses/${course.course_id}/materials`
                      )
                    }
                  >
                    <IconListDetails size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Minta Publikasi">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    onClick={() => handleRequestPublish(course)}
                    disabled={course.publish_request_status === "pending" || course.publish_status === 1}
                  >
                    <IconSend size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Edit Kursus">
                  <ActionIcon
                    variant="light"
                    color="yellow"
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
        totalRecords={initialCourses.length}
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
        minHeight={200}
        fetching={isPending}
      />
    </Box>
  );
}
