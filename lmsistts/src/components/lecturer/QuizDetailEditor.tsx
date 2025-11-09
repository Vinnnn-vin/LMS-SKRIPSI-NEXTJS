// lmsistts\src\components\lecturer\QuizDetailEditor.tsx

"use client";

import { useState, useTransition } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Button,
  Modal,
  Stack,
  TextInput,
  Textarea,
  NumberInput,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPencil, IconClock, IconTarget, IconRepeat } from "@tabler/icons-react";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { updateQuizSchema, type UpdateQuizInput } from "@/lib/schemas/quiz.schema";
import { updateQuizDetails } from "@/app/actions/lecturer.actions";

interface QuizDetailEditorProps {
  quizId: number;
  courseId: number;
  initialData: {
    quiz_title: string | null;
    quiz_description: string | null;
    passing_score: number | null;
    time_limit: number | null;
    max_attempts: number | null;
  };
}

export function QuizDetailEditor({
  quizId,
  courseId,
  initialData,
}: QuizDetailEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [opened, { open, close }] = useDisclosure(false);
  
  const [currentData, setCurrentData] = useState(initialData);

  const form = useForm<UpdateQuizInput>({
    initialValues: {
      quiz_title: currentData.quiz_title || "",
      quiz_description: currentData.quiz_description || "",
      passing_score: currentData.passing_score || 70,
      time_limit: currentData.time_limit || 10,
      max_attempts: currentData.max_attempts || 3,
    },
    validate: zod4Resolver(updateQuizSchema),
  });

  const handleEdit = () => {
    form.setValues({
      quiz_title: currentData.quiz_title || "",
      quiz_description: currentData.quiz_description || "",
      passing_score: currentData.passing_score || 70,
      time_limit: currentData.time_limit || 10,
      max_attempts: currentData.max_attempts || 3,
    });
    open();
  };

  const handleSubmit = (values: UpdateQuizInput) => {
    startTransition(async () => {
      const result = await updateQuizDetails(quizId, values);

      if (result.success && result.data) {
        notifications.show({
          title: "Berhasil",
          message: result.success,
          color: "green",
        });

        setCurrentData({
          quiz_title: result.data.quiz_title,
          quiz_description: result.data.quiz_description,
          passing_score: result.data.passing_score,
          time_limit: result.data.time_limit,
          max_attempts: result.data.max_attempts,
        });

        close();
      } else {
        notifications.show({
          title: "Gagal",
          message: result.error || "Terjadi kesalahan",
          color: "red",
        });
      }
    });
  };

  return (
    <>
      <Paper withBorder p="lg" radius="md" pos="relative">
        <LoadingOverlay visible={isPending} />

        <Group justify="space-between" align="flex-start" mb="md">
          <Title order={5}>Detail Quiz</Title>
          <Button
            variant="light"
            size="sm"
            leftSection={<IconPencil size={16} />}
            onClick={handleEdit}
          >
            Edit Detail
          </Button>
        </Group>

        {currentData.quiz_description && (
          <Text size="sm" mb="md" c="dimmed">
            {currentData.quiz_description}
          </Text>
        )}

        <Group gap="lg" wrap="wrap">
          <Group gap="xs">
            <IconTarget size={20} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="xs" c="dimmed">Skor Lulus</Text>
              <Text size="sm" fw={500}>{currentData.passing_score}%</Text>
            </div>
          </Group>

          <Group gap="xs">
            <IconClock size={20} color="var(--mantine-color-green-6)" />
            <div>
              <Text size="xs" c="dimmed">Waktu</Text>
              <Text size="sm" fw={500}>{currentData.time_limit} Menit</Text>
            </div>
          </Group>

          <Group gap="xs">
            <IconRepeat size={20} color="var(--mantine-color-orange-6)" />
            <div>
              <Text size="xs" c="dimmed">Maksimal Percobaan</Text>
              <Text size="sm" fw={500}>{currentData.max_attempts}x</Text>
            </div>
          </Group>
        </Group>

        <Text size="xs" c="dimmed" mt="md" fs="italic">
          💡 Tip: Klik tombol "Edit Detail" di atas untuk mengubah judul, deskripsi, skor lulus, waktu, dan jumlah percobaan quiz.
        </Text>
      </Paper>

      <Modal
        opened={opened}
        onClose={close}
        title="Edit Detail Quiz"
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Judul Quiz"
              placeholder="e.g., Kuis Bab 1: Pengenalan"
              required
              {...form.getInputProps("quiz_title")}
            />

            <Textarea
              label="Deskripsi Quiz"
              placeholder="Instruksi atau deskripsi singkat untuk quiz..."
              minRows={3}
              {...form.getInputProps("quiz_description")}
            />

            <Group grow>
              <NumberInput
                label="Skor Lulus (%)"
                description="Skor minimum untuk lulus"
                min={0}
                max={100}
                required
                {...form.getInputProps("passing_score")}
              />

              <NumberInput
                label="Batas Waktu (Menit)"
                description="Durasi pengerjaan quiz"
                min={1}
                required
                {...form.getInputProps("time_limit")}
              />
            </Group>

            <NumberInput
              label="Maksimal Percobaan"
              description="Berapa kali siswa bisa mengulang quiz"
              min={1}
              max={10}
              required
              {...form.getInputProps("max_attempts")}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={close}>
                Batal
              </Button>
              <Button type="submit" loading={isPending}>
                Simpan Perubahan
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}