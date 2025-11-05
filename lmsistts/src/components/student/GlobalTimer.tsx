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
  LoadingOverlay
} from "@mantine/core";
import { 
  IconClock, 
  IconAlertTriangle, 
  IconInfinity,
  IconReload 
} from "@tabler/icons-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

interface GlobalTimerProps {
  courseId: number;
  enrollmentId: number;
  courseDuration: number; // dalam jam (0 = unlimited)
  learningStartedAt: string | null;
  enrolledAt: string;
  onTimeExpired: () => Promise<void>;
}

export default function GlobalTimer({
  courseId,
  enrollmentId,
  courseDuration,
  learningStartedAt,
  enrolledAt,
  onTimeExpired,
}: GlobalTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  // Format waktu untuk ditampilkan (HH:mm:ss)
  const formatTime = (seconds: number): string => {
    const dur = dayjs.duration(seconds, "seconds");
    const hours = Math.floor(dur.asHours());
    const minutes = dur.minutes();
    const secs = dur.seconds();
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Hitung remaining time
  const calculateRemainingTime = useCallback(() => {
    // Jika unlimited (duration = 0)
    if (!courseDuration || courseDuration === 0) {
      setIsLoading(false);
      return null;
    }

    const startTime = learningStartedAt || enrolledAt;
    if (!startTime) {
      setIsLoading(false);
      return null;
    }

    // Hitung deadline
    const deadline = dayjs(startTime).add(courseDuration, "hour");
    const now = dayjs();

    // Cek expired
    if (now.isAfter(deadline)) {
      setIsExpired(true);
      setIsLoading(false);
      return 0;
    }

    // Hitung sisa detik
    const remaining = deadline.diff(now, "second");
    setIsLoading(false);
    return remaining;
  }, [courseDuration, learningStartedAt, enrolledAt]);

  // Initialize timer
  useEffect(() => {
    const initial = calculateRemainingTime();
    setRemainingSeconds(initial);
    
    // Jika sudah expired saat load, tampilkan modal
    if (initial === 0) {
      setShowExpiredModal(true);
    }
  }, [calculateRemainingTime]);

  // Countdown interval
  useEffect(() => {
    // Skip jika unlimited atau sudah expired
    if (!courseDuration || courseDuration === 0 || isExpired) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          setShowExpiredModal(true); // Tampilkan modal
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [courseDuration, isExpired]);

  // Handle reset progress
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

  // Jika loading
  if (isLoading) {
    return null;
  }

  // Jika unlimited time
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

  // Hitung percentage untuk progress bar
  const totalSeconds = courseDuration * 3600; // total dalam detik
  const percentage = Math.max(
    0,
    Math.min(100, (remainingSeconds / totalSeconds) * 100)
  );

  // Tentukan warna berdasarkan sisa waktu
  const getColor = () => {
    if (percentage > 50) return "blue";
    if (percentage > 20) return "yellow";
    return "red";
  };

  // Warning jika kurang dari 1 jam
  const showWarning = remainingSeconds < 3600 && remainingSeconds > 0;

  // Format deadline untuk ditampilkan
  const startTime = learningStartedAt || enrolledAt;
  const deadline = dayjs(startTime).add(courseDuration, "hour");
  const deadlineFormatted = deadline.format("DD MMM YYYY, HH:mm");

  return (
    <>
      {/* Modal Expired - Blocking */}
      <Modal
        opened={showExpiredModal}
        onClose={() => {}} // Tidak bisa ditutup tanpa action
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
            <strong>Progress akan direset ke 0</strong> dan Anda bisa memulai pembelajaran dari awal.
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

      {/* Timer Display */}
      <Stack gap="xs">
        <Alert
          icon={<IconClock size={16} />}
          color={isExpired ? "orange" : getColor()}
          variant="light"
          radius="md"
        >
          {isExpired ? (
            // Tampilan saat expired (tidak akan terlihat karena modal muncul)
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
                    ⚠️ <strong>Perhatian!</strong> Waktu belajar Anda hampir habis.
                    Progress akan direset jika waktu berakhir!
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