// lmsistts\src\components\student\QuizReviewModal.tsx
"use client";

import {
  Modal,
  Stack,
  Title,
  Text,
  Paper,
  Badge,
  Group,
  Box,
  ThemeIcon,
  Divider,
  ScrollArea,
  Button,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import {
  type QuizWithRelations,
  type QuizQuestionWithOptions,
} from "@/lib/schemas/quiz.schema";

type QuizReviewData = Pick<QuizWithRelations, "quiz_title"> & {
  questions: QuizQuestionWithOptions[];
};

interface QuizReviewModalProps {
  opened: boolean;
  onClose: () => void;
  quizData: QuizReviewData;
  studentAnswers: Record<number, number | number[]>;
  score: number;
}

export function QuizReviewModal({
  opened,
  onClose,
  quizData,
  studentAnswers,
  score,
}: QuizReviewModalProps) {
  let correctCount = 0;
  let wrongCount = 0;

  quizData.questions.forEach((question) => {
    const studentAnswer = studentAnswers[question.question_id];
    const correctOptions = question.options
      .filter((opt) => opt.is_correct)
      .map((opt) => opt.option_id);

    let isCorrect = false;
    if (question.question_type === "multiple_choice") {
      isCorrect = studentAnswer === correctOptions[0];
    } else {
      const studentAnswerArray = (studentAnswer as number[]) || [];
      isCorrect =
        correctOptions.length === studentAnswerArray.length &&
        correctOptions.every((id) => studentAnswerArray.includes(id));
    }

    if (isCorrect) correctCount++;
    else wrongCount++;
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group gap="md">
          <Title order={3}>Review Jawaban Quiz</Title>
          <Badge size="lg" variant="light" color="blue">
            Skor: {score}%
          </Badge>
        </Group>
      }
      styles={{
        title: { width: "100%" },
        body: { padding: 0 },
      }}
    >
      <ScrollArea h="70vh" px="lg" py="md">
        <Stack gap="lg">
          <Group grow>
            <Paper withBorder p="md" radius="md" bg="green.0">
              <Group gap="xs">
                <ThemeIcon size={40} color="green" variant="light" radius="xl">
                  <IconCircleCheck size={24} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Benar
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {correctCount}
                  </Text>
                </Box>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" bg="red.0">
              <Group gap="xs">
                <ThemeIcon size={40} color="red" variant="light" radius="xl">
                  <IconCircleX size={24} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Salah
                  </Text>
                  <Text size="xl" fw={700} c="red">
                    {wrongCount}
                  </Text>
                </Box>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" bg="blue.0">
              <Group gap="xs">
                <ThemeIcon size={40} color="blue" variant="light" radius="xl">
                  <IconCheck size={24} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total
                  </Text>
                  <Text size="xl" fw={700} c="blue">
                    {quizData.questions.length}
                  </Text>
                </Box>
              </Group>
            </Paper>
          </Group>

          <Divider label="Detail Jawaban" labelPosition="center" />

          {quizData.questions.map((question, index) => {
            const studentAnswer = studentAnswers[question.question_id];
            const correctOptions = question.options
              .filter((opt) => opt.is_correct)
              .map((opt) => opt.option_id);

            let isCorrect = false;
            if (question.question_type === "multiple_choice") {
              isCorrect = studentAnswer === correctOptions[0];
            } else {
              const studentAnswerArray = (studentAnswer as number[]) || [];
              isCorrect =
                correctOptions.length === studentAnswerArray.length &&
                correctOptions.every((id) => studentAnswerArray.includes(id));
            }

            return (
              <Paper
                key={question.question_id}
                withBorder
                p="lg"
                radius="md"
                style={{
                  borderLeft: `4px solid ${isCorrect ? "var(--mantine-color-green-6)" : "var(--mantine-color-red-6)"}`,
                  backgroundColor: isCorrect
                    ? "var(--mantine-color-green-0)"
                    : "var(--mantine-color-red-0)",
                }}
              >
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <Group align="flex-start" gap="sm">
                      <ThemeIcon
                        size={32}
                        radius="xl"
                        color={isCorrect ? "green" : "red"}
                        variant="light"
                      >
                        {isCorrect ? (
                          <IconCheck size={18} />
                        ) : (
                          <IconX size={18} />
                        )}
                      </ThemeIcon>
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                          <Badge size="sm" variant="light">
                            Soal {index + 1}
                          </Badge>
                          {question.question_type === "checkbox" && (
                            <Badge size="sm" variant="light" color="orange">
                              Pilihan Ganda
                            </Badge>
                          )}
                        </Group>
                        <Text fw={500} size="md">
                          {question.question_text}
                        </Text>
                      </Box>
                    </Group>
                    <Badge
                      size="lg"
                      color={isCorrect ? "green" : "red"}
                      variant="filled"
                      leftSection={
                        isCorrect ? (
                          <IconCheck size={14} />
                        ) : (
                          <IconX size={14} />
                        )
                      }
                    >
                      {isCorrect ? "BENAR" : "SALAH"}
                    </Badge>
                  </Group>

                  <Divider />

                  <Stack gap="xs">
                    {question.options.map((option) => {
                      const isStudentAnswer =
                        question.question_type === "multiple_choice"
                          ? studentAnswer === option.option_id
                          : (studentAnswer as number[])?.includes(
                              option.option_id
                            );

                      const isCorrectOption = option.is_correct;

                      let borderColor = "var(--mantine-color-gray-3)";
                      let bgColor = "white";
                      let icon = null;

                      if (isCorrectOption) {
                        borderColor = "var(--mantine-color-green-6)";
                        bgColor = "var(--mantine-color-green-0)";
                        icon = <IconCircleCheck size={18} color="green" />;
                      }

                      if (isStudentAnswer && !isCorrectOption) {
                        borderColor = "var(--mantine-color-red-6)";
                        bgColor = "var(--mantine-color-red-0)";
                        icon = <IconCircleX size={18} color="red" />;
                      }

                      return (
                        <Paper
                          key={option.option_id}
                          withBorder
                          p="sm"
                          radius="md"
                          style={{
                            borderColor,
                            borderWidth:
                              isStudentAnswer || isCorrectOption ? 2 : 1,
                            backgroundColor: bgColor,
                          }}
                        >
                          <Group gap="sm" wrap="nowrap">
                            {icon && (
                              <ThemeIcon
                                size={24}
                                radius="xl"
                                color={isCorrectOption ? "green" : "red"}
                                variant="light"
                              >
                                {icon}
                              </ThemeIcon>
                            )}
                            <Text size="sm" style={{ flex: 1 }}>
                              {option.option_text}
                            </Text>
                            <Group gap="xs">
                              {isStudentAnswer && (
                                <Badge
                                  size="sm"
                                  color={isCorrectOption ? "green" : "red"}
                                  variant="light"
                                >
                                  Jawaban Anda
                                </Badge>
                              )}
                              {isCorrectOption && (
                                <Badge size="sm" color="green" variant="filled">
                                  ✓ Benar
                                </Badge>
                              )}
                            </Group>
                          </Group>
                        </Paper>
                      );
                    })}
                  </Stack>

                  {!isCorrect && (
                    <Paper withBorder p="sm" radius="md" bg="orange.0">
                      <Group gap="xs">
                        <ThemeIcon size="sm" color="orange" variant="light">
                          <IconX size={14} />
                        </ThemeIcon>
                        <Text size="sm" c="orange.9">
                          <strong>Jawaban yang benar:</strong>{" "}
                          {question.options
                            .filter((opt) => opt.is_correct)
                            .map((opt) => opt.option_text)
                            .join(", ")}
                        </Text>
                      </Group>
                    </Paper>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </ScrollArea>

      <Box
        p="lg"
        style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}
      >
        <Group justify="space-between">
          <Group gap="md">
            <Badge size="lg" color="green" variant="light">
              {correctCount} Benar
            </Badge>
            <Badge size="lg" color="red" variant="light">
              {wrongCount} Salah
            </Badge>
            <Badge size="lg" color="blue" variant="light">
              Skor: {score}%
            </Badge>
          </Group>
          <Button onClick={onClose} size="md">
            Tutup Review
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}
