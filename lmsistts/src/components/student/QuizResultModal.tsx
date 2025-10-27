// src/components/student/QuizResultModal.tsx
"use client";

import { Modal, Stack, Title, Text, Paper, Group, Badge, Button, Divider, Progress, Alert, List, ThemeIcon } from '@mantine/core';
import { IconTrophy, IconX, IconCheck, IconAlertCircle, IconClock, IconTarget } from '@tabler/icons-react';

interface QuizResultModalProps {
  opened: boolean;
  onClose: () => void;
  result: {
    score: number;
    status: 'passed' | 'failed';
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number; // dalam detik
    passingScore: number;
    attemptNumber: number;
    remainingAttempts: number;
    certificateGranted?: boolean;
  };
}

export function QuizResultModal({ opened, onClose, result }: QuizResultModalProps) {
  const isPassed = result.status === 'passed';
  const percentage = result.score;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} menit ${secs} detik`;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Stack gap="lg" p="md">
        {/* Header Icon & Status */}
        <Group justify="center">
          <ThemeIcon
            size={80}
            radius="xl"
            color={isPassed ? 'green' : 'red'}
            variant="light"
          >
            {isPassed ? <IconTrophy size={40} /> : <IconX size={40} />}
          </ThemeIcon>
        </Group>

        {/* Title */}
        <Stack gap="xs" align="center">
          <Title order={2} c={isPassed ? 'green' : 'red'}>
            {isPassed ? '🎉 Selamat! Quiz Lulus!' : '📚 Belum Lulus'}
          </Title>
          <Text size="sm" c="dimmed">
            Percobaan ke-{result.attemptNumber}
          </Text>
        </Stack>

        {/* Score Display */}
        <Paper withBorder p="xl" radius="md" bg={isPassed ? 'green.0' : 'red.0'}>
          <Stack gap="md" align="center">
            <Text size="sm" fw={500} c="dimmed">
              SKOR ANDA
            </Text>
            <Title order={1} size={60} c={isPassed ? 'green' : 'red'}>
              {percentage}%
            </Title>
            <Progress
              value={percentage}
              size="xl"
              radius="xl"
              color={isPassed ? 'green' : 'red'}
              style={{ width: '100%' }}
            />
            <Group gap="xl">
              <div style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed">Benar</Text>
                <Text size="lg" fw={700} c="green">
                  {result.correctAnswers}/{result.totalQuestions}
                </Text>
              </div>
              <Divider orientation="vertical" />
              <div style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed">Minimum</Text>
                <Text size="lg" fw={700}>
                  {result.passingScore}%
                </Text>
              </div>
            </Group>
          </Stack>
        </Paper>

        {/* Details */}
        <Paper withBorder p="md" radius="md">
          <List
            spacing="sm"
            size="sm"
            icon={
              <ThemeIcon size={20} radius="xl" color="blue" variant="light">
                <IconCheck size={12} />
              </ThemeIcon>
            }
          >
            <List.Item
              icon={
                <ThemeIcon size={20} radius="xl" color="blue" variant="light">
                  <IconClock size={12} />
                </ThemeIcon>
              }
            >
              <Text size="sm">
                Waktu Pengerjaan: <strong>{formatTime(result.timeTaken)}</strong>
              </Text>
            </List.Item>
            <List.Item
              icon={
                <ThemeIcon size={20} radius="xl" color="blue" variant="light">
                  <IconTarget size={12} />
                </ThemeIcon>
              }
            >
              <Text size="sm">
                Jawaban Benar: <strong>{result.correctAnswers} dari {result.totalQuestions} soal</strong>
              </Text>
            </List.Item>
            <List.Item
              icon={
                <ThemeIcon size={20} radius="xl" color={result.remainingAttempts > 0 ? 'orange' : 'red'} variant="light">
                  <IconAlertCircle size={12} />
                </ThemeIcon>
              }
            >
              <Text size="sm">
                Sisa Percobaan: <strong>{result.remainingAttempts} kali</strong>
              </Text>
            </List.Item>
          </List>
        </Paper>

        {/* Certificate Alert */}
        {result.certificateGranted && (
          <Alert color="green" title="🎓 Sertifikat Telah Dibuat!" icon={<IconTrophy />}>
            Selamat! Anda telah menyelesaikan seluruh kursus. Sertifikat Anda sudah tersedia di menu Sertifikat.
          </Alert>
        )}

        {/* Status Message */}
        {!isPassed && result.remainingAttempts > 0 && (
          <Alert color="orange" icon={<IconAlertCircle />}>
            Jangan berkecil hati! Anda masih memiliki {result.remainingAttempts} kesempatan lagi. 
            Pelajari kembali materi dan coba lagi.
          </Alert>
        )}

        {!isPassed && result.remainingAttempts === 0 && (
          <Alert color="red" icon={<IconX />}>
            Anda telah mencapai batas maksimal percobaan. Silakan hubungi dosen untuk bantuan lebih lanjut.
          </Alert>
        )}

        {/* Action Button */}
        <Button
          fullWidth
          size="lg"
          onClick={onClose}
          color={isPassed ? 'green' : 'blue'}
        >
          {isPassed ? 'Lanjut Belajar' : result.remainingAttempts > 0 ? 'Tutup & Ulangi' : 'Tutup'}
        </Button>
      </Stack>
    </Modal>
  );
}