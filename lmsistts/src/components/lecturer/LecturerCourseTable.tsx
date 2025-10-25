// lmsistts\src\components\lecturer\LecturerCourseTable.tsx

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
  Image,
  LoadingOverlay,
  FileInput,
  Alert,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconSend,
  IconListDetails,
  IconUsers,
  IconAlertCircle,
  IconX,
  IconClipboardList,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import sortBy from "lodash/sortBy";
import {
  lecturerCreateCourseSchema,
  lecturerUpdateCourseSchema,
} from "@/lib/schemas/course.schema";
import {
  createCourseByLecturer,
  updateCourseByLecturer,
  deleteCourseByLecturer,
  requestCoursePublish,
  cancelPublishRequest,
} from "@/app/actions/lecturer.actions";
import type { Category as CategoryType } from "@/lib/models";
import { zod4Resolver } from "mantine-form-zod-resolver";

interface LecturerCourseData {
  course_id: number;
  course_title: string | null;
  course_description: string | null;
  course_level: "Beginner" | "Intermediate" | "Advanced" | null;
  category_id: number | null;
  thumbnail_url: string | null;
  publish_status: number | null;
  publish_request_status?: "none" | "pending" | "approved" | "rejected" | null;
  rejection_reason?: string | null;
  category?: { category_name?: string | null };
}

const PAGE_SIZES = [5, 10, 20, 50, 100];

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
  const [pageSize, setPageSize] = useState(10);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<LecturerCourseData>>({ 
    columnAccessor: "course_title", 
    direction: "asc" 
  });
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<LecturerCourseData[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const [selectedCourse, setSelectedCourse] = useState<LecturerCourseData | null>(null);
  const [formModalOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [publishModalOpened, { open: openPublish, close: closePublish }] = useDisclosure(false);
  const [cancelModalOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const isEditing = !!selectedCourse;

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
    if (query) {
      data = data.filter((c) =>
        c.course_title?.toLowerCase().includes(query.toLowerCase())
      );
    }
    setTotalRecords(data.length);
    data = sortBy(data, sortStatus.columnAccessor) as LecturerCourseData[];
    if (sortStatus.direction === "desc") data.reverse();
    setRecords(data.slice((page - 1) * pageSize, page * pageSize));
  }, [initialCourses, query, sortStatus, page, pageSize]);

  const handleOpenEdit = (course: LecturerCourseData) => {
    setSelectedCourse(course);
    form.setValues({
      course_title: course.course_title ?? "",
      course_description: course.course_description ?? "",
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
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
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
          message: isEditing ? "Kursus berhasil diperbarui." : "Kursus berhasil dibuat.",
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

  const handleCancelRequest = (course: LecturerCourseData) => {
    setSelectedCourse(course);
    openCancel();
  };

  const confirmCancelRequest = () => {
    if (!selectedCourse) return;
    startTransition(async () => {
      const result = await cancelPublishRequest(selectedCourse.course_id);
      if (result.success) {
        notifications.show({
          title: "Sukses",
          message: result.success,
          color: "green",
        });
        closeCancel();
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
          <strong>{selectedCourse?.course_title}</strong>? Tindakan ini tidak dapat dibatalkan.
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
        <Stack>
          <Text size="sm">
            Anda yakin ingin mengirim permintaan publikasi untuk kursus{" "}
            <strong>{selectedCourse?.course_title}</strong> ke admin?
          </Text>
          {selectedCourse?.rejection_reason && (
            <Alert color="red" icon={<IconAlertCircle />} title="Alasan Penolakan Sebelumnya">
              {selectedCourse.rejection_reason}
            </Alert>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closePublish}>
              Batal
            </Button>
            <Button color="blue" onClick={confirmRequestPublish} loading={isPending}>
              Kirim Permintaan
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Cancel Request */}
      <Modal
        opened={cancelModalOpened}
        onClose={closeCancel}
        title="Batalkan Permintaan Publikasi"
        centered
        size="sm"
      >
        <Text size="sm">
          Anda yakin ingin membatalkan permintaan publikasi untuk kursus{" "}
          <strong>{selectedCourse?.course_title}</strong>?
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closeCancel}>
            Tidak
          </Button>
          <Button color="orange" onClick={confirmCancelRequest} loading={isPending}>
            Ya, Batalkan
          </Button>
        </Group>
      </Modal>

      {/* Filter & Pagination Controls */}
      <Group justify="space-between" mb="md">
        <Group>
          <TextInput
            placeholder="Cari judul..."
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setPage(1);
            }}
          />
          <Select
            data={PAGE_SIZES.map(size => ({ value: String(size), label: `${size} per halaman` }))}
            value={String(pageSize)}
            onChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
            w={150}
          />
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
          Buat Kursus Baru
        </Button>
      </Group>

      <DataTable<LecturerCourseData>
        idAccessor="course_id"
        records={records}
        columns={[
          { accessor: "course_title", title: "Judul", sortable: true, width: 200 },
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
          {
            accessor: "publish_request_status",
            title: "Permintaan Publish",
            render: (c) => (
              <Stack gap={4}>
                {getRequestStatusBadge(c.publish_request_status)}
                {c.publish_request_status === 'rejected' && c.rejection_reason && (
                  <Tooltip label={c.rejection_reason} multiline w={220}>
                    <Text size="xs" c="red" style={{ cursor: 'help' }}>
                      Lihat alasan
                    </Text>
                  </Tooltip>
                )}
              </Stack>
            ),
          },
          {
            accessor: "actions",
            title: "Aksi",
            textAlign: "right",
            render: (course) => (
              <Group gap="xs" justify="flex-end">
                <Tooltip label="Lihat Tugas Mahasiswa">
                  <ActionIcon
                    variant="light"
                    color="indigo"
                    onClick={() =>
                      router.push(`/lecturer/dashboard/courses/${course.course_id}/assignments`)
                    }
                  >
                    <IconClipboardList size={16} />
                  </ActionIcon>
                </Tooltip>
                
                <Tooltip label="Lihat Mahasiswa Terdaftar">
                  <ActionIcon
                    variant="light"
                    color="teal"
                    onClick={() =>
                      router.push(`/lecturer/dashboard/courses/${course.course_id}/enrollments`)
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
                      router.push(`/lecturer/dashboard/courses/${course.course_id}/materials`)
                    }
                  >
                    <IconListDetails size={16} />
                  </ActionIcon>
                </Tooltip>

                {course.publish_request_status === 'pending' ? (
                  <Tooltip label="Batalkan Permintaan">
                    <ActionIcon
                      variant="light"
                      color="orange"
                      onClick={() => handleCancelRequest(course)}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Tooltip 
                    label={
                      course.publish_status === 1 
                        ? "Kursus sudah dipublikasikan" 
                        : course.publish_request_status === 'rejected'
                        ? "Ajukan Ulang"
                        : "Minta Publikasi"
                    }
                  >
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => handleRequestPublish(course)}
                      disabled={course.publish_status === 1}
                    >
                      <IconSend size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}

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
        totalRecords={totalRecords}
        recordsPerPage={pageSize}
        page={page}
        onPageChange={setPage}
        minHeight={200}
        fetching={isPending}
        noRecordsText="Tidak ada kursus yang cocok dengan pencarian"
      />
    </Box>
  );
}