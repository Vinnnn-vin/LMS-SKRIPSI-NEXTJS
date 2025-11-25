// src/components/student/ViewCertificateButton.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@mantine/core";
import { IconCertificate } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { getOrGenerateCertificate } from "@/app/actions/student.actions";

export function ViewCertificateButton({ 
  courseId, 
  fullWidth = false,
  variant = "light",
  color = "green"
}: { 
  courseId: number;
  fullWidth?: boolean;
  variant?: string;
  color?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const result = await getOrGenerateCertificate(courseId);

        if (result.success && result.url) {
          // Buka di tab baru
          window.open(result.url, "_blank");
        } else {
          notifications.show({
            title: "Gagal",
            message: result.error || "Sertifikat belum tersedia.",
            color: "red",
          });
        }
      } catch (error) {
        notifications.show({
          title: "Error",
          message: "Terjadi kesalahan jaringan.",
          color: "red",
        });
      }
    });
  };

  return (
    <Button
      variant={variant}
      color={color}
      fullWidth={fullWidth}
      radius="md"
      leftSection={<IconCertificate size={16} />}
      onClick={handleClick}
      loading={isPending}
    >
      Lihat Sertifikat
    </Button>
  );
}