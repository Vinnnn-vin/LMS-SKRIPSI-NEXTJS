// lmsistts/src/components/lecturer/MaterialDetailManager.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
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
  Paper,
  Title,
  Divider,
  Select,
  FileInput,
  Switch,
  Badge,
  ThemeIcon,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconVideo,
  IconFileText,
  IconLink,
  IconClipboardText,
  IconEye,
  IconQuestionMark,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import {
  createMaterialDetailSchema,
  updateMaterialDetailSchema,
} from "@/lib/schemas/materialDetail.schema";
import {
  createMaterialDetail,
  updateMaterialDetail,
  deleteMaterialDetail,
} from "@/app/actions/lecturer.actions";
import { zod4Resolver } from "mantine-form-zod-resolver";
import z from "zod";

// =========================================
// INTERFACE
// =========================================
interface MaterialDetailData {
  material_detail_id: number;
  material_detail_name: string;
  material_detail_description: string;
  material_detail_type: number;
  materi_detail_url: string;
  material_id: number | null;
  is_free: boolean;
}

interface QuizData {
  quiz_id: number;
  quiz_title: string | null;
}

const typeOptions = [
  { value: "1", label: "Video (Upload)" },
  { value: "2", label: "PDF (Upload)" },
  { value: "3", label: "Link YouTube" },
  { value: "4", label: "Tugas / Assignment" },
];

const getMaterialIcon = (type: number) => {
  switch (type) {
    case 1:
      return <IconVideo size={18} />;
    case 2:
      return <IconFileText size={18} />;
    case 3:
      return <IconLink size={18} />;
    case 4:
      return <IconClipboardText size={18} />;
    default:
      return null;
  }
};

type MaterialDetailFormValues = z.infer<
  typeof createMaterialDetailSchema
>;

export function MaterialDetailManager({
  details: initialDetails = [],
  quizzes: initialQuizzes = [],
  materialId,
  courseId,
}: {
  details?: MaterialDetailData[];
  quizzes?: QuizData[];
  materialId: number;
  courseId: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [records, setRecords] = useState<MaterialDetailData[]>(initialDetails);
  const [quizRecords, setQuizRecords] = useState<QuizData[]>(initialQuizzes);

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedDetail, setSelectedDetail] =
    useState<MaterialDetailData | null>(null);

  const [
    deleteConfirmOpened,
    { open: openDeleteConfirm, close: closeDeleteConfirm },
  ] = useDisclosure(false);
  const [formModalOpened, { open: openFormModal, close: closeFormModal }] =
    useDisclosure(false);

  const isEditing = modalMode === "edit";

  // =========================================
  // FORM SETUP
  // =========================================
  const form = useForm({
    initialValues: {
      material_detail_name: "",
      material_detail_description: "",
      material_detail_type: "1" as "1" | "2" | "3" | "4",
      is_free: false,
      materi_detail_url: "",
      content_file: undefined as File | undefined | null,
    },
    validate: zod4Resolver(
      isEditing ? updateMaterialDetailSchema : createMaterialDetailSchema
    ),
  });

  // =========================================
  // EFFECT UPDATE DATA
  // =========================================
  useEffect(() => {
    setRecords(initialDetails);
  }, [initialDetails]);

  useEffect(() => {
    setQuizRecords(initialQuizzes);
  }, [initialQuizzes]);

  // =========================================
  // HANDLER MODAL
  // =========================================
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedDetail(null);
    form.reset();
    form.setFieldValue("material_detail_type", "1");
    openFormModal();
  };

  const handleOpenEditModal = (detail: MaterialDetailData) => {
    setModalMode("edit");
    setSelectedDetail(detail);
    form.setValues({
      material_detail_name: detail.material_detail_name ?? "",
      material_detail_description: detail.material_detail_description ?? "",
      material_detail_type: String(detail.material_detail_type) as
        | "1"
        | "2"
        | "3"
        | "4",
      is_free: detail.is_free ?? false,
      materi_detail_url: detail.materi_detail_url ?? "",
      content_file: undefined,
    });
    openFormModal();
  };

  const handleOpenDeleteConfirm = (detail: MaterialDetailData) => {
    setSelectedDetail(detail);
    openDeleteConfirm();
  };

  // =========================================
  // HANDLE SUBMIT
  // =========================================
  const handleSubmit = async (values: MaterialDetailFormValues) => {
    // Validasi file size sebelum submit
    if (values.content_file instanceof File) {
      const fileSizeMB = values.content_file.size / 1024 / 1024;
      console.log(`📁 File size: ${fileSizeMB.toFixed(2)} MB`);

      if (fileSizeMB > 50) {
        notifications.show({
          title: "File Terlalu Besar",
          message: `Ukuran file ${fileSizeMB.toFixed(2)}MB melebihi batas maksimal 50MB`,
          color: "red",
        });
        return;
      }
    }

    startTransition(async () => {
      try {
        const formData = new FormData();

        // Append text data
        formData.append("material_detail_name", values.material_detail_name);
        formData.append(
          "material_detail_description",
          values.material_detail_description
        );
        formData.append("material_detail_type", values.material_detail_type.toString());
        formData.append("is_free", values.is_free ? "true" : "false");

        // Append URL jika ada
        if (values.materi_detail_url) {
          formData.append("materi_detail_url", values.materi_detail_url);
        }

        // ✅ CRITICAL FIX: Convert file ke base64 (BUKAN append File langsung)
        if (values.content_file instanceof File) {
          console.log(
            "📤 Converting file to base64:",
            values.content_file.name
          );

          try {
            // Import fileToBase64 dari lib/fileUtils
            const { fileToBase64 } = await import("@/lib/fileUtils");
            const base64 = await fileToBase64(values.content_file);

            // Append sebagai string, bukan File object
            formData.append("file_base64", base64);
            formData.append("file_name", values.content_file.name);

            console.log("✅ File converted to base64 successfully");
          } catch (conversionError) {
            console.error("❌ File conversion error:", conversionError);
            notifications.show({
              title: "Error",
              message: "Gagal membaca file. Silakan coba lagi.",
              color: "red",
            });
            return;
          }
        }

        // Debug: Log FormData contents
        console.log("📦 FormData contents:");
        for (const [key, value] of formData.entries()) {
          if (key === "file_base64") {
            console.log(
              `  ${key}: [Base64 Data - ${value.toString().length} chars]`
            );
          } else {
            console.log(`  ${key}: ${value}`);
          }
        }

        console.log("🚀 Sending request to server...");
        const result = isEditing
          ? await updateMaterialDetail(
              selectedDetail!.material_detail_id,
              formData
            )
          : await createMaterialDetail(materialId, formData);

        console.log("📥 Server response:", result);

        if (result?.success) {
          notifications.show({
            title: "Sukses",
            message: result.success,
            color: "green",
          });
          closeFormModal();
          form.reset();
          router.refresh();
        } else {
          notifications.show({
            title: "Gagal",
            message: result?.error || "Terjadi kesalahan",
            color: "red",
          });
        }
      } catch (error: any) {
        console.error("❌ Submit error:", error);
        notifications.show({
          title: "Error",
          message: error.message || "Terjadi kesalahan saat menyimpan data",
          color: "red",
        });
      }
    });
  };

  // =========================================
  // HANDLE DELETE
  // =========================================
  const handleDelete = () => {
    if (!selectedDetail) return;
    startTransition(async () => {
      const result = await deleteMaterialDetail(
        selectedDetail.material_detail_id
      );
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

  const selectedType = form.values.material_detail_type;
  const showFileInput = selectedType === "1" || selectedType === "2";
  const showUrlInput = selectedType === "3";

  const addQuizUrl = `/lecturer/dashboard/courses/${courseId}/quizzes/add?materialId=${materialId}`;

  // =========================================
  // RENDER
  // =========================================
  return (
    <Box pos="relative">
      <LoadingOverlay visible={isPending} overlayProps={{ blur: 2 }} />

      {/* MODAL FORM */}
      <Modal
        opened={formModalOpened}
        onClose={closeFormModal}
        title={isEditing ? "Edit Konten" : "Tambah Konten Baru"}
        centered
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Tipe Konten"
              data={typeOptions}
              required
              {...form.getInputProps("material_detail_type")}
            />
            <TextInput
              label="Judul Konten"
              required
              {...form.getInputProps("material_detail_name")}
            />
            <Textarea
              label="Deskripsi"
              minRows={3}
              {...form.getInputProps("material_detail_description")}
            />

            {showFileInput && (
              <FileInput
                label={selectedType === "1" ? "Upload Video" : "Upload PDF"}
                description="Ukuran maks 50MB"
                placeholder={
                  isEditing
                    ? "Pilih file baru jika ingin mengganti"
                    : "Pilih file"
                }
                accept={
                  selectedType === "1"
                    ? "video/mp4,video/webm"
                    : "application/pdf"
                }
                {...form.getInputProps("content_file")}
              />
            )}

            {showUrlInput && (
              <TextInput
                label="URL YouTube"
                placeholder="https://www.youtube.com/watch?v=..."
                type="url"
                {...form.getInputProps("materi_detail_url")}
              />
            )}

            <Switch
              label="Konten Gratis (Dapat diakses tanpa login)"
              {...form.getInputProps("is_free", { type: "checkbox" })}
            />

            <Button type="submit" mt="md" loading={isPending}>
              {isEditing ? "Update Konten" : "Simpan Konten"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* MODAL HAPUS */}
      <Modal
        opened={deleteConfirmOpened}
        onClose={closeDeleteConfirm}
        title="Konfirmasi Hapus"
        centered
        size="sm"
      >
        <Stack>
          <Text>
            Apakah Anda yakin ingin menghapus konten{" "}
            <b>{selectedDetail?.material_detail_name}</b>?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeDeleteConfirm}>
              Batal
            </Button>
            <Button color="red" onClick={handleDelete} loading={isPending}>
              Hapus
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* TOMBOL TAMBAH */}
      <Group justify="flex-end" mb="md">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleOpenCreateModal}
        >
          Tambah Konten (Materi/Tugas)
        </Button>
        <Button
          variant="outline"
          leftSection={<IconQuestionMark size={16} />}
          onClick={() => router.push(addQuizUrl)}
        >
          Tambah Quiz
        </Button>
      </Group>

      {/* DAFTAR KONTEN MATERI */}
      <Title order={5} c="dimmed">
        Konten Materi & Tugas
      </Title>
      <Divider my="xs" />
      {records.length > 0 ? (
        <Stack>
          {records.map((detail) => (
            <Paper
              withBorder
              p="md"
              radius="sm"
              key={detail.material_detail_id}
            >
              <Group justify="space-between">
                <Group>
                  <ThemeIcon variant="light" size={36} radius="sm">
                    {getMaterialIcon(detail.material_detail_type)}
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>{detail.material_detail_name}</Text>
                    <Text size="xs" c="dimmed">
                      {
                        typeOptions.find(
                          (opt) =>
                            opt.value === String(detail.material_detail_type)
                        )?.label
                      }
                    </Text>
                  </Stack>
                  {detail.is_free && (
                    <Badge color="teal" variant="light" size="sm">
                      Gratis
                    </Badge>
                  )}
                </Group>
                <Group gap="xs">
                  <Tooltip label="Lihat Konten">
                    <ActionIcon variant="subtle" color="gray">
                      <IconEye size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Edit Konten">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => handleOpenEditModal(detail)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Hapus Konten">
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => handleOpenDeleteConfirm(detail)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Text ta="center" c="dimmed" my="md">
          Belum ada konten (video, PDF, link, tugas) di dalam bab ini.
        </Text>
      )}

      {/* DAFTAR QUIZ */}
      <Title order={5} c="dimmed" mt="xl">
        Quiz
      </Title>
      <Divider my="xs" />
      {quizRecords.length > 0 ? (
        <Stack>
          {quizRecords.map((quiz) => (
            <Paper withBorder p="md" radius="sm" key={quiz.quiz_id}>
              <Group justify="space-between">
                <Group>
                  <ThemeIcon
                    variant="light"
                    color="orange"
                    size={36}
                    radius="sm"
                  >
                    <IconQuestionMark size={18} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={500}>{quiz.quiz_title}</Text>
                    <Text size="xs" c="dimmed">
                      Quiz
                    </Text>
                  </Stack>
                </Group>
                <Group gap="xs">
                  <Tooltip label="Edit Quiz & Pertanyaan">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() =>
                        router.push(
                          `/lecturer/dashboard/courses/${courseId}/quizzes/${quiz.quiz_id}/edit`
                        )
                      }
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Hapus Quiz">
                    <ActionIcon variant="light" color="red">
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Text ta="center" c="dimmed" my="md">
          Belum ada quiz di dalam bab ini.
        </Text>
      )}
    </Box>
  );
}
