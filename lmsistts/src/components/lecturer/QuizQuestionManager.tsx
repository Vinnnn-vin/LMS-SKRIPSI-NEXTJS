// lmsistts\src\components\lecturer\QuizQuestionManager.tsx

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
  Checkbox,
  Radio,
  Accordion,
  Badge,
  Alert,
  FileInput,
  Image,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconCircleCheck,
  IconCircleX,
  IconX,
  IconAlertCircle,
  IconBrandYoutube,
  IconFileTypePdf,
  IconPhoto,
} from "@tabler/icons-react";
import {
  addQuestionToQuiz,
  updateQuestionInQuiz,
  deleteQuestionFromQuiz,
} from "@/app/actions/lecturer.actions";
import { zod4Resolver } from "mantine-form-zod-resolver";
import {
  CreateQuestionInput,
  createQuestionSchema,
} from "@/lib/schemas/quizQuestion.schema";
import type {
  QuizQuestionWithOptions,
  // NormalizedQuestion,
} from "@/lib/schemas/quiz.schema";

interface NormalizedQuestion {
  question_id: number;
  question_text: string;
  question_type: "multiple_choice" | "checkbox" | "essay";
  media_type?: "none" | "image" | "video" | "pdf"; // [BARU]
  media_url?: string | null; // [BARU]
  options: {
    option_id: number;
    option_text: string;
    is_correct: boolean;
  }[];
}

interface QuizQuestionManagerProps {
  quizId: number;
  initialQuestions: QuizQuestionWithOptions[];
}

const uploadFileToServer = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file); // Key harus sesuai dengan backend ('file')

    // Ganti endpoint ini sesuai route upload Anda (misal: /api/upload atau /api/upload/blob)
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Gagal mengupload file ke server");
    }

    const data = await response.json();
    // Pastikan backend mengembalikan { url: "..." }
    if (!data.url)
      throw new Error("Format response server tidak valid (missing url)");

    return data.url;
  } catch (error: any) {
    console.error("Upload Error:", error);
    throw error;
  }
};

export function QuizQuestionManager({
  quizId,
  initialQuestions,
}: QuizQuestionManagerProps) {
  const [isPending, startTransition] = useTransition();

  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [questions, setQuestions] = useState<NormalizedQuestion[]>(
    initialQuestions
      .filter(
        (q): q is QuizQuestionWithOptions =>
          q.question_id != null &&
          q.question_text != null &&
          q.question_type != null
      )
      .map((q) => ({
        question_id: q.question_id,
        question_text: q.question_text || "",
        question_type: q.question_type || "multiple_choice",
        media_type: (q as any).media_type || "none",
        media_url: (q as any).media_url || null,
        options: (q.options || [])
          .filter((o) => o.option_id != null && o.option_text != null)
          .map((o) => ({
            option_id: o.option_id!,
            option_text: o.option_text || "",
            is_correct: o.is_correct ?? false,
          })),
      }))
  );

  const [formModalOpened, { open: openFormModal, close: closeFormModal }] =
    useDisclosure(false);
  const [editMode, setEditMode] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null
  );

  const form = useForm<CreateQuestionInput>({
    initialValues: {
      question_text: "",
      question_type: "multiple_choice",
      media_type: "none",
      media_url: "",
      options: [
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ],
    },
    validate: zod4Resolver(createQuestionSchema),
  });

  const handleFileUpload = async (file: File): Promise<string> => {
    return await uploadFileToServer(file);
  };

  const addOption = () => {
    form.setFieldValue("options", [
      ...form.values.options,
      { option_text: "", is_correct: false },
    ]);
  };

  const removeOption = (index: number) => {
    const updated = form.values.options.filter((_, i) => i !== index);
    form.setFieldValue("options", updated);
  };

  const processFormSubmit = async (values: CreateQuestionInput) => {
    let finalMediaUrl = values.media_url;

    // 1. Jika User memilih Image/PDF dan ada file baru yang diupload
    if (
      (values.media_type === "image" || values.media_type === "pdf") &&
      uploadFile
    ) {
      try {
        notifications.show({
          id: "upload-progress",
          title: "Mengupload...",
          message: "Mohon tunggu sebentar",
          loading: true,
          autoClose: false,
        });

        finalMediaUrl = await handleFileUpload(uploadFile);

        notifications.update({
          id: "upload-progress",
          title: "Berhasil",
          message: "File berhasil diupload",
          color: "green",
          loading: false,
          autoClose: 2000,
        });
      } catch (error) {
        notifications.update({
          id: "upload-progress",
          title: "Gagal Upload",
          message: error.message,
          color: "red",
          loading: false,
          autoClose: 3000,
        });
        return null;
      }
    }
    // 2. Jika tipe Video/YouTube, pastikan URL tidak kosong
    else if (values.media_type === "video" && !values.media_url) {
       notifications.show({
          title: "Validasi Gagal",
          message: "Anda memilih tipe Video YouTube, tetapi belum mengisi Link URL-nya.",
          color: "orange"
       });
       return null;
    }
    // 3. Jika None, kosongkan URL
    else if (values.media_type === "none") {
      finalMediaUrl = null;
    }

    return { ...values, media_url: finalMediaUrl };
  };

  const handleSubmit = (values: CreateQuestionInput) => {
    if (!validateMinimumOptions()) {
      notifications.show({
        title: "Validasi Gagal",
        message: "Minimal harus ada 2 pilihan jawaban yang terisi",
        color: "orange",
      });
      return;
    }

    if (!hasCorrectAnswer()) {
      notifications.show({
        title: "Validasi Gagal",
        message:
          form.values.question_type === "multiple_choice"
            ? "Pilih 1 jawaban yang benar"
            : "Pilih minimal 1 jawaban yang benar",
        color: "orange",
      });
      return;
    }

    startTransition(async () => {
      const result = await addQuestionToQuiz(quizId, values);
      if (result.success && result.data) {
        notifications.show({
          title: "Sukses",
          message: result.success,
          color: "green",
        });

        const normalizedQuestion: NormalizedQuestion = {
          question_id: result.data.question_id,
          question_text: result.data.question_text,
          question_type: result.data.question_type,
          media_type: (result.data as any).media_type || "none",
          media_url: (result.data as any).media_url,
          options: result.data.options.map((o) => ({
            option_id: o.option_id,
            option_text: o.option_text,
            is_correct: o.is_correct,
          })),
        };

        setQuestions((prev) => [...prev, normalizedQuestion]);
        closeFormModal();
        form.reset();
      } else {
        notifications.show({
          title: "Gagal",
          message: result.error || "Terjadi kesalahan",
          color: "red",
        });
      }
    });
  };

  const handleEdit = (q: NormalizedQuestion) => {
    form.setValues({
      question_text: q.question_text,
      question_type: q.question_type,
      media_type: q.media_type || "none",
      media_url: q.media_url || "",
      options: q.options.map((o) => ({
        option_text: o.option_text,
        is_correct: o.is_correct,
      })),
    });
    setUploadFile(null);
    setEditingQuestionId(q.question_id);
    setEditMode(true);
    openFormModal();
  };

  const handleSubmitEdit = (values: CreateQuestionInput) => {
    if (!editingQuestionId) return;

    if (!validateMinimumOptions()) {
      notifications.show({
        title: "Validasi Gagal",
        message: "Minimal harus ada 2 pilihan jawaban yang terisi",
        color: "orange",
      });
      return;
    }

    if (!hasCorrectAnswer()) {
      notifications.show({
        title: "Validasi Gagal",
        message:
          form.values.question_type === "multiple_choice"
            ? "Pilih 1 jawaban yang benar"
            : "Pilih minimal 1 jawaban yang benar",
        color: "orange",
      });
      return;
    }

    startTransition(async () => {
      const result = await updateQuestionInQuiz(editingQuestionId, values);

      if (result.success && result.data) {
        notifications.show({
          title: "Diperbarui",
          message: result.success,
          color: "green",
        });

        const normalizedQuestion: NormalizedQuestion = {
          question_id: result.data.question_id,
          question_text: result.data.question_text,
          question_type: result.data.question_type,
          media_type: (result.data as any).media_type,
          media_url: (result.data as any).media_url,
          options: result.data.options.map((o) => ({
            option_id: o.option_id,
            option_text: o.option_text,
            is_correct: o.is_correct,
          })),
        };

        setQuestions((prev) =>
          prev.map((q) =>
            q.question_id === editingQuestionId ? normalizedQuestion : q
          )
        );
        closeFormModal();
        form.reset();
        setEditMode(false);
        setEditingQuestionId(null);
      } else {
        notifications.show({
          title: "Gagal",
          message: result.error || "Terjadi kesalahan",
          color: "red",
        });
      }
    });
  };

  const handleDelete = (question_id: number) => {
    if (!confirm("Yakin ingin menghapus pertanyaan ini?")) return;

    startTransition(async () => {
      const result = await deleteQuestionFromQuiz(question_id);

      if (result.success) {
        setQuestions((prev) =>
          prev.filter((q) => q.question_id !== question_id)
        );
        notifications.show({
          title: "Dihapus",
          message: result.success,
          color: "green",
        });
      } else {
        notifications.show({
          title: "Gagal",
          message: result.error || "Terjadi kesalahan",
          color: "red",
        });
      }
    });
  };

  const validateMinimumOptions = () => {
    const validOptions = form.values.options.filter(
      (opt) => opt.option_text.trim().length > 0
    );
    return validOptions.length >= 2;
  };

  const hasCorrectAnswer = () => {
    return form.values.options.some((opt) => opt.is_correct);
  };

  const handleCorrectAnswerChange = (index: number, checked: boolean) => {
    if (form.values.question_type === "multiple_choice") {
      const updatedOptions = form.values.options.map((opt, i) => ({
        ...opt,
        is_correct: i === index ? checked : false,
      }));
      form.setFieldValue("options", updatedOptions);
    } else {
      form.setFieldValue(`options.${index}.is_correct`, checked);
    }
  };

  return (
    <Paper withBorder p="lg" radius="md" pos="relative">
      <LoadingOverlay visible={isPending} />

      <Group justify="space-between" mb="md">
        <Group>
          <Title order={5}>Daftar Pertanyaan</Title>
          <Badge color="blue" variant="light">
            {questions.length} Pertanyaan
          </Badge>
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            form.reset();
            setEditMode(false);
            openFormModal();
          }}
        >
          Tambah Pertanyaan
        </Button>
      </Group>

      <Modal
        opened={formModalOpened}
        onClose={() => {
          closeFormModal();
          setEditMode(false);
          setEditingQuestionId(null);
        }}
        title={editMode ? "Edit Pertanyaan" : "Tambah Pertanyaan Baru"}
        size="xl"
        centered
      >
        <form
          onSubmit={form.onSubmit(editMode ? handleSubmitEdit : handleSubmit)}
        >
          <Stack>
            <Textarea
              label="Teks Pertanyaan"
              required
              minRows={3}
              placeholder="Masukkan pertanyaan..."
              {...form.getInputProps("question_text")}
            />

            <Group grow>
              {/* Select Tipe Soal */}
              <Select
                label="Tipe Jawaban"
                data={[
                  {
                    value: "multiple_choice",
                    label: "Pilihan Ganda (1 Benar)",
                  },
                  { value: "checkbox", label: "Pilihan Ganda (Banyak Benar)" },
                ]}
                required
                {...form.getInputProps("question_type")}
                onChange={(value) => {
                  form.setFieldValue("question_type", value as any);
                  // Reset pilihan benar jika tipe berubah
                  form.setFieldValue(
                    "options",
                    form.values.options.map((o) => ({
                      ...o,
                      is_correct: false,
                    }))
                  );
                }}
              />

              {/* Select Tipe Media [BARU] */}
              <Select
                label="Media Pendukung"
                data={[
                  { value: "none", label: "Tidak Ada" },
                  { value: "image", label: "Gambar" },
                  { value: "video", label: "Video YouTube" },
                  { value: "pdf", label: "Dokumen PDF" },
                ]}
                {...form.getInputProps("media_type")}
                onChange={(val) => {
                  form.setFieldValue("media_type", val as any);
                  if (val === "none") form.setFieldValue("media_url", "");
                  setUploadFile(null);
                }}
              />
            </Group>

            {form.values.media_type !== "none" && (
              <Paper withBorder p="sm" bg="gray.0">
                {form.values.media_type === "image" && (
                  <Stack gap="xs">
                    <FileInput
                      label="Upload Gambar"
                      placeholder="Pilih file gambar..."
                      accept="image/*"
                      leftSection={<IconPhoto size={16} />}
                      onChange={setUploadFile}
                      clearable
                    />
                    {/* Preview logic sederhana */}
                    {(uploadFile || form.values.media_url) && (
                      <Image
                        src={
                          uploadFile
                            ? URL.createObjectURL(uploadFile)
                            : form.values.media_url
                        }
                        h={150}
                        w="auto"
                        fit="contain"
                        radius="md"
                      />
                    )}
                  </Stack>
                )}

                {form.values.media_type === "pdf" && (
                  <Stack gap="xs">
                    <FileInput
                      label="Upload PDF"
                      placeholder="Pilih file PDF..."
                      accept="application/pdf"
                      leftSection={<IconFileTypePdf size={16} />}
                      onChange={setUploadFile}
                      clearable
                    />
                    <Text size="xs" c="dimmed">
                      File saat ini:{" "}
                      {uploadFile
                        ? uploadFile.name
                        : form.values.media_url || "Belum ada file"}
                    </Text>
                  </Stack>
                )}

                {form.values.media_type === "video" && (
                  <TextInput
                    label="Link YouTube"
                    placeholder="https://youtube.com/watch?v=..."
                    leftSection={<IconBrandYoutube size={16} />}
                    {...form.getInputProps("media_url")}
                  />
                )}
              </Paper>
            )}

            <Divider label="Pilihan Jawaban" my="xs" />

            {!validateMinimumOptions() && form.values.options.length > 0 && (
              <Alert color="orange" icon={<IconAlertCircle />}>
                Minimal harus ada 2 pilihan jawaban yang terisi
              </Alert>
            )}

            {!hasCorrectAnswer() && form.values.options.length > 0 && (
              <Text
                size="sm"
                c="orange"
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <IconAlertCircle size={16} />
                {form.values.question_type === "multiple_choice"
                  ? "Pilih 1 jawaban yang benar"
                  : "Pilih minimal 1 jawaban yang benar"}
              </Text>
            )}

            <Stack gap="xs">
              {form.values.options.map((option, index) => (
                <Group key={index} align="flex-start" wrap="nowrap">
                  <TextInput
                    placeholder={`Pilihan ${index + 1}`}
                    {...form.getInputProps(`options.${index}.option_text`)}
                    required
                    style={{ flex: 1 }}
                  />

                  {form.values.question_type === "multiple_choice" ? (
                    <Radio
                      label="Benar"
                      checked={option.is_correct}
                      onChange={(e) =>
                        handleCorrectAnswerChange(
                          index,
                          e.currentTarget.checked
                        )
                      }
                      mt={4}
                    />
                  ) : (
                    <Checkbox
                      label="Benar"
                      {...form.getInputProps(`options.${index}.is_correct`, {
                        type: "checkbox",
                      })}
                      mt={4}
                    />
                  )}

                  <ActionIcon
                    color="red"
                    onClick={() => removeOption(index)}
                    disabled={form.values.options.length <= 1}
                    variant="light"
                    mt={4}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>

            <Button
              variant="outline"
              size="xs"
              onClick={addOption}
              type="button"
              leftSection={<IconPlus size={14} />}
            >
              Tambah Pilihan Jawaban
            </Button>

            <Button type="submit" mt="md" loading={isPending}>
              {editMode ? "Simpan Perubahan" : "Simpan Pertanyaan"}
            </Button>
          </Stack>
        </form>
      </Modal>

      {questions.length > 0 ? (
        <Accordion variant="separated">
          {questions.map((q, idx) => (
            <Accordion.Item value={String(q.question_id)} key={q.question_id}>
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs">
                    <Badge size="sm" variant="light">
                      #{idx + 1}
                    </Badge>
                    <Text fw={500} lineClamp={1}>
                      {q.question_text}
                    </Text>
                  </Group>
                  <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                    <Tooltip label="Edit Pertanyaan">
                      <ActionIcon
                        component="div"
                        variant="light"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(q);
                        }}
                      >
                        <IconPencil size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Hapus Pertanyaan">
                      <ActionIcon
                        component="div"
                        variant="light"
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(q.question_id);
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </Accordion.Control>

              <Accordion.Panel>
                <Stack gap="sm">
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      Tipe:
                    </Text>
                    <Badge
                      size="sm"
                      color={
                        q.question_type === "multiple_choice" ? "blue" : "grape"
                      }
                    >
                      {q.question_type === "multiple_choice"
                        ? "Pilihan Ganda (1 Jawaban)"
                        : "Pilihan Ganda (Banyak Jawaban)"}
                    </Badge>
                  </Group>

                  <Divider label="Pilihan Jawaban" labelPosition="center" />

                  {q.options.length > 0 ? (
                    q.options.map((opt, optIdx) => (
                      <Group key={opt.option_id} gap="xs">
                        {opt.is_correct ? (
                          <IconCircleCheck
                            color="var(--mantine-color-green-6)"
                            size={18}
                          />
                        ) : (
                          <IconCircleX
                            color="var(--mantine-color-red-6)"
                            size={18}
                          />
                        )}
                        <Badge size="xs" variant="dot">
                          {String.fromCharCode(65 + optIdx)}
                        </Badge>
                        <Text size="sm">{opt.option_text}</Text>
                      </Group>
                    ))
                  ) : (
                    <Text size="sm" c="dimmed" fs="italic">
                      Tidak ada pilihan jawaban
                    </Text>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      ) : (
        <Paper withBorder p="xl" radius="md">
          <Stack align="center" gap="xs">
            <IconAlertCircle size={32} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed" ta="center">
              Belum ada pertanyaan untuk quiz ini.
            </Text>
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                form.reset();
                setEditMode(false);
                openFormModal();
              }}
              leftSection={<IconPlus size={16} />}
            >
              Tambah Pertanyaan Pertama
            </Button>
          </Stack>
        </Paper>
      )}
    </Paper>
  );
}
