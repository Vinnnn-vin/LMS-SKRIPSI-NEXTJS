// lmsistts\src\components\lecturer\MaterialDetailManager.tsx

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
  Progress,
  Alert,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconVideo,
  IconFileText,
  IconLink,
  IconClipboardText,
  IconQuestionMark,
  IconUpload,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import {
  createMaterialDetail,
  updateMaterialDetail,
  deleteMaterialDetail,
} from "@/app/actions/lecturer.actions";
import {
  createMaterialDetailFormSchema,
  updateMaterialDetailFormSchema,
  type CreateMaterialDetailFormInput,
  type UpdateMaterialDetailFormInput,
} from "@/lib/schemas/materialDetail.schema";

const typeOptions = [
  { value: "1", label: "Video (Auto-upload ke YouTube)" },
  { value: "2", label: "PDF (Upload)" },
  { value: "3", label: "Link YouTube Manual" },
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
  details?: any[];
  quizzes?: any[];
  materialId: number;
  courseId: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const [originalContentUrl, setOriginalContentUrl] = useState<string | null>(
    null
  );
  const [originalTemplateUrl, setOriginalTemplateUrl] = useState<string | null>(
    null
  );

  const [
    deleteConfirmOpened,
    { open: openDeleteConfirm, close: closeDeleteConfirm },
  ] = useDisclosure(false);
  const [formModalOpened, { open: openFormModal, close: closeFormModal }] =
    useDisclosure(false);

  const isEditing = modalMode === "edit";

  const form = useForm<
    CreateMaterialDetailFormInput | UpdateMaterialDetailFormInput
  >({
    initialValues: {
      material_detail_name: "",
      material_detail_description: "",
      material_detail_type: "1",
      is_free: false,
      materi_detail_url: "",
      youtube_url: "",
      content_file: null,
      template_file: null,
      passing_score: null,
    },
    validate: zod4Resolver(
      isEditing
        ? updateMaterialDetailFormSchema
        : createMaterialDetailFormSchema
    ),
  });

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedDetail(null);
    setOriginalContentUrl(null);
    setOriginalTemplateUrl(null);
    form.reset();
    openFormModal();
  };

  const handleOpenEditModal = (detail: any) => {
    setModalMode("edit");
    setSelectedDetail(detail);

    setOriginalContentUrl(detail.materi_detail_url || null);
    setOriginalTemplateUrl(detail.assignment_template_url || null);

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
      youtube_url:
        detail.material_detail_type === 3
          ? (detail.materi_detail_url ?? "")
          : "",
      content_file: null,
      template_file: null,
      passing_score: detail.passing_score ?? null,
    });
    openFormModal();
  };

  const handleOpenDeleteConfirm = (detail: any) => {
    setSelectedDetail(detail);
    openDeleteConfirm();
  };

  const uploadVideoToYoutube = async (
    file: File,
    title: string,
    description: string,
    isFree: boolean
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("isFree", String(isFree));

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      const response = await fetch("/api/upload/youtube", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error);
      }

      notifications.show({
        title: "Upload Berhasil",
        message: "Video berhasil diupload ke YouTube",
        color: "green",
      });

      return result.url;
    } catch (error: any) {
      notifications.show({
        title: "Upload YouTube Gagal",
        message: error.message || "Terjadi kesalahan saat upload ke YouTube",
        color: "red",
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (
    values: CreateMaterialDetailFormInput | UpdateMaterialDetailFormInput
  ) => {
    startTransition(async () => {
      try {
        const formData = new FormData();

        formData.append("material_detail_name", values.material_detail_name);
        formData.append(
          "material_detail_description",
          values.material_detail_description
        );
        formData.append("material_detail_type", values.material_detail_type);
        formData.append("is_free", String(values.is_free));

        if (
          values.passing_score !== null &&
          values.passing_score !== undefined
        ) {
          formData.append("passing_score", String(values.passing_score));
        }

        if (values.material_detail_type === "1") {
          if (values.content_file instanceof File) {
            const youtubeUrl = await uploadVideoToYoutube(
              values.content_file,
              values.material_detail_name,
              values.material_detail_description,
              values.is_free
            );
            if (!youtubeUrl) return;
            formData.append("materi_detail_url", youtubeUrl);
          } else if (isEditing && originalContentUrl) {
            formData.append("materi_detail_url", originalContentUrl);
          }
        }

        if (values.material_detail_type === "2") {
          if (values.content_file instanceof File) {
            const base64Data = await fileToBase64(values.content_file);
            formData.append("file_base64", base64Data);
            formData.append("file_name", values.content_file.name);
          } else if (isEditing && originalContentUrl) {
            formData.append("materi_detail_url", originalContentUrl);
          }
        }

        if (values.material_detail_type === "3") {
          formData.append("materi_detail_url", values.youtube_url || "");
        }

        if (values.material_detail_type === "4") {
          if (values.template_file instanceof File) {
            const base64Data = await fileToBase64(values.template_file);
            formData.append("template_base64", base64Data);
            formData.append("template_name", values.template_file.name);
          } else if (isEditing && originalTemplateUrl) {
            formData.append("assignment_template_url", originalTemplateUrl);
          }
        }

        const res = isEditing
          ? await updateMaterialDetail(
              selectedDetail!.material_detail_id,
              formData
            )
          : await createMaterialDetail(materialId, formData);

        if (res?.success) {
          notifications.show({
            title: "Sukses",
            message: res.success,
            color: "green",
          });

          closeFormModal();
          form.reset();
          router.refresh();
        } else {
          notifications.show({
            title: "Gagal",
            message: res?.error || "Terjadi kesalahan",
            color: "red",
          });
        }
      } catch (error: any) {
        notifications.show({
          title: "Error",
          message: error.message,
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
  const showVideoUpload = selectedType === "1";
  const showPDFUpload = selectedType === "2";
  const showYouTubeInput = selectedType === "3";
  const showAssignmentFields = selectedType === "4";

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isPending} overlayProps={{ blur: 2 }} />

      <Modal
        opened={formModalOpened}
        onClose={() => {
          closeFormModal();
          form.reset();
        }}
        title={isEditing ? "Edit Konten" : "Tambah Konten Baru"}
        centered
        size="lg"
      >
        <Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
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

            {showVideoUpload && (
              <>
                {isEditing && originalContentUrl && (
                  <Paper withBorder p="sm" bg="blue.0" mb="xs">
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>
                        Video saat ini:
                      </Text>
                      <Group gap="xs" wrap="nowrap">
                        <IconVideo size={16} />
                        <Text
                          size="xs"
                          c="dimmed"
                          style={{ wordBreak: "break-all", flex: 1 }}
                        >
                          {originalContentUrl}
                        </Text>
                      </Group>
                      {originalContentUrl.includes("youtube.com") && (
                        <Button
                          size="xs"
                          variant="light"
                          component="a"
                          href={originalContentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat di YouTube
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                )}

                <FileInput
                  label={
                    isEditing ? "Upload Video Baru (opsional)" : "Upload Video"
                  }
                  accept="video/mp4,video/webm"
                  leftSection={<IconUpload size={16} />}
                  {...form.getInputProps("content_file")}
                  description={
                    isEditing && originalContentUrl
                      ? "Upload file baru hanya jika ingin mengganti video"
                      : "Video akan diupload ke YouTube channel Anda"
                  }
                />
                {isUploading && <Progress value={uploadProgress} animated />}
              </>
            )}

            {showPDFUpload && (
              <>
                <FileInput
                  label={
                    isEditing ? "Upload PDF Baru (opsional)" : "Upload PDF"
                  }
                  accept="application/pdf"
                  leftSection={<IconUpload size={16} />}
                  {...form.getInputProps("content_file")}
                  description={
                    isEditing && originalContentUrl
                      ? `PDF saat ini: ${originalContentUrl}`
                      : undefined
                  }
                />
                {isEditing && originalContentUrl && (
                  <Alert color="blue" icon={<IconAlertCircle />}>
                    PDF saat ini sudah tersimpan. Upload file baru hanya jika
                    ingin menggantinya.
                  </Alert>
                )}
              </>
            )}

            {showYouTubeInput && (
              <TextInput
                label="URL YouTube"
                placeholder="https://www.youtube.com/watch?v=..."
                type="url"
                required
                {...form.getInputProps("youtube_url")}
              />
            )}

            {showAssignmentFields && (
              <>
                <FileInput
                  label={
                    isEditing
                      ? "Template Tugas Baru (opsional)"
                      : "Template Tugas (Opsional)"
                  }
                  placeholder="Upload file template (.pdf, .docx, .zip)"
                  accept=".pdf,.doc,.docx,.zip"
                  leftSection={<IconUpload size={16} />}
                  {...form.getInputProps("template_file")}
                  clearable
                  description={
                    isEditing && originalTemplateUrl
                      ? `Template saat ini: ${originalTemplateUrl}`
                      : "File template yang akan didownload oleh siswa"
                  }
                />
                <NumberInput
                  label="Skor Lulus (%)"
                  placeholder="Contoh: 75"
                  min={0}
                  max={100}
                  {...form.getInputProps("passing_score")}
                  description="Skor minimum agar tugas dianggap lulus (0-100)"
                />
              </>
            )}

            <Switch
              label="Konten Gratis (dapat diakses tanpa membeli kursus)"
              {...form.getInputProps("is_free", { type: "checkbox" })}
              description={
                selectedType === "1"
                  ? "Video akan di-set public di YouTube jika gratis"
                  : ""
              }
            />

            <Button
              type="submit"
              mt="md"
              loading={isPending || isUploading}
              disabled={isUploading}
            >
              {isUploading
                ? "Mengupload..."
                : isEditing
                  ? "Update Konten"
                  : "Simpan Konten"}
            </Button>
          </Stack>
        </Box>
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
            Apakah Anda yakin ingin menghapus{" "}
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
          Tambah Konten
        </Button>
        <Button
          variant="outline"
          leftSection={<IconQuestionMark size={16} />}
          onClick={() =>
            router.push(
              `/lecturer/dashboard/courses/${courseId}/quizzes/add?materialId=${materialId}`
            )
          }
        >
          Tambah Quiz
        </Button>
      </Group>

      <Title order={5} c="dimmed">
        Konten Materi & Tugas
      </Title>
      <Divider my="xs" />

      {initialDetails.length > 0 ? (
        <Stack>
          {initialDetails.map((detail) => (
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
                    {detail.material_detail_type === 4 &&
                      detail.passing_score && (
                        <Text size="xs" c="blue">
                          Passing Score: {detail.passing_score}%
                        </Text>
                      )}
                  </Stack>
                  {detail.is_free && (
                    <Badge color="teal" variant="light" size="sm">
                      Gratis
                    </Badge>
                  )}
                </Group>
                <Group gap="xs">
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
          Belum ada konten di bab ini.
        </Text>
      )}

      <Title order={5} c="dimmed" mt="xl">
        Quiz
      </Title>
      <Divider my="xs" />

      {initialQuizzes.length > 0 ? (
        <Stack>
          {initialQuizzes.map((quiz) => (
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
                  <Tooltip label="Edit Quiz">
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
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Text ta="center" c="dimmed" my="md">
          Belum ada quiz di bab ini.
        </Text>
      )}
    </Box>
  );
}
