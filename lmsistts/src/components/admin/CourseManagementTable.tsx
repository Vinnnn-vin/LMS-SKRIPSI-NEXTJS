// lmsistts\src\components\admin\CourseManagementTable.tsx

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
  Alert,
  Paper,
  Divider,
  Title,
  Accordion,
  AccordionItem,
  AccordionControl,
  AccordionPanel,
  List,
  ThemeIcon,
  ListItem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconChecks,
  IconX,
  IconEye,
  IconAlertCircle,
  IconQuestionMark,
  IconVideo,
  IconFileText,
  IconLink,
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
  approveCoursePublish,
  rejectCoursePublish,
} from "@/app/actions/admin.actions";

import type { CategoryAttributes } from "@/lib/models/Category";
import { zod4Resolver } from "mantine-form-zod-resolver";

type CourseData = UpdateCourseInput & {
  course_id: number;
  course_title: string | null;
  thumbnail_url?: string | null;
  lecturer?: { first_name?: string | null; last_name?: string | null };
  category?: { category_name?: string | null };
  publish_request_status?: "none" | "pending" | "approved" | "rejected" | null;
};

const PAGE_SIZE = 10;

const getMaterialIcon = (type: number) => {
    switch (type) {
        case 1: return <IconVideo size={16} />;
        case 2: return <IconFileText size={16} />;
        case 3: return <IconLink size={16} />;
        case 4: return <IconFileText size={16} />; // Tugas
        case 5: return <IconQuestionMark size={16}/>; // Jika Quiz dianggap tipe konten
        default: return null;
    }
};

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

  const [selectedCourseForApproval, setSelectedCourseForApproval] =
    useState<CourseData | null>(null);
  const [
    approvalModalOpened,
    { open: openApprovalModal, close: closeApprovalModal },
  ] = useDisclosure(false);
  const [approvalPrice, setApprovalPrice] = useState<number | "">(""); // State harga di modal
  const [approvalError, setApprovalError] = useState<string | null>(null); // State error di modal

  const [approvalCourseDetails, setApprovalCourseDetails] = useState<any>(null);

  const form = useForm<CreateCourseInput | UpdateCourseInput>({
    initialValues: {
      course_title: "",
      course_description: "",
      course_level: "Beginner",
      category_id: null,
      user_id: null,
      course_price: 0,
      course_duration: 0,
      publish_status: null,
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
      const priceValue =
        typeof courseDetails.course_price === "number"
          ? courseDetails.course_price
          : 0;

      // Set values: Konversi ID ke string untuk Select
      form.setValues({
        course_title: courseDetails.course_title ?? "",
        course_description: courseDetails.course_description ?? "",
        course_level: courseDetails.course_level ?? "Beginner",
        // Konversi number dari DB ke string untuk Select
        category_id: courseDetails.category_id
          ? String(courseDetails.category_id)
          : null, // String | null
        user_id: courseDetails.user_id ? String(courseDetails.user_id) : null, // String | null
        course_price: priceValue,
        course_duration: courseDetails.course_duration ?? 0,
        publish_status: courseDetails.publish_status === 1 ? 1 : 0,
        thumbnail_file: undefined, // Reset file input
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

  const handleOpenApprovalModal = async (course: CourseData) => {
    setSelectedCourseForApproval(course);
    setApprovalPrice(course.course_price ?? ""); // Set harga awal (jika ada)
    setApprovalError(null);
    setApprovalCourseDetails(null); // Reset detail kurikulum
    openApprovalModal();

    setIsFetchingDetails(true); // Aktifkan loading overlay modal
    try {
      const detailsResult = await getCourseByIdForAdmin(course.course_id); // Panggil action yang sudah diupdate
      if (detailsResult.success && detailsResult.data) {
        setApprovalCourseDetails(detailsResult.data); // Simpan detail lengkap ke state baru
        // Set harga lagi dari data terbaru (jika ada perubahan)
        setApprovalPrice(detailsResult.data.course_price ?? "");
      } else {
        setApprovalError(
          detailsResult.error || "Gagal memuat detail kurikulum."
        );
      }
    } catch (error: any) {
      setApprovalError(
        error.message || "Terjadi kesalahan saat memuat detail."
      );
    } finally {
      setIsFetchingDetails(false); // Matikan loading overlay modal
    }
  };

  const handleApprove = () => {
    if (
      !selectedCourseForApproval ||
      approvalPrice === "" ||
      approvalPrice <= 0
    ) {
      setApprovalError("Harga harus diisi dan lebih besar dari 0.");
      return;
    }
    setApprovalError(null); // Clear error

    startTransition(async () => {
      const result = await approveCoursePublish(
        selectedCourseForApproval.course_id,
        Number(approvalPrice)
      );
      if (result.success) {
        notifications.show({
          title: "Sukses",
          message: result.message,
          color: "green",
        });
        closeApprovalModal();
        router.refresh(); // Refresh data tabel
      } else {
        setApprovalError(result.error || "Gagal menyetujui."); // Tampilkan error di modal
        notifications.show({
          title: "Gagal",
          message: result.error,
          color: "red",
        });
      }
    });
  };

  const handleReject = () => {
    if (!selectedCourseForApproval) return;
    setApprovalError(null); // Clear error

    startTransition(async () => {
      const result = await rejectCoursePublish(
        selectedCourseForApproval.course_id
      );
      if (result.success) {
        notifications.show({
          title: "Info",
          message: result.message,
          color: "blue",
        });
        closeApprovalModal();
        router.refresh(); // Refresh data tabel
      } else {
        setApprovalError(result.error || "Gagal menolak."); // Tampilkan error di modal
        notifications.show({
          title: "Gagal",
          message: result.error,
          color: "red",
        });
      }
    });
  };

  // --- Fungsi Helper Badge Status (Diperbarui) ---
  const getStatusBadge = (course: CourseData) => {
    if (course.publish_status === 1) {
      return <Badge color="green">Published</Badge>;
    }
    // Jika belum published, cek status permintaan
    switch (course.publish_request_status) {
      case "pending":
        return (
          <Badge color="yellow" variant="light">
            Menunggu Persetujuan
          </Badge>
        ); // [cite: 1913-1914]
      case "rejected":
        return (
          <Badge color="red" variant="light">
            Ditolak
          </Badge>
        ); // [cite: 1914-1915]
      default: // 'none' atau null
        return <Badge color="gray">Draft</Badge>; // [cite: 1915-1916]
    }
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
              readOnly={isEditing}
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

      <Modal
        opened={approvalModalOpened}
        onClose={closeApprovalModal}
        title={`Review Permintaan: ${selectedCourseForApproval?.course_title}`}
        centered
        size="xl"
        overlayProps={{ blur: 1 }}
      >
        {/* Loading overlay spesifik untuk modal */}
        <LoadingOverlay visible={isFetchingDetails} />
        <Stack gap="lg">
          {/* Tampilkan error fetch detail */}
          {approvalError && !isFetchingDetails && (
            <Alert
              color="red"
              icon={<IconAlertCircle size={16} />}
              title="Error Memuat Detail"
            >
              {approvalError}
            </Alert>
          )}

          {/* Tampilkan detail jika sudah loaded */}
          {approvalCourseDetails && !isFetchingDetails && (
            <>
              {/* Info Dasar */}
              <Paper withBorder p="md" radius="sm">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">
                      Judul Kursus:
                    </Text>
                    <Text fw={500}>{approvalCourseDetails.course_title}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">
                      Dosen:
                    </Text>
                    <Text fw={500}>
                      {`${approvalCourseDetails.lecturer?.first_name || ""} ${approvalCourseDetails.lecturer?.last_name || ""}`.trim() ||
                        "N/A"}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">
                      Kategori:
                    </Text>
                    <Text fw={500}>
                      {approvalCourseDetails.category?.category_name || "-"}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">
                      Level:
                    </Text>
                    <Text fw={500}>
                      {approvalCourseDetails.course_level || "-"}
                    </Text>
                  </div>
                </Group>
                <Divider my="sm" />
                <Text size="sm" c="dimmed">
                  Deskripsi:
                </Text>
                <Text size="sm">
                  {approvalCourseDetails.course_description || "-"}
                </Text>
              </Paper>

              {/* Kurikulum */}
              <Box>
                <Title order={5} mb="sm">
                  Review Kurikulum
                </Title>
                <Accordion variant="separated" /* defaultValue={optional} */>
                  {approvalCourseDetails.materials &&
                  approvalCourseDetails.materials.length > 0 ? (
                    approvalCourseDetails.materials.map((material: any) => (
                      <AccordionItem
                        key={material.material_id}
                        value={String(material.material_id)}
                      >
                        <AccordionControl>
                          {material.material_name || "Bab Tanpa Judul"}
                        </AccordionControl>
                        <AccordionPanel>
                          <Stack gap="sm">
                            {" "}
                            {/* Gunakan Stack untuk grouping */}
                            {/* Daftar Konten (Material Detail) */}
                            {material.details && material.details.length > 0 ? (
                              <>
                                {/* <Text size="xs" fw={500} c="dimmed">Konten:</Text> */}
                                <List
                                  spacing="xs"
                                  size="sm"
                                  center
                                  icon={
                                    <ThemeIcon
                                      size={16}
                                      radius="xl"
                                      variant="light"
                                      color="gray"
                                    >
                                      -
                                    </ThemeIcon>
                                  }
                                >
                                  {material.details.map((detail: any) => (
                                    <ListItem
                                      key={detail.material_detail_id}
                                      icon={
                                        <ThemeIcon
                                          size={20}
                                          radius="xl"
                                          variant="light"
                                        >
                                          {getMaterialIcon(
                                            detail.material_detail_type
                                          )}
                                        </ThemeIcon>
                                      }
                                    >
                                      {detail.material_detail_name ||
                                        "Konten Tanpa Judul"}
                                    </ListItem>
                                  ))}
                                </List>
                              </>
                            ) : (
                              <Text size="xs" c="dimmed">
                                Belum ada konten (materi/tugas) di bab ini.
                              </Text>
                            )}
                            {/* Pemisah jika ada konten dan quiz */}
                            {material.details?.length > 0 &&
                              material.quizzes?.length > 0 && (
                                <Divider my="xs" />
                              )}
                            {/* Daftar Quiz */}
                            {material.quizzes && material.quizzes.length > 0 ? (
                              <>
                                {/* <Text size="xs" fw={500} c="dimmed" mt="xs">Quiz:</Text> */}
                                <List
                                  spacing="xs"
                                  size="sm"
                                  center
                                  icon={
                                    <ThemeIcon
                                      size={16}
                                      radius="xl"
                                      variant="light"
                                      color="gray"
                                    >
                                      -
                                    </ThemeIcon>
                                  }
                                >
                                  {material.quizzes.map((quiz: any) => (
                                    <ListItem
                                      key={quiz.quiz_id}
                                      icon={
                                        <ThemeIcon
                                          size={20}
                                          radius="xl"
                                          variant="light"
                                          color="orange"
                                        >
                                          <IconQuestionMark size={14} />
                                        </ThemeIcon>
                                      }
                                    >
                                      {quiz.quiz_title || "Quiz Tanpa Judul"}
                                    </ListItem>
                                  ))}
                                </List>
                              </>
                            ) : (
                              // Hanya tampilkan jika tidak ada konten DAN tidak ada quiz
                              material.details?.length === 0 && (
                                <Text size="xs" c="dimmed">
                                  Belum ada quiz di bab ini.
                                </Text>
                              )
                            )}
                          </Stack>
                        </AccordionPanel>
                      </AccordionItem>
                    ))
                  ) : (
                    <Text size="sm" c="dimmed">
                      Kursus ini belum memiliki materi/bab.
                    </Text>
                  )}
                </Accordion>
              </Box>

              <Divider />

              {/* Input Harga */}
              <NumberInput
                label="Harga Kursus (Rp)"
                description="Masukkan harga final sebelum publikasi."
                placeholder="Contoh: 500000"
                required
                min={1}
                allowDecimal={false}
                thousandSeparator="."
                decimalSeparator=","
                value={approvalPrice}
                onChange={(value) => setApprovalPrice(value)}
                error={
                  approvalError &&
                  (approvalPrice === "" ||
                    (typeof approvalPrice === "number" && approvalPrice <= 0))
                    ? "Harga wajib diisi dan > 0"
                    : undefined
                }
              />

              {/* Tombol Aksi */}
              <Group justify="flex-end" mt="md">
                <Button
                  variant="outline"
                  color="red"
                  onClick={handleReject}
                  loading={isPending}
                  leftSection={<IconX size={16} />}
                >
                  Tolak Permintaan
                </Button>
                <Button
                  color="green"
                  onClick={handleApprove}
                  loading={isPending}
                  leftSection={<IconChecks size={16} />}
                  // Pastikan ada materi (bab) sebelum bisa publish
                  disabled={
                    !approvalCourseDetails?.materials?.length ||
                    approvalPrice === "" ||
                    Number(approvalPrice) <= 0
                  }
                >
                  Setujui & Publikasikan
                </Button>
              </Group>
            </>
          )}

          {/* Tampilkan pesan loading awal */}
          {isFetchingDetails && (
            <Stack align="center" my="xl">
              <Text c="dimmed">Memuat detail kurikulum...</Text>
            </Stack>
          )}
        </Stack>
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
            render: (c) => getStatusBadge(c),
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
            render: (course) => {
              // --- Logika Kondisional untuk Tombol Aksi ---
              const isPendingApproval =
                course.publish_request_status === "pending";

              return (
                <Group gap="xs" justify="flex-end">
                  {isPendingApproval ? (
                    // Jika Pending: Tombol Review
                    <Tooltip label="Review Permintaan Publish">
                      <Button
                        variant="light"
                        color="yellow"
                        size="xs" // Ukuran tombol bisa disesuaikan
                        leftSection={<IconEye size={16} />}
                        onClick={() => handleOpenApprovalModal(course)}
                      >
                        Review
                      </Button>
                    </Tooltip>
                  ) : (
                    // Jika Bukan Pending: Tombol Edit & Hapus standar
                    <>
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
                    </>
                  )}
                </Group>
              );
            },
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
