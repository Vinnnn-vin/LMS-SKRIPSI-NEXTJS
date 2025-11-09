// lmsistts\src\components\lecturer\AssignmentGradingModal.tsx

"use client";

import { useState } from "react";
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
  Divider,
  Select,
  Paper,
  ThemeIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
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
  type AssignmentRowData,
} from "@/lib/schemas/assignmentSubmission.schema";
import { gradeAssignmentByLecturer } from "@/app/actions/lecturer.actions";
import { notifications } from "@mantine/notifications";

interface AssignmentGradingModalProps {
  opened: boolean;
  onClose: () => void;
  submission: AssignmentRowData;
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
  const passingScore = submission.assignment.passing_score ?? 70;

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
    validate: zod4Resolver(reviewAssignmentSchema),
    validateInputOnChange: true,
    enhanceGetInputProps: () => ({
      onBlur: () => {
        const status = form.values.status;
        const score = form.values.score;

        if (status === "approved") {
          if (score === null || score === undefined) {
            form.setFieldError(
              "score",
              "Skor harus diisi untuk status disetujui"
            );
          } else if (score < passingScore) {
            form.setFieldError(
              "score",
              `Skor harus minimal ${passingScore} untuk disetujui`
            );
          } else {
            form.clearFieldError("score");
          }
        } else if (status === "rejected") {
          if (score === null || score === undefined) {
            form.setFieldError(
              "score",
              "Skor harus diisi untuk status ditolak"
            );
          } else if (score >= passingScore) {
            form.setFieldError(
              "score",
              `Skor harus dibawah ${passingScore} untuk ditolak`
            );
          } else {
            form.clearFieldError("score");
          }
        }
      },
    }),
  });

  const validateBeforeSubmit = (): boolean => {
    const { status, score } = form.values;

    if (status === "approved") {
      if (score === null || score === undefined) {
        form.setFieldError("score", "Skor harus diisi untuk status disetujui");
        return false;
      }
      if (score < passingScore) {
        form.setFieldError(
          "score",
          `Skor harus minimal ${passingScore} untuk disetujui`
        );
        return false;
      }
    }

    if (status === "rejected") {
      if (score === null || score === undefined) {
        form.setFieldError("score", "Skor harus diisi untuk status ditolak");
        return false;
      }
      if (score >= passingScore) {
        form.setFieldError(
          "score",
          `Skor harus dibawah ${passingScore} untuk ditolak`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (values: ReviewAssignmentInput) => {
    if (!validateBeforeSubmit()) {
      return;
    }

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
      key={submission.submission_id}
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
              onChange={(value) => {
                form.setFieldValue("status", value as any);
                form.clearFieldError("score");
              }}
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
