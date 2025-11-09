// lmsistts\src\components\admin\CourseManagementTable.tsx

"use client";

import { useState, useTransition, useMemo } from "react";
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
import { zodResolver } from "mantine-form-zod-resolver";

import {
  notifyCreate,
  notifyUpdate,
  notifyDelete,
  notifyApprove,
  notifyReject,
  showErrorNotification,
} from "@/lib/notifications";

import {
  createCourseSchema,
  updateCourseSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
  type AdminCourseRowData,
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

const PAGE_SIZE = 10;

const getMaterialIcon = (type: number) => {
  switch (type) {
    case 1:
      return <IconVideo size={16} />;
    case 2:
      return <IconFileText size={16} />;
    case 3:
      return <IconLink size={16} />;
    case 4:
      return <IconFileText size={16} />;
    default:
      return null;
  }
};

export function CourseManagementTable({
  courses: initialCourses,
  categories,
  lecturers,
}: {
  courses: AdminCourseRowData[];
  categories: CategoryAttributes[];
  lecturers: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [page, setPage] = useState(1);
  const [sortStatus, setSortStatus] = useState<
    DataTableSortStatus<AdminCourseRowData>
  >({
    columnAccessor: "course_title",
    direction: "asc",
  });
  const [query, setQuery] = useState("");

  const [selectedCourse, setSelectedCourse] =
    useState<AdminCourseRowData | null>(null);
  const [formModalOpened, { open: openForm, close: closeForm }] =
    useDisclosure(false);
  const [deleteModalOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [originalThumbnailUrl, setOriginalThumbnailUrl] = useState<
    string | null
  >(null);

  const isEditing = !!selectedCourse;

  const [selectedCourseForApproval, setSelectedCourseForApproval] =
    useState<AdminCourseRowData | null>(null);
  const [
    approvalModalOpened,
    { open: openApprovalModal, close: closeApprovalModal },
  ] = useDisclosure(false);
  const [approvalPrice, setApprovalPrice] = useState<number | "">("");
  const [approvalError, setApprovalError] = useState<string | null>(null);
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
    validate: zodResolver(isEditing ? updateCourseSchema : createCourseSchema),
  });

  const filteredData = useMemo(() => {
    let data = [...initialCourses];
    if (query) {
      data = data.filter((course) =>
        course.course_title?.toLowerCase().includes(query.toLowerCase())
      );
    }
    return data;
  }, [initialCourses, query]);

  const sortedData = useMemo(() => {
    let data = sortBy(filteredData, sortStatus.columnAccessor);
    if (sortStatus.direction === "desc") {
      data.reverse();
    }
    return data;
  }, [filteredData, sortStatus]);

  const records = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    return sortedData.slice(from, to);
  }, [sortedData, page]);

  const totalRecords = sortedData.length;

  const lecturerOptions = lecturers.map((l) => ({
    value: String(l.user_id),
    label: `${l.first_name || ""} ${l.last_name || ""}`.trim() || l.email,
  }));

  const categoryOptions = categories.map((c) => ({
    value: String(c.category_id),
    label: c.category_name || "Tanpa Nama",
  }));

  const handleOpenEdit = async (course: AdminCourseRowData) => {
    setIsFetchingDetails(true);
    setSelectedCourse(course);

    try {
      const detailsResult = await getCourseByIdForAdmin(course.course_id);

      if (detailsResult.success && detailsResult.data) {
        const courseDetails = detailsResult.data;
        const priceValue =
          typeof courseDetails.course_price === "number"
            ? courseDetails.course_price
            : 0;

        setOriginalThumbnailUrl(courseDetails.thumbnail_url || null);
        setThumbnailPreview(courseDetails.thumbnail_url || null);

        form.setValues({
          course_title: courseDetails.course_title ?? "",
          course_description: courseDetails.course_description ?? "",
          course_level: courseDetails.course_level ?? "Beginner",
          category_id: courseDetails.category_id
            ? Number(courseDetails.category_id)
            : null,
          user_id: courseDetails.user_id ? Number(courseDetails.user_id) : null,
          course_price: priceValue,
          course_duration: courseDetails.course_duration ?? 0,
          publish_status: courseDetails.publish_status === 1 ? 1 : 0,
          thumbnail_file: undefined,
        });

        form.setInitialValues(form.values);
        openForm();
      } else {
        showErrorNotification({
          title: "Gagal Memuat Detail",
          message:
            detailsResult.error || "Tidak dapat mengambil detail kursus.",
        });
      }
    } finally {
      setIsFetchingDetails(false);
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
      setThumbnailPreview(originalThumbnailUrl);
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
        if (isEditing) {
          notifyUpdate(`Kursus "${values.course_title}"`);
        } else {
          notifyCreate(`Kursus "${values.course_title}"`);
        }
        closeForm();
        router.refresh();
      } else {
        showErrorNotification({
          title: isEditing
            ? "Gagal Memperbarui Kursus"
            : "Gagal Membuat Kursus",
          message: result.error || "Periksa kembali data yang diinput.",
        });
      }
    });
  };

  const handleDelete = () => {
    if (!selectedCourse) return;

    startTransition(async () => {
      const result = await deleteCourseByAdmin(selectedCourse.course_id);

      if (result.success) {
        notifyDelete(`Kursus "${selectedCourse.course_title}"`);
        closeDelete();
        router.refresh();
      } else {
        showErrorNotification({
          title: "Gagal Menghapus Kursus",
          message:
            result.error ||
            "Kursus mungkin masih memiliki mahasiswa terdaftar.",
        });
      }
    });
  };

  const handleOpenApprovalModal = async (course: AdminCourseRowData) => {
    setSelectedCourseForApproval(course);
    setApprovalPrice(course.course_price ?? "");
    setApprovalError(null);
    setApprovalCourseDetails(null);
    openApprovalModal();

    setIsFetchingDetails(true);
    try {
      const detailsResult = await getCourseByIdForAdmin(course.course_id);

      if (detailsResult.success && detailsResult.data) {
        setApprovalCourseDetails(detailsResult.data);
        setApprovalPrice(detailsResult.data.course_price ?? "");
      } else {
        const errorMsg =
          detailsResult.error || "Gagal memuat detail kurikulum.";
        setApprovalError(errorMsg);
        showErrorNotification({
          title: "Gagal Memuat Detail",
          message: errorMsg,
        });
      }
    } catch (error: any) {
      const errorMsg = error.message || "Terjadi kesalahan saat memuat detail.";
      setApprovalError(errorMsg);
      showErrorNotification({
        title: "Error",
        message: errorMsg,
      });
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleApprove = () => {
    if (
      !selectedCourseForApproval ||
      approvalPrice === "" ||
      approvalPrice <= 0
    ) {
      setApprovalError("Harga harus diisi dan lebih besar dari 0.");
      showErrorNotification({
        title: "Data Tidak Lengkap",
        message: "Harap isi harga kursus dengan benar.",
      });
      return;
    }

    setApprovalError(null);

    startTransition(async () => {
      const result = await approveCoursePublish(
        selectedCourseForApproval.course_id,
        Number(approvalPrice)
      );

      if (result.success) {
        notifyApprove(`Kursus "${selectedCourseForApproval.course_title}"`);
        closeApprovalModal();
        router.refresh();
      } else {
        const errorMsg = result.error || "Gagal menyetujui.";
        setApprovalError(errorMsg);
        showErrorNotification({
          title: "Gagal Menyetujui",
          message: errorMsg,
        });
      }
    });
  };

  const handleReject = () => {
    if (!selectedCourseForApproval) return;

    setApprovalError(null);

    startTransition(async () => {
      const result = await rejectCoursePublish(
        selectedCourseForApproval.course_id
      );

      if (result.success) {
        notifyReject(
          `Permintaan kursus "${selectedCourseForApproval.course_title}"`
        );
        closeApprovalModal();
        router.refresh();
      } else {
        const errorMsg = result.error || "Gagal menolak.";
        setApprovalError(errorMsg);
        showErrorNotification({
          title: "Gagal Menolak",
          message: errorMsg,
        });
      }
    });
  };

  const getStatusBadge = (course: AdminCourseRowData) => {
    if (course.publish_status === 1) {
      return <Badge color="green">Published</Badge>;
    }

    switch (course.publish_request_status) {
      case "pending":
        return (
          <Badge color="yellow" variant="light">
            Menunggu Persetujuan
          </Badge>
        );
      case "rejected":
        return (
          <Badge color="red" variant="light">
            Ditolak
          </Badge>
        );
      default:
        return <Badge color="gray">Draft</Badge>;
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
                placeholder="Pilih kategori"
                data={categoryOptions}
                value={
                  form.values.category_id
                    ? String(form.values.category_id)
                    : null
                }
                onChange={(val) =>
                  form.setFieldValue("category_id", val ? Number(val) : null)
                }
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
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Preview Thumbnail:
                </Text>
                <Image
                  src={thumbnailPreview}
                  maw={200}
                  alt="Thumbnail Preview"
                  radius="sm"
                />
                {isEditing && thumbnailPreview === originalThumbnailUrl && (
                  <Text size="xs" c="dimmed">
                    Thumbnail saat ini (tidak ada perubahan)
                  </Text>
                )}
              </Stack>
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
      >
        <LoadingOverlay visible={isFetchingDetails} />
        <Stack gap="lg">
          {approvalError && !isFetchingDetails && (
            <Alert
              color="red"
              icon={<IconAlertCircle size={16} />}
              title="Error Memuat Detail"
            >
              {approvalError}
            </Alert>
          )}

          {approvalCourseDetails && !isFetchingDetails && (
            <>
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

              <Box>
                <Title order={5} mb="sm">
                  Review Kurikulum
                </Title>
                <Accordion variant="separated">
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
                            {material.details && material.details.length > 0 ? (
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
                            ) : (
                              <Text size="xs" c="dimmed">
                                Belum ada konten (materi/tugas) di bab ini.
                              </Text>
                            )}

                            {material.details?.length > 0 &&
                              material.quizzes?.length > 0 && (
                                <Divider my="xs" />
                              )}

                            {material.quizzes && material.quizzes.length > 0 ? (
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
                            ) : (
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
                onChange={(value) => setApprovalPrice(Number(value))}
                error={
                  approvalError &&
                  (approvalPrice === "" ||
                    (typeof approvalPrice === "number" && approvalPrice <= 0))
                    ? "Harga wajib diisi dan > 0"
                    : undefined
                }
              />

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

      <DataTable<AdminCourseRowData>
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
              const isPendingApproval =
                course.publish_request_status === "pending";
              return (
                <Group gap="xs" justify="flex-end">
                  {isPendingApproval ? (
                    <Tooltip label="Review Permintaan Publish">
                      <Button
                        variant="light"
                        color="yellow"
                        size="xs"
                        leftSection={<IconEye size={16} />}
                        onClick={() => handleOpenApprovalModal(course)}
                      >
                        Review
                      </Button>
                    </Tooltip>
                  ) : (
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
