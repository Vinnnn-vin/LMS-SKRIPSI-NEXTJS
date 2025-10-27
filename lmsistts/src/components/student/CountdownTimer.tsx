// src/components/student/CountdownTimer.tsx
"use client";

import { useState, useEffect } from "react";
import { Paper, Group, Text, ThemeIcon, Stack, Progress, Badge } from "@mantine/core";
import { IconClock, IconAlertCircle, IconCalendarTime } from "@tabler/icons-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/id";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale("id");

interface CountdownTimerProps {
  expiresAt: Date | string | null;
  type: "course" | "quiz";
  title?: string;
  showProgress?: boolean;
  startedAt?: Date | string;
  onExpire?: () => void; // ✅ event handler untuk waktu habis
}

export function CountdownTimer({
  expiresAt,
  type,
  title,
  showProgress = true,
  startedAt,
  onExpire,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(100);

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const now = dayjs();
      const end = dayjs(expiresAt);
      const diff = end.diff(now);

      // Jika waktu sudah habis
      if (diff <= 0) {
        if (!isExpired) {
          setIsExpired(true);
          if (onExpire) onExpire(); // ✅ trigger event onExpire sekali
        }
        setTimeLeft("Waktu Habis");
        setProgressPercentage(0);
        return;
      }

      const d = dayjs.duration(diff);
      const days = Math.floor(d.asDays());
      const hours = d.hours();
      const minutes = d.minutes();
      const seconds = d.seconds();

      let timeString = "";
      if (days > 0) timeString = `${days} hari ${hours} jam`;
      else if (hours > 0) timeString = `${hours} jam ${minutes} menit`;
      else if (minutes > 0) timeString = `${minutes} menit ${seconds} detik`;
      else timeString = `${seconds} detik`;

      setTimeLeft(timeString);

      // Hitung progress bar
      if (showProgress && startedAt) {
        const start = dayjs(startedAt);
        const total = end.diff(start);
        const elapsed = now.diff(start);
        const percentage = Math.max(0, Math.min(100, ((total - elapsed) / total) * 100));
        setProgressPercentage(percentage);
      } else if (showProgress && !startedAt) {
        const daysLeft = end.diff(now, "day");
        const percentage = Math.max(0, Math.min(100, (daysLeft / 30) * 100));
        setProgressPercentage(percentage);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, showProgress, startedAt, onExpire, isExpired]);

  // Jika kursus tidak memiliki batas waktu
  if (!expiresAt) {
    return (
      <Paper withBorder p="sm" radius="md" bg="gray.0">
        <Group gap="xs">
          <ThemeIcon size="sm" color="gray" variant="light">
            <IconCalendarTime size={16} />
          </ThemeIcon>
          <Text size="sm" c="dimmed">
            Akses Tidak Terbatas
          </Text>
        </Group>
      </Paper>
    );
  }

  const isUrgent = !isExpired && dayjs(expiresAt).diff(dayjs(), "hour") < 24;
  const isCritical = !isExpired && dayjs(expiresAt).diff(dayjs(), "hour") < 1;

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      bg={
        isExpired ? "red.0" : isCritical ? "red.0" : isUrgent ? "orange.0" : "blue.0"
      }
    >
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <ThemeIcon
              size="md"
              color={
                isExpired ? "red" : isCritical ? "red" : isUrgent ? "orange" : "blue"
              }
              variant="light"
            >
              {isExpired || isCritical ? (
                <IconAlertCircle size={18} />
              ) : (
                <IconClock size={18} />
              )}
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">
                {title ||
                  (type === "course"
                    ? "Sisa Waktu Akses Kursus"
                    : "Sisa Waktu Quiz")}
              </Text>
              <Text
                size="sm"
                fw={700}
                c={isExpired ? "red" : isCritical ? "red" : isUrgent ? "orange" : "blue"}
              >
                {timeLeft}
              </Text>
            </div>
          </Group>

          {(isUrgent || isExpired) && (
            <Badge
              color={isExpired ? "red" : "orange"}
              variant="filled"
              size="sm"
            >
              {isExpired ? "EXPIRED" : "URGENT"}
            </Badge>
          )}
        </Group>

        {showProgress && (
          <Progress
            value={progressPercentage}
            size="sm"
            radius="xl"
            color={
              isExpired ? "red" : isCritical ? "red" : isUrgent ? "orange" : "blue"
            }
            animated={!isExpired}
          />
        )}

        <Text size="xs" c="dimmed">
          Berakhir: {dayjs(expiresAt).format("dddd, DD MMMM YYYY • HH:mm")}
        </Text>
      </Stack>
    </Paper>
  );
}

// ✅ Komponen khusus untuk timer kuis yang lebih kecil
export function QuizTimer({ timeLeftSeconds }: { timeLeftSeconds: number }) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isLowTime = timeLeftSeconds < 60;
  const isCritical = timeLeftSeconds < 30;

  return (
    <Paper
      withBorder
      px="md"
      py="xs"
      radius="md"
      bg={isCritical ? "red.1" : isLowTime ? "orange.1" : "blue.0"}
    >
      <Group gap="xs" align="center">
        <IconClock
          size={18}
          color={
            isCritical
              ? "var(--mantine-color-red-7)"
              : isLowTime
              ? "var(--mantine-color-orange-7)"
              : "var(--mantine-color-blue-7)"
          }
        />
        <Text
          fw={700}
          size="md"
          c={isCritical ? "red" : isLowTime ? "orange" : "blue"}
        >
          {formatTime(timeLeftSeconds)}
        </Text>
      </Group>
    </Paper>
  );
}
