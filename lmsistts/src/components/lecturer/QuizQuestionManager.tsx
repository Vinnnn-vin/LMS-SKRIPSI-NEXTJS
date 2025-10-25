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
  normalizedQuestionSchema,
  QuizQuestionWithOptions,
} from "@/lib/schemas/quiz.schema";

// ✅ Gunakan type dari Zod schema
type QuestionData = {
  question_id: number;
  question_text: string;
  question_type: "multiple_choice" | "checkbox" | "essay";
  options: {
    option_id: number;
    option_text: string;
    is_correct: boolean;
  }[];
};

interface QuizQuestionManagerProps {
  quizId: number;
  initialQuestions: QuizQuestionWithOptions[]; // ✅ Accept nullable data dari database
}

export function QuizQuestionManager({
  quizId,
  initialQuestions,
}: QuizQuestionManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [questions, setQuestions] = useState<QuestionData[]>(
    // ✅ Normalize data: filter null/undefined dan set defaults
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
      options: [
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ],
    },
    validate: zod4Resolver(createQuestionSchema),
  });

  // ✅ Tambah Opsi Jawaban
  const addOption = () => {
    form.setFieldValue("options", [
      ...form.values.options,
      { option_text: "", is_correct: false },
    ]);
  };

  // ✅ Hapus Opsi Jawaban
  const removeOption = (index: number) => {
    const updated = form.values.options.filter((_, i) => i !== index);
    form.setFieldValue("options", updated);
  };

  // ✅ Tambah Pertanyaan
  const handleSubmit = (values: CreateQuestionInput) => {
    startTransition(async () => {
      const result = await addQuestionToQuiz(quizId, values);
      if (result.success && result.data) {
        notifications.show({
          title: "Sukses",
          message: result.success,
          color: "green",
        });

        // ✅ Normalize data sebelum menambah ke state
        const normalizedQuestion: QuestionData = {
          question_id: result.data.question_id,
          question_text: result.data.question_text,
          question_type: result.data.question_type,
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

  // ✅ Edit Pertanyaan
  const handleEdit = (q: QuestionData) => {
    form.setValues({
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options.map((o) => ({
        option_text: o.option_text,
        is_correct: o.is_correct,
      })),
    });
    setEditingQuestionId(q.question_id);
    setEditMode(true);
    openFormModal();
  };

  const handleSubmitEdit = (values: CreateQuestionInput) => {
    if (!editingQuestionId) return;

    startTransition(async () => {
      const result = await updateQuestionInQuiz(editingQuestionId, values);

      if (result.success && result.data) {
        notifications.show({
          title: "Diperbarui",
          message: result.success,
          color: "green",
        });

        // ✅ Normalize data sebelum update state
        const normalizedQuestion: QuestionData = {
          question_id: result.data.question_id,
          question_text: result.data.question_text,
          question_type: result.data.question_type,
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

  // ✅ Hapus Pertanyaan
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

  // ✅ Helper: Cek apakah ada jawaban benar
  const hasCorrectAnswer = () => {
    return form.values.options.some((opt) => opt.is_correct);
  };

  // ✅ Helper: Handle perubahan jawaban benar untuk multiple choice (radio behavior)
  const handleCorrectAnswerChange = (index: number, checked: boolean) => {
    if (form.values.question_type === "multiple_choice") {
      // Untuk multiple choice: uncheck semua, lalu check yang dipilih
      const updatedOptions = form.values.options.map((opt, i) => ({
        ...opt,
        is_correct: i === index ? checked : false,
      }));
      form.setFieldValue("options", updatedOptions);
    } else {
      // Untuk checkbox: toggle individual
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

      {/* Modal Tambah/Edit Pertanyaan */}
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

            <Select
              label="Tipe Pertanyaan"
              description={
                form.values.question_type === "multiple_choice"
                  ? "Siswa hanya bisa memilih 1 jawaban benar"
                  : "Siswa bisa memilih lebih dari 1 jawaban benar"
              }
              data={[
                {
                  value: "multiple_choice",
                  label: "Pilihan Ganda (1 Jawaban Benar)",
                },
                {
                  value: "checkbox",
                  label: "Pilihan Ganda (Banyak Jawaban Benar)",
                },
              ]}
              required
              {...form.getInputProps("question_type")}
              onChange={(value) => {
                form.setFieldValue("question_type", value as any);
                // Reset semua jawaban benar saat tipe berubah
                const resetOptions = form.values.options.map((opt) => ({
                  ...opt,
                  is_correct: false,
                }));
                form.setFieldValue("options", resetOptions);
              }}
            />

            <Divider label="Pilihan Jawaban" my="xs" />

            {/* ✅ Warning jika belum ada jawaban benar */}
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

                  {/* ✅ Conditional: Radio untuk multiple_choice, Checkbox untuk checkbox */}
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

      {/* Accordion Pertanyaan */}
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
