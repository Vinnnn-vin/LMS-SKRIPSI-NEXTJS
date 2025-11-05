"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Stack,
  Title,
  Text,
  Button,
  Group,
  NumberInput,
  Textarea,
  Alert,
  Badge,
  Anchor,
  LoadingOverlay,
  Box,
  Divider,
  Select,
  Paper,
  ThemeIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconAlertCircle,
  IconDownload,
  IconLink,
  IconFile,
  IconFileText,
  IconInfoCircle,
} from "@tabler/icons-react";
import {
  reviewAssignmentSchema,
  ReviewAssignmentInput,
} from "@/lib/schemas/assignmentSubmission.schema";
import { gradeAssignmentByLecturer } from "@/app/actions/lecturer.actions";
import { notifications } from "@mantine/notifications";

interface AssignmentGradingModalProps {
  opened: boolean;
  onClose: () => void;
  submission: {
    submission_id: number;
    student: {
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
    };
    assignment: {
      material_detail_id: number;
      material_detail_name?: string | null;
      passing_score?: number | null;
    };
    status: "submitted" | "under_review" | "approved" | "rejected";
    score?: number | null;
    feedback?: string | null;
    submission_type: "file" | "url" | "text" | "both";
    file_path?: string | null;
    submission_url?: string | null;
    submission_text?: string | null;
  };
  onGradeSubmit: () => void;
  startTransition: React.TransitionStartFunction;
}

export function AssignmentGradingModal({
  opened,
  onClose,
  submission,
  onGradeSubmit,
  startTransition,
}: AssignmentGradingModalProps) {
  const [isPending, setIsPending] = useState(false);

  console.log(submission);
  
  const passingScore = submission.assignment.passing_score;

  const form = useForm<ReviewAssignmentInput>({
    initialValues: {
      status:
        submission.status === "approved"
          ? "approved"
          : submission.status === "rejected"
            ? "rejected"
            : "submitted",
      score: submission.score ?? null,
      feedback: submission.feedback ?? "",
    },
    validate: {
      status: (value) => (value ? null : "Status harus dipilih"),
      score: (value, values) => {
        if (values.status === "approved") {
          if (value === null || value === undefined) {
            return "Skor harus diisi untuk status disetujui";
          }
          if (value < passingScore) {
            return `Skor harus minimal ${passingScore} untuk disetujui`;
          }
        }
        if (values.status === "rejected") {
          if (value === null || value === undefined) {
            return "Skor harus diisi untuk status ditolak";
          }
          if (value >= passingScore) {
            return `Skor harus dibawah ${passingScore} untuk ditolak`;
          }
        }
        if (value !== null && (value < 0 || value > 100)) {
          return "Skor harus antara 0-100";
        }
        return null;
      },
    },
  });

  useEffect(() => {
    form.setValues({
      status:
        submission.status === "approved"
          ? "approved"
          : submission.status === "rejected"
            ? "rejected"
            : "submitted",
      score: submission.score ?? null,
      feedback: submission.feedback ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission]);

  const handleSubmit = (values: ReviewAssignmentInput) => {
    startTransition(() => {
      setIsPending(true);
      gradeAssignmentByLecturer(submission.submission_id, values)
        .then((result) => {
          if (result.success) {
            notifications.show({
              title: "Sukses",
              message: result.message,
              color: "green",
            });
            onGradeSubmit();
            onClose();
          } else {
            notifications.show({
              title: "Gagal",
              message: result.error,
              color: "red",
            });
          }
        })
        .catch((error) => {
          notifications.show({
            title: "Error",
            message: error.message || "Terjadi kesalahan server.",
            color: "red",
          });
        })
        .finally(() => {
          setIsPending(false);
        });
    });
  };

  const studentName =
    `${submission.student.first_name || ""} ${submission.student.last_name || ""}`.trim() ||
    submission.student.email;

  const hasFile =
    submission.submission_type === "file" ||
    submission.submission_type === "both";
  const hasText =
    submission.submission_type === "text" ||
    submission.submission_type === "both";
  const hasUrl = submission.submission_type === "url";

  // ✅ Helper untuk menentukan min/max score berdasarkan status
  const getScoreConstraints = () => {
    const status = form.values.status;
    if (status === "approved") {
      return { min: passingScore, max: 100 };
    }
    if (status === "rejected") {
      return { min: 0, max: passingScore > 0 ? passingScore - 1 : 0 };
    }
    return { min: 0, max: 100 };
  };

  const scoreConstraints = getScoreConstraints();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Review Tugas: ${submission.assignment.material_detail_name}`}
      size="lg"
      centered
      overlayProps={{ blur: 1 }}
    >
      <LoadingOverlay visible={isPending} />
      <Stack gap="md">
        <div>
          <Text size="sm">
            Mahasiswa: <strong>{studentName}</strong>
          </Text>
          <Text size="xs" c="dimmed">
            {submission.student.email}
          </Text>
        </div>

        {/* ✅ Tampilkan Passing Score */}
        <Alert color="blue" icon={<IconInfoCircle />}>
          <Text size="sm" fw={500}>
            Passing Score: {passingScore}%
          </Text>
          <Text size="xs" c="dimmed">
            Disetujui: ≥ {passingScore} | Ditolak: &lt; {passingScore}
          </Text>
        </Alert>

        <Divider label="Konten Jawaban" labelPosition="center" />

        {hasFile && submission.file_path && (
          <Paper withBorder p="md" radius="md">
            <Group gap="xs" mb="xs">
              <ThemeIcon size="sm" color="blue" variant="light">
                <IconFile size={16} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                File Submission:
              </Text>
            </Group>
            <Button
              component="a"
              href={submission.file_path}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              leftSection={<IconDownload size={16} />}
              fullWidth
            >
              Download / Lihat File
            </Button>
          </Paper>
        )}

        {hasUrl && submission.submission_url && (
          <Paper withBorder p="md" radius="md">
            <Group gap="xs" mb="xs">
              <ThemeIcon size="sm" color="teal" variant="light">
                <IconLink size={16} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                URL Submission:
              </Text>
            </Group>
            <Anchor
              href={submission.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              {submission.submission_url}
            </Anchor>
          </Paper>
        )}

        {hasText && submission.submission_text && (
          <Paper withBorder p="md" radius="md" bg="gray.0">
            <Group gap="xs" mb="xs">
              <ThemeIcon size="sm" color="violet" variant="light">
                <IconFileText size={16} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                Jawaban Teks:
              </Text>
            </Group>
            <Text
              size="sm"
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                padding: "8px 0",
              }}
            >
              {submission.submission_text}
            </Text>
          </Paper>
        )}

        {!submission.file_path &&
          !submission.submission_url &&
          !submission.submission_text && (
            <Alert color="yellow" icon={<IconAlertCircle />}>
              Mahasiswa tidak mengirimkan konten jawaban.
            </Alert>
          )}

        <Divider label="Form Penilaian" labelPosition="center" />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Select
              label="Status Penilaian"
              data={[
                { value: "submitted", label: "Belum Dinilai (Submitted)" },
                { value: "approved", label: "Disetujui (Lulus)" },
                { value: "rejected", label: "Ditolak (Tidak Lulus)" },
              ]}
              required
              {...form.getInputProps("status")}
            />

            {form.values.status !== "submitted" && (
              <NumberInput
                label={`Skor (${scoreConstraints.min}-${scoreConstraints.max})`}
                placeholder="Masukkan skor"
                min={scoreConstraints.min}
                max={scoreConstraints.max}
                allowDecimal={false}
                required
                {...form.getInputProps("score")}
                description={
                  form.values.status === "approved"
                    ? `Minimal ${passingScore} untuk disetujui`
                    : form.values.status === "rejected"
                      ? `Maksimal ${scoreConstraints.max} untuk ditolak`
                      : undefined
                }
              />
            )}

            <Textarea
              label="Feedback / Komentar (Opsional)"
              placeholder="Berikan masukan untuk mahasiswa..."
              minRows={4}
              {...form.getInputProps("feedback")}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" loading={isPending}>
                Simpan Penilaian
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}