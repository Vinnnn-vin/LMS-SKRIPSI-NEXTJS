"use client";

import React, {
  useState,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Radio,
  Checkbox,
  Paper,
  Progress,
  LoadingOverlay,
  Alert,
  Modal,
  Loader,
} from "@mantine/core";
import {
  IconClock,
  IconChevronLeft,
  IconChevronRight,
  IconListCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { submitQuizAttempt } from "@/app/actions/student.actions";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import {
  type QuizWithRelations,
  type QuizQuestionWithOptions,
  type QuizAnswerOption,
} from "@/lib/schemas/quiz.schema";

import { QuizMediaRenderer } from "./QuizMediaRenderer";
import { useSession } from "next-auth/react";

dayjs.extend(duration);

interface ActiveQuizPlayerProps {
  quizData: QuizWithRelations;
  courseId: number;
  enrollmentId: number;
  attemptNumber: number;
  onFinish: (result: { score: number; status: "passed" | "failed" }) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// 🔥 GENERATE UNIQUE SESSION ID untuk quiz attempt ini
function generateQuizSessionId(
  enrollmentId: number,
  quizId: number,
  attemptNumber: number
): string {
  return `quiz_${enrollmentId}_${quizId}_attempt_${attemptNumber}`;
}

export function ActiveQuizPlayer({
  quizData,
  courseId,
  enrollmentId,
  attemptNumber,
  onFinish,
}: ActiveQuizPlayerProps) {
  const { data: session } = useSession();

  const quizSessionId = useMemo(
    () => generateQuizSessionId(enrollmentId, quizData.quiz_id, attemptNumber),
    [enrollmentId, quizData.quiz_id, attemptNumber]
  );

  const calculateTimeLeft = useCallback(() => {
    if (typeof window === "undefined") return (quizData.time_limit || 1) * 60;

    const savedStartTime = localStorage.getItem(`${quizSessionId}_startTime`);

    if (!savedStartTime) {
      const now = Date.now();
      localStorage.setItem(`${quizSessionId}_startTime`, String(now));
      return (quizData.time_limit || 1) * 60;
    }

    const startTime = parseInt(savedStartTime);
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const totalSeconds = (quizData.time_limit || 1) * 60;
    const remaining = Math.max(0, totalSeconds - elapsedSeconds);

    console.log("⏰ Time calculation:", {
      startTime: new Date(startTime).toLocaleString(),
      now: new Date(now).toLocaleString(),
      elapsedSeconds,
      totalSeconds,
      remaining,
    });

    return remaining;
  }, [quizData.time_limit, quizSessionId]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`${quizSessionId}_currentIndex`);
      return saved ? parseInt(saved) : 0;
    }
    return 0;
  });

  const [studentAnswers, setStudentAnswers] = useState<
    Record<number, number | number[]>
  >(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`${quizSessionId}_answers`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

  const [isSubmitting, startSubmitting] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`${quizSessionId}_submitted`) === "true";
    }
    return false;
  });

  const [hasTriggeredAutoSubmit, setHasTriggeredAutoSubmit] = useState(false);

  const processedQuestions = useMemo(() => {
    // Cek apakah sudah ada urutan tersimpan
    if (typeof window !== "undefined") {
      const savedOrder = localStorage.getItem(`${quizSessionId}_questionOrder`);
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder);
        const rawQuestions = quizData.questions || [];

        // Reconstruct questions berdasarkan urutan tersimpan
        return orderIds
          .map((id: number) => {
            const question = rawQuestions.find((q) => q.question_id === id);
            if (!question) return null;

            // Load saved option order
            const savedOptions = localStorage.getItem(
              `${quizSessionId}_options_${id}`
            );
            if (savedOptions) {
              const optionIds = JSON.parse(savedOptions);
              const reconstructedOptions = optionIds
                .map((optId: number) =>
                  question.options?.find((o) => o.option_id === optId)
                )
                .filter(Boolean);
              return { ...question, options: reconstructedOptions };
            }

            return question;
          })
          .filter(Boolean);
      }
    }

    // Jika belum ada, acak baru
    const rawQuestions = quizData.questions || [];
    const shuffledQuestions = shuffleArray(rawQuestions);

    const processed = shuffledQuestions.map((q) => {
      const shuffledOptions = q.options ? shuffleArray(q.options) : [];

      // Simpan urutan ke localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `${quizSessionId}_options_${q.question_id}`,
          JSON.stringify(shuffledOptions.map((o) => o.option_id))
        );
      }

      return {
        ...q,
        options: shuffledOptions,
      };
    });

    // Simpan urutan soal
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `${quizSessionId}_questionOrder`,
        JSON.stringify(processed.map((q) => q.question_id))
      );
    }

    return processed;
  }, [quizData, quizSessionId]);

  const currentQuestion = processedQuestions[currentQuestionIndex];

  // RE-CALCULATE time left saat component mount (untuk handle refresh)
  useEffect(() => {
    const recalculatedTime = calculateTimeLeft();
    setTimeLeft(recalculatedTime);

    if (recalculatedTime <= 0 && !isSubmitted) {
      console.log("⏰ Time already expired on mount!");
      setShowTimeoutModal(true);
      handleSubmit(true);
    }
  }, [calculateTimeLeft, isSubmitted]);

  // SIMPAN STATE ke localStorage setiap kali berubah
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `${quizSessionId}_currentIndex`,
        String(currentQuestionIndex)
      );
    }
  }, [currentQuestionIndex, quizSessionId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `${quizSessionId}_answers`,
        JSON.stringify(studentAnswers)
      );
    }
  }, [studentAnswers, quizSessionId]);

  // PREVENT REFRESH / BACK BUTTON
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmitted) {
        e.preventDefault();
        e.returnValue =
          "Quiz sedang berlangsung. Yakin ingin keluar? Waktu akan tetap berjalan.";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitted]);

  // 🔥 CLEANUP sessionStorage saat submit berhasil
  const cleanupSession = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${quizSessionId}_startTime`);
      localStorage.removeItem(`${quizSessionId}_currentIndex`);
      localStorage.removeItem(`${quizSessionId}_answers`);
      localStorage.removeItem(`${quizSessionId}_questionOrder`);
      localStorage.removeItem(`${quizSessionId}_submitted`);

      // Remove all option orders
      processedQuestions.forEach((q) => {
        localStorage.removeItem(`${quizSessionId}_options_${q.question_id}`);
      });
    }
  }, [quizSessionId, processedQuestions]);

  const handleSubmit = useCallback(
    (isTimeout = false) => {
      if (isSubmitted) {
        console.log("⚠️ Already submitted, returning");
        return;
      }

      if (
        !isTimeout &&
        Object.keys(studentAnswers).length < processedQuestions.length
      ) {
        console.log("⚠️ Not all questions answered");
        const userConfirmed = window.confirm(
          "Anda belum menjawab semua pertanyaan. Yakin ingin mengumpulkan?"
        );
        if (!userConfirmed) {
          console.log("⚠️ User cancelled submission");
          return;
        }
      }

      console.log("✅ Proceeding with submission...");
      setIsSubmitted(true);
      setSubmitError(null);
      setTimeLeft(0);

      startSubmitting(async () => {
        try {
          const result = await submitQuizAttempt({
            quizId: quizData.quiz_id,
            courseId,
            enrollmentId,
            answers: studentAnswers,
            timeTaken: quizData.time_limit * 60 - timeLeft,
            attemptSession: attemptNumber,
          });

          if (result.success) {
            // 🔥 CLEANUP session setelah submit berhasil
            cleanupSession();

            if (isTimeout) {
              notifications.show({
                title: "⏰ Waktu Habis!",
                message: `Quiz otomatis dikumpulkan. Skor: ${result.score}%`,
                color: "orange",
                autoClose: 10000,
              });
            } else {
              notifications.show({
                title: "✅ Quiz Berhasil Dikumpulkan!",
                message: `Skor Anda: ${result.score}%`,
                color: result.status === "passed" ? "green" : "orange",
                autoClose: 5000,
              });
            }

            if (result.certificateGranted) {
              notifications.show({
                title: "🎉 Selamat! Kursus Selesai!",
                message:
                  "Anda telah menyelesaikan seluruh kursus! Sertifikat Anda telah dibuat.",
                color: "green",
                autoClose: 10000,
              });
            }

            const normalizedStatus =
              result.status === "passed" || result.status === "failed"
                ? result.status
                : result.status?.toLowerCase() === "passed"
                  ? "passed"
                  : "failed";

            console.log("🎯 Calling onFinish with:", {
              score: result.score,
              status: normalizedStatus,
            });
            onFinish({ score: result.score!, status: normalizedStatus });
          } else {
            throw new Error(result.error || "Gagal menyimpan jawaban quiz.");
          }
        } catch (error: any) {
          console.error("❌ Submit Quiz Error:", error);
          setSubmitError(error.message || "Terjadi kesalahan saat submit.");
          setIsSubmitted(false);
          notifications.show({
            title: "❌ Gagal Submit Quiz",
            message:
              error.message || "Terjadi kesalahan saat menyimpan jawaban.",
            color: "red",
            autoClose: 5000,
          });
        }
      });
    },
    [
      studentAnswers,
      quizData,
      courseId,
      enrollmentId,
      timeLeft,
      attemptNumber,
      onFinish,
      startSubmitting,
      isSubmitted,
      processedQuestions.length,
      cleanupSession,
    ]
  );

  // Timer
  useEffect(() => {
    if (isSubmitted) {
      console.log("⏸️ Timer stopped - already submitted");
      return;
    }

    if (timeLeft <= 0) {
      console.log("⏰ Time's up! Auto-submitting...");
      setShowTimeoutModal(true);
      handleSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1);
        if (newTime % 10 === 0) {
          console.log("⏱️ Time left:", newTime);
        }
        return newTime;
      });
    }, 1000);

    return () => {
      console.log("🧹 Cleaning up timer");
      clearInterval(timer);
    };
  }, [timeLeft, isSubmitted, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (
    questionId: number,
    optionId: number,
    type: "multiple_choice" | "checkbox"
  ) => {
    console.log("📝 Answer changed:", { questionId, optionId, type });

    setStudentAnswers((prev) => {
      if (type === "multiple_choice") {
        const newState = { ...prev, [questionId]: optionId };
        console.log("📝 New state (radio):", newState);
        return newState;
      } else {
        const current = (prev[questionId] as number[]) || [];
        console.log("📝 Current checkbox array:", current);

        const newAnswers = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];

        console.log("📝 New checkbox array:", newAnswers);
        const newState = { ...prev, [questionId]: newAnswers };
        console.log("📝 New state (checkbox):", newState);
        return newState;
      }
    });
  };

  const goToNext = () => {
    if (currentQuestionIndex < processedQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  if (!currentQuestion) {
    return (
      <Alert color="orange" icon={<IconAlertCircle />}>
        Quiz ini belum memiliki pertanyaan.
      </Alert>
    );
  }

  const percentage = (timeLeft / (quizData.time_limit * 60)) * 100;
  const isLowTime = timeLeft < 60;
  const answeredCount = Object.keys(studentAnswers).length;

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isSubmitting} overlayProps={{ blur: 1 }} />

      {submitError && (
        <Alert
          color="red"
          icon={<IconAlertCircle />}
          title="Submit Error"
          withCloseButton
          onClose={() => setSubmitError(null)}
          mb="md"
        >
          {submitError}
        </Alert>
      )}

      <Group justify="space-between" align="center" mb="lg">
        <Title order={4}>
          {quizData.quiz_title} (Percobaan {attemptNumber})
        </Title>
        <Group>
          <Paper withBorder px="sm" py={4} radius="sm" shadow="xs">
            <Group gap="xs">
              <IconClock size={16} color={isLowTime ? "red" : "gray"} />
              <Text fw={500} c={isLowTime ? "red" : "inherit"}>
                {formatTime(timeLeft)}
              </Text>
            </Group>
          </Paper>
          <Box w={100}>
            <Progress
              value={
                ((currentQuestionIndex + 1) / processedQuestions.length) * 100
              }
              size="sm"
            />
            <Text size="xs" ta="right">
              {currentQuestionIndex + 1} / {processedQuestions.length}
            </Text>
          </Box>
        </Group>
      </Group>

      <Paper
        withBorder
        p="lg"
        radius="md"
        mb="lg"
        bg={
          studentAnswers[currentQuestion.question_id] !== undefined
            ? "blue.0"
            : undefined
        }
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          notifications.show({
            message: "Klik kanan dinonaktifkan untuk ujian ini.",
            color: "red",
            autoClose: 2000,
          });
        }}
        onCopy={(e) => {
          e.preventDefault();
          return false;
        }}
      >
        <QuizMediaRenderer
          mediaType={currentQuestion.media_type || "none"}
          mediaUrl={currentQuestion.media_url || null}
          userName={session?.user?.name || "Mahasiswa"}
        />

        <Text fw={500} mb="md" size="lg">
          {currentQuestionIndex + 1}. {currentQuestion.question_text}
        </Text>

        {currentQuestion.question_type === "multiple_choice" && (
          <Radio.Group
            value={String(studentAnswers[currentQuestion.question_id] || "")}
            onChange={(val) =>
              handleAnswerChange(
                currentQuestion.question_id,
                Number(val),
                "multiple_choice"
              )
            }
          >
            <Stack gap="sm" mt="md">
              {currentQuestion.options?.map((opt) => (
                <Radio
                  key={opt.option_id}
                  value={String(opt.option_id)}
                  label={opt.option_text}
                  disabled={isSubmitted}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </Stack>
          </Radio.Group>
        )}

        {currentQuestion.question_type === "checkbox" && (
          <Stack gap="sm" mt="md">
            <Text size="xs" c="dimmed">
              (Pilih semua yang benar)
            </Text>
            {currentQuestion.options?.map((opt) => {
              const currentAnswers =
                (studentAnswers[currentQuestion.question_id] as number[]) || [];
              return (
                <Checkbox
                  key={opt.option_id}
                  label={opt.option_text}
                  checked={currentAnswers.includes(opt.option_id)}
                  onChange={() =>
                    handleAnswerChange(
                      currentQuestion.question_id,
                      opt.option_id,
                      "checkbox"
                    )
                  }
                  disabled={isSubmitted}
                />
              );
            })}
          </Stack>
        )}
      </Paper>

      <Group justify="space-between" mt="xl">
        <Button
          variant="default"
          leftSection={<IconChevronLeft size={16} />}
          onClick={goToPrev}
          disabled={currentQuestionIndex === 0 || isSubmitted}
        >
          Sebelumnya
        </Button>

        {currentQuestionIndex === processedQuestions.length - 1 ? (
          <Button
            color="green"
            leftSection={<IconListCheck size={16} />}
            onClick={() => {
              handleSubmit(false);
            }}
            loading={isSubmitting}
            disabled={isSubmitted}
          >
            Selesai & Kumpulkan
          </Button>
        ) : (
          <Button
            variant="filled"
            rightSection={<IconChevronRight size={16} />}
            onClick={goToNext}
            disabled={isSubmitted}
          >
            Berikutnya
          </Button>
        )}
      </Group>

      <Modal
        opened={showTimeoutModal}
        onClose={() => setShowTimeoutModal(false)}
        title="⏰ Waktu Habis!"
        centered
        withCloseButton={false}
      >
        <Stack>
          <Text>
            Quiz telah otomatis dikumpulkan karena waktu pengerjaan telah habis.
          </Text>
          {isSubmitting && (
            <Group justify="center">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Menyimpan jawaban...
              </Text>
            </Group>
          )}
        </Stack>
      </Modal>
    </Box>
  );
}
