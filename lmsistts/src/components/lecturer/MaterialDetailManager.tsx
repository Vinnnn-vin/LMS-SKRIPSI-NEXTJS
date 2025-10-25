"use client";

import { useState, useTransition } from "react";
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
  NumberInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
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
import { zod4Resolver } from "mantine-form-zod-resolver";
import {
  createMaterialDetail,
  updateMaterialDetail,
  deleteMaterialDetail,
} from "@/app/actions/lecturer.actions";
import { fileToBase64 } from "@/lib/fileUtils";

interface MaterialDetailData {
  material_detail_id: number;
  material_detail_name: string;
  material_detail_description: string;
  material_detail_type: number;
  materi_detail_url: string | null;
  material_id: number | null;
  is_free: boolean;
  assignment_template_url?: string | null;
  passing_score?: number | null;
}

interface QuizData {
  quiz_id: number;
  quiz_title: string | null;
}

type MaterialDetailFormValues = {
  material_detail_name: string;
  material_detail_description: string;
  material_detail_type: "1" | "2" | "3" | "4";
  is_free: boolean;
  materi_detail_url: string;
  content_file: File | undefined | null;
  passing_score: number | null;
};

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
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const [
    deleteConfirmOpened,
    { open: openDeleteConfirm, close: closeDeleteConfirm },
  ] = useDisclosure(false);
  const [formModalOpened, { open: openFormModal, close: closeFormModal }] =
    useDisclosure(false);

  const isEditing = modalMode === "edit";

  const form = useForm<MaterialDetailFormValues>({
    initialValues: {
      material_detail_name: "",
      material_detail_description: "",
      material_detail_type: "1",
      is_free: false,
      materi_detail_url: "",
      content_file: undefined,
      passing_score: null,
    },
    validate: zod4Resolver(
      isEditing ? updateMaterialDetailSchema : createMaterialDetailSchema
    ),
  });

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedDetail(null);
    setTemplateFile(null);
    form.reset();
    form.setFieldValue("material_detail_type", "1");
    openFormModal();
  };

  const handleOpenEditModal = (detail: MaterialDetailData) => {
    setModalMode("edit");
    setSelectedDetail(detail);
    setTemplateFile(null);

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
      passing_score: detail.passing_score ?? null,
    });
    openFormModal();
  };

  const handleOpenDeleteConfirm = (detail: MaterialDetailData) => {
    setSelectedDetail(detail);
    openDeleteConfirm();
  };

  const handleSubmit = async (values: MaterialDetailFormValues) => {
    if (values.content_file instanceof File) {
      const fileSizeMB = values.content_file.size / 1024 / 1024;
      if (fileSizeMB > 50) {
        notifications.show({
          title: "File Terlalu Besar",
          message: `Ukuran file ${fileSizeMB.toFixed(
            2
          )}MB melebihi batas maksimal 50MB`,
          color: "red",
        });
        return;
      }
    }

    if (templateFile instanceof File) {
      const templateSizeMB = templateFile.size / 1024 / 1024;
      if (templateSizeMB > 50) {
        notifications.show({
          title: "File Template Terlalu Besar",
          message: `Ukuran file template ${templateSizeMB.toFixed(
            2
          )}MB melebihi batas maksimal 50MB`,
          color: "red",
        });
        return;
      }
    }

    startTransition(async () => {
      try {
        const formData = new FormData();

        formData.append("material_detail_name", values.material_detail_name);
        formData.append(
          "material_detail_description",
          values.material_detail_description
        );
        formData.append("material_detail_type", values.material_detail_type);
        formData.append("is_free", values.is_free ? "true" : "false");

        if (
          values.material_detail_type === "3" &&
          values.materi_detail_url
        ) {
          formData.append("materi_detail_url", values.materi_detail_url);
        }

        if (
          values.material_detail_type === "4" &&
          values.passing_score !== null &&
          values.passing_score !== undefined
        ) {
          formData.append("passing_score", values.passing_score.toString());
        }

        if (values.content_file instanceof File) {
          try {
            const base64 = await fileToBase64(values.content_file);
            formData.append("file_base64", base64);
            formData.append("file_name", values.content_file.name);
          } catch (conversionError) {
            console.error("Content file conversion error:", conversionError);
            notifications.show({
              title: "Gagal Mengkonversi File",
              message: "Terjadi kesalahan saat memproses file konten",
              color: "red",
            });
            return;
          }
        }

        if (values.material_detail_type === "4" && templateFile) {
          try {
            const base64 = await fileToBase64(templateFile);
            formData.append("template_file_base64", base64);
            formData.append("template_file_name", templateFile.name);
          } catch (conversionError) {
            console.error("Template file conversion error:", conversionError);
            notifications.show({
              title: "Gagal Mengkonversi Template",
              message: "Terjadi kesalahan saat memproses file template",
              color: "red",
            });
            return;
          }
        }

        const result = isEditing
          ? await updateMaterialDetail(
              selectedDetail!.material_detail_id,
              formData
            )
          : await createMaterialDetail(materialId, formData);

        if (result?.success) {
          notifications.show({
            title: "Berhasil",
            message: isEditing
              ? "Konten berhasil diperbarui"
              : "Konten baru berhasil ditambahkan",
            color: "green",
          });
          closeFormModal();
          form.reset();
          setTemplateFile(null);
          router.refresh();
        } else {
          notifications.show({
            title: "Gagal",
            message:
              result?.error ||
              `Gagal ${isEditing ? "memperbarui" : "menambahkan"} konten`,
            color: "red",
          });
        }
      } catch (error: any) {
        console.error("Submit error:", error);
        notifications.show({
          title: "Terjadi Kesalahan",
          message: error?.message || "Gagal memproses permintaan",
          color: "red",
        });
      }
    });
  };

  const handleDelete = () => {
    if (!selectedDetail) return;
    startTransition(async () => {
      const result = await deleteMaterialDetail(
        selectedDetail.material_detail_id
      );
      if (result?.success) {
        notifications.show({
          title: "Berhasil",
          message: "Konten berhasil dihapus",
          color: "green",
        });
        closeDeleteConfirm();
        setRecords((prev) =>
          prev.filter(
            (r) => r.material_detail_id !== selectedDetail.material_detail_id
          )
        );
      } else {
        notifications.show({
          title: "Gagal",
          message: result?.error || "Gagal menghapus konten",
          color: "red",
        });
      }
    });
  };

  const selectedType = form.values.material_detail_type;
  const showFileInput = selectedType === "1" || selectedType === "2";
  const showUrlInput = selectedType === "3";
  const showAssignmentFields = selectedType === "4";

  const addQuizUrl = `/lecturer/dashboard/courses/${courseId}/quizzes/add?materialId=${materialId}`;

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isPending} overlayProps={{ blur: 2 }} />

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
                label={
                  selectedType === "1"
                    ? "Upload Video (.mp4, .webm)"
                    : "Upload PDF (.pdf)"
                }
                description="Ukuran maksimal 50MB"
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

            {showAssignmentFields && (
              <>
                <FileInput
                  label="Template Tugas (Opsional)"
                  placeholder="Upload file template (.pdf, .docx, .zip)"
                  accept=".pdf,.doc,.docx,.zip"
                  onChange={setTemplateFile}
                  clearable
                  description="File ini bisa diunduh oleh mahasiswa"
                />
                <NumberInput
                  label="Skor Lulus Tugas (%)"
                  placeholder="Contoh: 75"
                  min={0}
                  max={100}
                  allowDecimal={false}
                  {...form.getInputProps("passing_score")}
                  description="Skor minimum agar tugas dianggap lulus (opsional)"
                />
              </>
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