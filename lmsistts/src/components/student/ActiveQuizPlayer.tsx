// lmsistts\src\components\student\ActiveQuizPlayer.tsx
"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Box, Stack, Title, Text, Button, Group, Radio, Checkbox, Paper, Progress, LoadingOverlay, Alert, Modal, Loader } from '@mantine/core';
import { IconClock, IconChevronLeft, IconChevronRight, IconListCheck, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { submitQuizAttempt } from '@/app/actions/student.actions';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import {
  type QuizWithRelations,
  type QuizQuestionWithOptions,
  type QuizAnswerOption
} from "@/lib/schemas/quiz.schema";

dayjs.extend(duration);

interface ActiveQuizPlayerProps {
    quizData: QuizWithRelations;
    courseId: number;
    enrollmentId: number;
    attemptNumber: number;
    onFinish: (result: { score: number, status: 'passed' | 'failed' }) => void;
}

export function ActiveQuizPlayer({ quizData, courseId, enrollmentId, attemptNumber, onFinish }: ActiveQuizPlayerProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [studentAnswers, setStudentAnswers] = useState<Record<number, number | number[]>>({});
    const [timeLeft, setTimeLeft] = useState((quizData.time_limit || 1) * 60);
    const [isSubmitting, startSubmitting] = useTransition();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [hasTriggeredAutoSubmit, setHasTriggeredAutoSubmit] = useState(false); // ✅ NEW

    const questions = quizData.questions || [];
    const currentQuestion = questions[currentQuestionIndex];

    // ✅ Submit Function
    const handleSubmit = useCallback((isTimeout = false) => {
        console.log("🔵 handleSubmit called, isTimeout:", isTimeout);
        console.log("🔵 Current state - isSubmitted:", isSubmitted);
        console.log("🔵 Student answers:", studentAnswers);
        console.log("🔵 Questions length:", questions.length);
        
        if (isSubmitted) {
            console.log("⚠️ Already submitted, returning");
            return;
        }

        // Konfirmasi jika belum semua terjawab (kecuali timeout)
        if (!isTimeout && Object.keys(studentAnswers).length < questions.length) {
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
        setTimeLeft(0); // Hentikan timer

        startSubmitting(async () => {
            try {
                console.log("📤 Submitting answers:", studentAnswers);
                console.log("📤 Quiz ID:", quizData.quiz_id);
                console.log("📤 Course ID:", courseId);
                console.log("📤 Enrollment ID:", enrollmentId);
                console.log("📤 Attempt Number:", attemptNumber);

                // ✅ FIXED: Format jawaban sesuai dengan yang diharapkan server action
                const result = await submitQuizAttempt({
                    quizId: quizData.quiz_id,
                    courseId,
                    enrollmentId,
                    answers: studentAnswers,
                    timeTaken: (quizData.time_limit * 60) - timeLeft,
                    attemptSession: attemptNumber
                });

                console.log("📥 Submit result:", result);

                if (result.success) {
                    console.log("✅ Quiz submitted successfully!");
                    
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
                            color: result.status === 'passed' ? 'green' : 'orange',
                            autoClose: 5000,
                        });
                    }

                    if (result.certificateGranted) {
                        notifications.show({
                            title: "🎉 Selamat! Kursus Selesai!",
                            message: "Anda telah menyelesaikan seluruh kursus! Sertifikat Anda telah dibuat.",
                            color: "green",
                            autoClose: 10000,
                        });
                    }

                    // Normalisasi status
                    const normalizedStatus = result.status === "passed" || result.status === "failed"
                        ? result.status
                        : result.status?.toLowerCase() === "passed"
                            ? "passed"
                            : "failed";

                    console.log("🎯 Calling onFinish with:", { score: result.score, status: normalizedStatus });
                    onFinish({ score: result.score!, status: normalizedStatus });
                } else {
                    throw new Error(result.error || "Gagal menyimpan jawaban quiz.");
                }
            } catch (error: any) {
                console.error("❌ Submit Quiz Error:", error);
                setSubmitError(error.message || "Terjadi kesalahan saat submit.");
                setIsSubmitted(false); // Allow retry
                notifications.show({
                    title: "❌ Gagal Submit Quiz",
                    message: error.message || "Terjadi kesalahan saat menyimpan jawaban.",
                    color: "red",
                    autoClose: 5000,
                });
            }
        });
    }, [studentAnswers, quizData, courseId, enrollmentId, timeLeft, attemptNumber, onFinish, startSubmitting, isSubmitted, questions.length]);

    // ✅ Timer Logic dengan Auto-submit
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
                // Log setiap 10 detik untuk debugging
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
    }, [timeLeft, isSubmitted]); // ✅ FIXED: Hapus handleSubmit dari dependencies

    // Format waktu
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ✅ FIXED: Answer Handling untuk multiple_choice dan checkbox
    const handleAnswerChange = (
        questionId: number,
        optionId: number,
        type: "multiple_choice" | "checkbox"
    ) => {
        console.log("📝 Answer changed:", { questionId, optionId, type });
        
        setStudentAnswers((prev) => {
            if (type === "multiple_choice") {
                // Radio: langsung set number
                const newState = { ...prev, [questionId]: optionId };
                console.log("📝 New state (radio):", newState);
                return newState;
            } else {
                // Checkbox: kelola array number[]
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

    // Navigation
    const goToNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
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
            
            {/* 🔍 DEBUG PANEL - Hapus setelah testing */}
            <Alert color="blue" mb="md" title="Debug Info">
                <Stack gap="xs">
                    <Text size="xs">isSubmitted: {isSubmitted ? "✅ YES" : "❌ NO"}</Text>
                    <Text size="xs">isSubmitting: {isSubmitting ? "✅ YES" : "❌ NO"}</Text>
                    <Text size="xs">Answered: {answeredCount}/{questions.length}</Text>
                    <Text size="xs">Current Q: {currentQuestionIndex + 1}</Text>
                    <Text size="xs">Is Last Q: {currentQuestionIndex === questions.length - 1 ? "✅ YES" : "❌ NO"}</Text>
                </Stack>
            </Alert>
            
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

            {/* Header Quiz: Judul, Timer, Progress */}
            <Group justify="space-between" align="center" mb="lg">
                <Title order={4}>{quizData.quiz_title} (Percobaan {attemptNumber})</Title>
                <Group align="center">
                    <Paper withBorder px="sm" py={4} radius="sm" shadow="xs">
                        <Group gap="xs" align="center">
                            <IconClock size={16} color={isLowTime ? 'var(--mantine-color-red-7)' : 'var(--mantine-color-dimmed)'} />
                            <Text fw={500} size="sm" c={isLowTime ? 'red' : 'inherit'}>
                                {formatTime(timeLeft)}
                            </Text>
                        </Group>
                    </Paper>
                    <Box w={150}>
                        <Progress value={(currentQuestionIndex + 1) / questions.length * 100} size="sm" radius="sm" />
                        <Text size="xs" c="dimmed" ta="right">{currentQuestionIndex + 1} / {questions.length}</Text>
                    </Box>
                </Group>
            </Group>

            {/* Konten Pertanyaan */}
            <Paper 
                withBorder 
                p="lg" 
                radius="md" 
                mb="lg"
                bg={studentAnswers[currentQuestion.question_id] !== undefined ? "blue.0" : undefined}
            >
                <Text fw={500} mb="md" size="lg">
                    {currentQuestionIndex + 1}. {currentQuestion.question_text || 'Pertanyaan tidak ada teks.'}
                </Text>

                {/* Multiple Choice */}
                {currentQuestion.question_type === 'multiple_choice' && (
                    <Radio.Group
                        value={String(studentAnswers[currentQuestion.question_id] || '')}
                        onChange={(value) => handleAnswerChange(currentQuestion.question_id, Number(value), 'multiple_choice')}
                    >
                        <Stack gap="sm" mt="md">
                            {currentQuestion.options?.map((opt) => (
                                <Radio 
                                    key={opt.option_id} 
                                    value={String(opt.option_id)} 
                                    label={opt.option_text || 'Opsi kosong'}
                                    disabled={isSubmitted}
                                />
                            ))}
                        </Stack>
                    </Radio.Group>
                )}

                {/* Checkbox */}
                {currentQuestion.question_type === 'checkbox' && (
                    <Stack gap="sm" mt="md">
                        <Text size="xs" c="dimmed">(Pilih semua yang benar)</Text>
                        {currentQuestion.options?.map((opt) => {
                            const currentAnswers = (studentAnswers[currentQuestion.question_id] as number[]) || [];
                            const isChecked = currentAnswers.includes(opt.option_id);
                            
                            return (
                                <Checkbox
                                    key={opt.option_id}
                                    label={opt.option_text || 'Opsi kosong'}
                                    checked={isChecked}
                                    onChange={(event) => 
                                        handleAnswerChange(
                                            currentQuestion.question_id, 
                                            opt.option_id, 
                                            'checkbox'
                                        )
                                    }
                                    disabled={isSubmitted}
                                />
                            );
                        })}
                    </Stack>
                )}
            </Paper>

            {/* Tombol Navigasi & Submit */}
            <Group justify="space-between" mt="xl">
                <Button
                    variant="default"
                    leftSection={<IconChevronLeft size={16} />}
                    onClick={goToPrev}
                    disabled={currentQuestionIndex === 0 || isSubmitted}
                >
                    Sebelumnya
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                    <Button
                        color="green"
                        leftSection={<IconListCheck size={16} />}
                        onClick={() => {
                            console.log("🔘 Button clicked!");
                            console.log("🔘 isSubmitted:", isSubmitted);
                            console.log("🔘 isSubmitting:", isSubmitting);
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

            {/* Timeout Modal */}
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
                            <Text size="sm" c="dimmed">Menyimpan jawaban...</Text>
                        </Group>
                    )}
                </Stack>
            </Modal>
        </Box>
    );
}