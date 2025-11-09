// lmsistts\src\components\student\CompleteButton.tsx

"use client";

import React from "react";
import { Button } from "@mantine/core";
import { IconCircleCheckFilled, IconPlayerPlay } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useTransition } from "react";
import { markMaterialAsComplete } from "@/app/actions/student.actions";

export function CompleteButton({
  materialDetailId,
  courseId,
  enrollmentId,
  isCompleted,
  onComplete,
}: {
  materialDetailId: number;
  courseId: number;
  enrollmentId: number;
  isCompleted: boolean;
  onComplete: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await markMaterialAsComplete(materialDetailId, courseId, enrollmentId);
      if (result.success) {
        notifications.show({
          title: result.certificateGranted ? "🎉 Selamat! Kursus Selesai!" : "Progres Disimpan!",
          message: result.certificateGranted ? "Anda telah menyelesaikan seluruh kursus! Sertifikat Anda telah dibuat." : "Materi telah ditandai selesai.",
          color: result.certificateGranted ? "green" : "blue",
          autoClose: result.certificateGranted ? 10000 : 3000,
        });
        onComplete();
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Gagal menyimpan progres",
          color: "red",
        });
      }
    });
  };

  return (
    <Button color={isCompleted ? "green" : "blue"} leftSection={isCompleted ? <IconCircleCheckFilled size={16} /> : <IconPlayerPlay size={16} />} onClick={handleClick} loading={isPending} disabled={isCompleted}>
      {isCompleted ? "Telah Selesai" : "Tandai Selesai"}
    </Button>
  );
}
