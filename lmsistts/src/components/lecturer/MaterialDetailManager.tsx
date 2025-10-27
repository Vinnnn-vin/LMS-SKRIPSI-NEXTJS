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
  IconQuestionMark,
  IconUpload,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import {
  MaterialDetailData,
  QuizData,
} from "@/lib/schemas/materialDetail.schema";
import {
  createMaterialDetail,
  updateMaterialDetail,
  deleteMaterialDetail,
} from "@/app/actions/lecturer.actions";

type MaterialDetailFormValues = {
  material_detail_name: string;
  material_detail_description: string;
  material_detail_type: "1" | "2" | "3" | "4";
  is_free: boolean;
  materi_detail_url: string;
  youtube_url: string;
  content_file: File | null;
  template_file: File | null;
  passing_score: number | null;
};

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
  details?: MaterialDetailData[];
  quizzes?: QuizData[];
  materialId: number;
  courseId: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [records, setRecords] = useState(initialDetails);
  const [quizRecords] = useState(initialQuizzes);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedDetail, setSelectedDetail] =
    useState<MaterialDetailData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
      youtube_url: "",
      content_file: null,
      template_file: null,
      passing_score: null,
    },
  });

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedDetail(null);
    form.reset();
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

  const handleOpenDeleteConfirm = (detail: MaterialDetailData) => {
    setSelectedDetail(detail);
    openDeleteConfirm();
  };

  // Upload file biasa (PDF/Template)
  const uploadFile = async (
    file: File,
    fileType: "pdfs" | "assignments"
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);

    try {
      const response = await fetch("/api/upload/file", {
        // ✅ endpoint baru
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error);
      return result.url;
    } catch (error: any) {
      notifications.show({
        title: "Upload Gagal",
        message: error.message || "Terjadi kesalahan saat upload file",
        color: "red",
      });
      return null;
    }
  };

  // Upload video ke YouTube
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

      // Simulasi progress (karena YouTube API tidak support progress event)
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

      return result.url; // Return YouTube URL
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

  const handleSubmit = async (values: MaterialDetailFormValues) => {
    startTransition(async () => {
      let materiUrl: string | null = values.materi_detail_url || null;
      let assignmentUrl: string | null = null;

      // TIPE 1: Upload video ke YouTube
      if (
        values.material_detail_type === "1" &&
        values.content_file instanceof File
      ) {
        const youtubeUrl = await uploadVideoToYoutube(
          values.content_file,
          values.material_detail_name,
          values.material_detail_description,
          values.is_free
        );
        if (!youtubeUrl) return;
        materiUrl = youtubeUrl;
      }

      // TIPE 2: Upload PDF
      if (
        values.material_detail_type === "2" &&
        values.content_file instanceof File
      ) {
        const uploaded = await uploadFile(values.content_file, "pdfs");
        if (!uploaded) return;
        materiUrl = uploaded;
      }

      // TIPE 3: YouTube URL manual
      if (values.material_detail_type === "3") {
        materiUrl = values.youtube_url;
      }

      // TIPE 4: Upload template assignment (opsional)
      if (
        values.material_detail_type === "4" &&
        values.template_file instanceof File
      ) {
        const uploaded = await uploadFile(values.template_file, "assignments");
        if (!uploaded) return;
        assignmentUrl = uploaded;
      }

      const dataToSend = {
        material_detail_name: values.material_detail_name,
        material_detail_description: values.material_detail_description,
        material_detail_type: values.material_detail_type,
        is_free: values.is_free,
        materi_detail_url: materiUrl,
        assignment_template_url: assignmentUrl,
        passing_score:
          values.material_detail_type === "4" ? values.passing_score : null,
      };

      try {
        const res = isEditing
          ? await updateMaterialDetail(
              selectedDetail!.material_detail_id,
              dataToSend
            )
          : await createMaterialDetail(materialId, dataToSend);

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
        setRecords((prev) =>
          prev.filter(
            (r) => r.material_detail_id !== selectedDetail.material_detail_id
          )
        );
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

      {/* FORM MODAL */}
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

            {/* TIPE 1: Video Upload */}
            {showVideoUpload && (
              <>
                <FileInput
                  label="Upload Video (akan otomatis diupload ke YouTube)"
                  accept="video/mp4,video/webm"
                  leftSection={<IconUpload size={16} />}
                  {...form.getInputProps("content_file")}
                  description="Video akan diupload ke YouTube channel Anda"
                />
                {isUploading && <Progress value={uploadProgress} animated />}
              </>
            )}

            {/* TIPE 2: PDF Upload */}
            {showPDFUpload && (
              <FileInput
                label="Upload PDF"
                accept="application/pdf"
                leftSection={<IconUpload size={16} />}
                {...form.getInputProps("content_file")}
              />
            )}

            {/* TIPE 3: YouTube URL Manual */}
            {showYouTubeInput && (
              <TextInput
                label="URL YouTube"
                placeholder="https://www.youtube.com/watch?v=..."
                type="url"
                required
                {...form.getInputProps("youtube_url")}
              />
            )}

            {/* TIPE 4: Assignment */}
            {showAssignmentFields && (
              <>
                <FileInput
                  label="Template Tugas (Opsional)"
                  placeholder="Upload file template (.pdf, .docx, .zip)"
                  accept=".pdf,.doc,.docx,.zip"
                  leftSection={<IconUpload size={16} />}
                  {...form.getInputProps("template_file")}
                  clearable
                  description="File template yang akan didownload oleh siswa"
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
        </form>
      </Modal>

      {/* DELETE MODAL */}
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

      {/* BUTTONS */}
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

      {/* LIST KONTEN MATERI */}
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

      {/* LIST QUIZ */}
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
