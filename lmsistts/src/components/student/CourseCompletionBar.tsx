// src/components/student/CourseCompletionBar.tsx
"use client";

import { useState, useTransition } from "react";
import {
  Paper,
  Group,
  Button,
  Modal,
  Stack,
  Textarea,
  Rating,
  Title,
  Text,
  LoadingOverlay,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCertificate, IconEdit, IconCheck } from "@tabler/icons-react";
import { z } from "zod";
import { zod4Resolver } from "mantine-form-zod-resolver";
// 1. Import action getOrGenerateCertificate
import { 
  createOrUpdateReview, 
  getOrGenerateCertificate 
} from "@/app/actions/student.actions"; 
import { useRouter } from "next/navigation";

// Skema validasi untuk form review
const reviewSchema = z.object({
  rating: z.number().min(1, { message: "Rating wajib diisi" }),
  review_text: z.string().min(10, { message: "Review minimal 10 karakter" }),
});
type ReviewInput = z.infer<typeof reviewSchema>;

interface CourseCompletionBarProps {
  totalProgress: number;
  courseId: number;
  certificateNumber: string | null;
  existingReview: { rating: number; review_text: string } | null;
}

export function CourseCompletionBar({
  totalProgress,
  courseId,
  certificateNumber, // Kita tetap terima props ini untuk kebutuhan lain jika ada
  existingReview,
}: CourseCompletionBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpened, setModalOpened] = useState(false);
  
  // 2. Tambahkan state loading khusus untuk tombol sertifikat
  const [isCertLoading, setIsCertLoading] = useState(false);

  const form = useForm<ReviewInput>({
    initialValues: {
      rating: existingReview?.rating || 0,
      review_text: existingReview?.review_text || "",
    },
    validate: zod4Resolver(reviewSchema),
  });

  // Hanya tampilkan jika progres 100%
  if (totalProgress < 100) {
    return null;
  }

  const handleSubmitReview = (values: ReviewInput) => {
    startTransition(async () => {
      const result = await createOrUpdateReview({
        courseId: courseId,
        rating: values.rating,
        reviewText: values.review_text,
      });

      if (result.success) {
        notifications.show({
          title: "Review Terkirim",
          message: result.message,
          color: "green",
          icon: <IconCheck size={16} />,
        });
        setModalOpened(false);
        router.refresh();
      } else {
        notifications.show({
          title: "Gagal",
          message: result.error,
          color: "red",
        });
      }
    });
  };

  const handleViewCertificate = async () => {
    setIsCertLoading(true);
    try {
      const result = await getOrGenerateCertificate(courseId);

      if (result.success && result.url) {
        window.open(result.url, '_blank');
        
        router.refresh();
      } else {
        notifications.show({
          title: "Gagal Memuat Sertifikat",
          message: result.error || "Terjadi kesalahan saat memproses sertifikat.",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Terjadi kesalahan jaringan.",
        color: "red",
      });
    } finally {
      setIsCertLoading(false);
    }
  };

  return (
    <>
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={existingReview ? "Edit Review Anda" : "Tulis Review Kursus"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmitReview)}>
          <Stack pos="relative">
            <LoadingOverlay visible={isPending} />
            <Stack align="center">
              <Title order={5}>Berikan Rating Anda</Title>
              <Rating size="lg" {...form.getInputProps("rating")} />
              {form.errors.rating && (
                <Text size="xs" c="red">
                  {form.errors.rating}
                </Text>
              )}
            </Stack>
            <Textarea
              label="Tulis Ulasan Anda"
              placeholder="Bagikan pengalaman belajar Anda di kursus ini..."
              minRows={5}
              {...form.getInputProps("review_text")}
              error={form.errors.review_text}
            />
            <Button type="submit" mt="md" loading={isPending}>
              Kirim Review
            </Button>
          </Stack>
        </form>
      </Modal>

      <Paper
        withBorder
        p="lg"
        radius="md"
        shadow="lg"
        style={{
          position: "sticky",
          bottom: "1rem",
          zIndex: 10,
          width: "100%",
        }}
      >
        <Group justify="space-between">
          <Stack gap="xs">
            <Title order={4}>🎉 Selamat! Kursus Selesai!</Title>
            <Text c="dimmed" size="sm">
              Anda telah menyelesaikan 100% materi kursus.
            </Text>
          </Stack>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconEdit size={16} />}
              onClick={() => setModalOpened(true)}
            >
              {existingReview ? "Edit Review" : "Beri Review"}
            </Button>

            {/* 4. Update Tombol Sertifikat */}
            <Button
              onClick={handleViewCertificate}
              loading={isCertLoading}
              leftSection={<IconCertificate size={16} />}
              variant="gradient"
              gradient={{ from: "blue", to: "cyan" }}
            >
              Lihat Sertifikat
            </Button>
          </Group>
        </Group>
      </Paper>
    </>
  );
}