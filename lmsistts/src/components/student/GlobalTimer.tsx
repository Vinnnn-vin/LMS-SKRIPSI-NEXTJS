// lmsistts\src\components\student\GlobalTimer.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Progress,
  Text,
  Badge,
  Group,
  Stack,
  Modal,
  Button,
  LoadingOverlay,
} from "@mantine/core";
import {
  IconClock,
  IconAlertTriangle,
  IconInfinity,
  IconReload,
  IconCheck,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

interface GlobalTimerProps {
  courseId: number;
  enrollmentId: number;
  courseDuration: number;
  learningStartedAt: string | null;
  enrolledAt: string;
  onTimeExpired: () => Promise<void>;
  totalProgress: number;
}

export default function GlobalTimer({
  courseId,
  enrollmentId,
  courseDuration,
  learningStartedAt,
  enrolledAt,
  onTimeExpired,
  totalProgress,
}: GlobalTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const formatTime = (seconds: number): string => {
    const dur = dayjs.duration(seconds, "seconds");
    const hours = Math.floor(dur.asHours());
    const minutes = dur.minutes();
    const secs = dur.seconds();
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateRemainingTime = useCallback(() => {
    if (totalProgress === 100) {
      setIsLoading(false);
      setIsExpired(true); // Anggap "selesai" sama dengan "expired" untuk UI
      return 0;
    }

    if (!courseDuration || courseDuration === 0) {
      setIsLoading(false);
      return null;
    }

    const startTime = learningStartedAt || enrolledAt;
    if (!startTime) {
      setIsLoading(false);
      return null;
    }

    const deadline = dayjs(startTime).add(courseDuration, "hour");
    const now = dayjs();

    if (now.isAfter(deadline)) {
      setIsExpired(true);
      setIsLoading(false);
      return 0;
    }

    const remaining = deadline.diff(now, "second");
    setIsLoading(false);
    return remaining;
  }, [courseDuration, learningStartedAt, enrolledAt, totalProgress]);

  useEffect(() => {
    const initial = calculateRemainingTime();
    setRemainingSeconds(initial);

    if (initial === 0 && totalProgress < 100) { // <-- Perbarui kondisi modal
      setShowExpiredModal(true);
    }
  }, [calculateRemainingTime, totalProgress]);

  useEffect(() => {
    if (!courseDuration || courseDuration === 0 || isExpired || totalProgress === 100) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          setShowExpiredModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [courseDuration, isExpired, totalProgress]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onTimeExpired();
    } catch (error) {
      console.error("Failed to reset:", error);
    } finally {
      setIsResetting(false);
      setShowExpiredModal(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (totalProgress === 100 && courseDuration > 0) {
     return (
       <Alert
        icon={<IconCheck size={16} />}
        color="green"
        variant="light"
        radius="md"
      >
        <Text size="sm" fw={500}>
          Kursus Selesai
        </Text>
      </Alert>
     );
  }

  if (!courseDuration || courseDuration === 0 || remainingSeconds === null) {
    return (
      <Alert
        icon={<IconInfinity size={16} />}
        color="blue"
        variant="light"
        radius="md"
      >
        <Group justify="space-between">
          <Text size="sm" fw={500}>
            Waktu Belajar: Unlimited
          </Text>
          <Badge color="blue" variant="filled" size="lg">
            ∞
          </Badge>
        </Group>
      </Alert>
    );
  }

  const totalSeconds = courseDuration * 3600;
  const percentage = Math.max(
    0,
    Math.min(100, (remainingSeconds / totalSeconds) * 100)
  );

  const getColor = () => {
    if (percentage > 50) return "blue";
    if (percentage > 20) return "yellow";
    return "red";
  };

  const showWarning = remainingSeconds < 3600 && remainingSeconds > 0;

  const startTime = learningStartedAt || enrolledAt;
  const deadline = dayjs(startTime).add(courseDuration, "hour");
  const deadlineFormatted = deadline.format("DD MMM YYYY, HH:mm");

  return (
    <>
      <Modal
        opened={showExpiredModal}
        onClose={() => {}}
        withCloseButton={false}
        centered
        size="md"
        overlayProps={{
          backgroundOpacity: 0.7,
          blur: 3,
        }}
      >
        <Stack align="center" gap="md" p="md">
          <IconAlertTriangle size={60} color="var(--mantine-color-orange-6)" />
          <Text size="xl" fw={700} ta="center">
            ⏰ Waktu Belajar Habis
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Masa akses Anda untuk kursus ini telah berakhir.
            <br />
            <strong>Progress akan direset ke 0</strong> dan Anda bisa memulai
            pembelajaran dari awal.
          </Text>
          <Button
            fullWidth
            size="lg"
            color="orange"
            leftSection={<IconReload size={18} />}
            onClick={handleReset}
            loading={isResetting}
          >
            Reset & Mulai Ulang
          </Button>
        </Stack>
        <LoadingOverlay visible={isResetting} overlayProps={{ blur: 2 }} />
      </Modal>

      <Stack gap="xs">
        <Alert
          icon={<IconClock size={16} />}
          color={isExpired ? "orange" : getColor()}
          variant="light"
          radius="md"
        >
          {isExpired ? (
            <Text size="sm" fw={500} c="orange">
              ⏰ Waktu habis - Klik tombol reset untuk memulai ulang
            </Text>
          ) : (
            <>
              <Group justify="space-between" align="center" wrap="nowrap">
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={500} mb={4}>
                    ⏱️ Sisa Waktu Belajar
                  </Text>
                  <Text size="xl" fw={700} c={getColor()} mb={4}>
                    {formatTime(remainingSeconds)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Deadline: {deadlineFormatted}
                  </Text>
                </div>
                <Badge color={getColor()} variant="filled" size="xl">
                  {Math.floor(percentage)}%
                </Badge>
              </Group>

              <Progress
                value={percentage}
                color={getColor()}
                size="md"
                mt="sm"
                radius="sm"
                animated={showWarning}
              />

              {showWarning && (
                <Alert
                  icon={<IconAlertTriangle size={14} />}
                  color="orange"
                  variant="light"
                  mt="sm"
                  p="xs"
                >
                  <Text size="xs">
                    ⚠️ <strong>Perhatian!</strong> Waktu belajar Anda hampir
                    habis. Progress akan direset jika waktu berakhir!
                  </Text>
                </Alert>
              )}
            </>
          )}
        </Alert>
      </Stack>
    </>
  );
}
