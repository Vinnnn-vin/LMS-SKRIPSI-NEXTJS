// src/components/student/AssignmentSubmissionArea.tsx
"use client";

import { useState, useTransition } from "react";
import {
  Stack,
  FileInput,
  Textarea,
  Button,
  Group,
  Text,
  Alert,
  Paper,
  Divider,
  Title,
  LoadingOverlay,
  Timeline,
  Badge,
  Card,
  ThemeIcon,
} from "@mantine/core";
import {
  IconUpload,
  IconDownload,
  IconAlertCircle,
  IconClock,
  IconCircleCheckFilled,
  IconX,
  IconChecks,
  IconFile,
  IconMessage,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { createOrUpdateAssignmentSubmission } from "@/app/actions/student.actions";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/id";

dayjs.extend(relativeTime);
dayjs.locale("id");

interface AssignmentSubmissionAreaProps {
  materialDetailId: number;
  courseId: number;
  enrollmentId: number;
  existingSubmission: any | null;
  submissionHistory?: any[];
  // ✅ REMOVED: canSubmit prop - dihitung di dalam komponen
  onSubmit: () => void;
}

export function AssignmentSubmissionArea({
  materialDetailId,
  courseId,
  enrollmentId,
  existingSubmission,
  submissionHistory = [],
  onSubmit,
}: AssignmentSubmissionAreaProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // ✅ FIXED: Hitung canSubmit di dalam komponen berdasarkan status
  const status = existingSubmission?.status;
  const isApproved = status === "approved";
  const canSubmit = !isApproved; // Boleh submit selama belum approved

  const handleSubmit = () => {
    setError(null);
    if (!file && !text) {
      setError("Anda harus memilih file atau mengisi jawaban teks.");
      return;
    }

    startTransition(async () => {
      let uploadedFilePath: string | null = null;
      let submissionType: "file" | "text" = "text";

      // Step 1: Upload File jika ada
      if (file) {
        submissionType = "file";
        setIsUploading(true);
        console.log("📤 Uploading assignment file:", file.name);
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("fileType", "assignments");

        try {
          const response = await fetch("/api/upload/file", {
            method: "POST",
            body: uploadFormData,
          });
          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || "Gagal upload file jawaban.");
          }
          console.log("✅ File uploaded, URL:", result.url);
          uploadedFilePath = result.url;
        } catch (uploadError: any) {
          setError(`Upload Gagal: ${uploadError.message}`);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Step 2: Panggil Server Action
      const formData = new FormData();
      formData.append("materialDetailId", String(materialDetailId));
      formData.append("courseId", String(courseId));
      formData.append("enrollmentId", String(enrollmentId));
      formData.append("submission_type", submissionType);

      if (submissionType === "file" && uploadedFilePath) {
        formData.append("file_path", uploadedFilePath);
      } else if (submissionType === "text") {
        formData.append("submission_text", text);
      } else {
        setError("Konten submission tidak ditemukan setelah upload.");
        return;
      }

      try {
        const actionResult = await createOrUpdateAssignmentSubmission(formData);

        if (actionResult.success) {
          notifications.show({
            title: "Sukses",
            message: actionResult.message,
            color: "green",
            icon: <IconChecks size={16} />,
          });
          setFile(null);
          setText("");
          setError(null);
          onSubmit(); // Trigger refresh
        } else {
          setError(actionResult.error || "Gagal mengumpulkan tugas.");
        }
      } catch (actionError: any) {
        setError(
          actionError.message || "Terjadi kesalahan server saat submit."
        );
      }
    });
  };

  const submissionDate = existingSubmission?.submitted_at
    ? dayjs(existingSubmission.submitted_at).format(
        "dddd, DD MMMM YYYY • HH:mm"
      )
    : null;
  const submissionRelativeTime = existingSubmission?.submitted_at
    ? dayjs(existingSubmission.submitted_at).fromNow()
    : null;
  const submissionFileUrl =
    existingSubmission?.submission_type === "file"
      ? existingSubmission.file_path
      : null;
  const submissionText =
    existingSubmission?.submission_type === "text"
      ? existingSubmission.submission_text
      : null;
  const isProcessing = isPending || isUploading;

  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge
            color="green"
            leftSection={<IconCircleCheckFilled size={12} />}
          >
            Diterima (Lulus)
          </Badge>
        );
      case "rejected":
        return (
          <Badge color="red" leftSection={<IconX size={12} />}>
            Ditolak
          </Badge>
        );
      case "under_review":
        return (
          <Badge color="yellow" leftSection={<IconClock size={12} />}>
            Sedang Dinilai
          </Badge>
        );
      case "submitted":
        return (
          <Badge color="blue" leftSection={<IconClock size={12} />}>
            Menunggu Review
          </Badge>
        );
      default:
        return <Badge color="gray">Unknown</Badge>;
    }
  };

  return (
    <Paper p="md" withBorder radius="md" pos="relative">
      <LoadingOverlay visible={isProcessing} overlayProps={{ blur: 1 }} />
      {error && (
        <Alert
          color="red"
          icon={<IconAlertCircle />}
          title="Error"
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
        </Alert>
      )}

      {/* Status Pengumpulan Terbaru */}
      {existingSubmission && (
        <Card
          withBorder
          p="lg"
          radius="md"
          mb="lg"
          bg={
            existingSubmission.status === "approved"
              ? "green.0"
              : existingSubmission.status === "rejected"
                ? "red.0"
                : "blue.0"
          }
        >
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" c="dimmed" mb={4}>
                  Status Terbaru
                </Text>
                {getStatusBadge(existingSubmission.status)}
              </div>
              <div style={{ textAlign: "right" }}>
                <Text size="xs" c="dimmed">
                  {submissionRelativeTime}
                </Text>
                <Text size="xs" c="dimmed">
                  {submissionDate}
                </Text>
              </div>
            </Group>

            <Divider />

            {/* File/Text yang dikumpulkan */}
            {submissionFileUrl && (
              <Group gap="xs">
                <ThemeIcon size="sm" color="blue" variant="light">
                  <IconFile size={14} />
                </ThemeIcon>
                <Button
                  component="a"
                  href={submissionFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="subtle"
                  size="xs"
                  leftSection={<IconDownload size={14} />}
                >
                  Lihat File yang Dikumpulkan
                </Button>
              </Group>
            )}
            {submissionText && (
              <Paper withBorder p="sm" radius="xs" bg="white">
                <Text size="xs" c="dimmed" mb={4}>
                  Jawaban Anda:
                </Text>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {submissionText}
                </Text>
              </Paper>
            )}

            {/* Penilaian dari Dosen */}
            {(existingSubmission.status === "approved" ||
              existingSubmission.status === "rejected") && (
              <>
                <Divider label="Penilaian Dosen" labelPosition="center" />

                {existingSubmission.score !== null &&
                  existingSubmission.score !== undefined && (
                    <Alert
                      color={
                        existingSubmission.status === "approved"
                          ? "green"
                          : "orange"
                      }
                      icon={<IconCircleCheckFilled />}
                    >
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>
                          Skor:
                        </Text>
                        <Text size="lg" fw={700}>
                          {existingSubmission.score}
                        </Text>
                      </Group>
                    </Alert>
                  )}

                {existingSubmission.feedback && (
                  <Paper withBorder p="md" radius="md" bg="gray.0">
                    <Group gap="xs" mb="xs">
                      <ThemeIcon size="sm" color="blue" variant="light">
                        <IconMessage size={14} />
                      </ThemeIcon>
                      <Text size="sm" fw={500}>
                        Feedback Dosen:
                      </Text>
                    </Group>
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                      {existingSubmission.feedback}
                    </Text>
                  </Paper>
                )}

                {existingSubmission.reviewed_at && (
                  <Text size="xs" c="dimmed" ta="right">
                    Dinilai pada:{" "}
                    {dayjs(existingSubmission.reviewed_at).format(
                      "DD MMMM YYYY, HH:mm"
                    )}
                  </Text>
                )}
              </>
            )}
          </Stack>
        </Card>
      )}

      {/* History Timeline */}
      {submissionHistory && submissionHistory.length > 1 && (
        <>
          <Divider label="Riwayat Pengumpulan" labelPosition="center" mb="md" />
          <Paper withBorder p="md" radius="md" mb="lg" bg="gray.0">
            <Timeline
              active={submissionHistory.length}
              bulletSize={24}
              lineWidth={2}
            >
              {submissionHistory.map((submission, index) => (
                <Timeline.Item
                  key={submission.submission_id}
                  bullet={
                    submission.status === "approved" ? (
                      <IconCircleCheckFilled size={12} />
                    ) : submission.status === "rejected" ? (
                      <IconX size={12} />
                    ) : (
                      <IconClock size={12} />
                    )
                  }
                  title={
                    <Group gap="xs">
                      <Text size="sm" fw={500}>
                        Pengumpulan #{submissionHistory.length - index}
                      </Text>
                      {getStatusBadge(submission.status)}
                    </Group>
                  }
                >
                  <Text size="xs" c="dimmed" mt={4}>
                    {dayjs(submission.submitted_at).format(
                      "dddd, DD MMMM YYYY • HH:mm"
                    )}
                  </Text>
                  <Text size="xs" c="dimmed">
                    ({dayjs(submission.submitted_at).fromNow()})
                  </Text>
                  {submission.score !== null && (
                    <Text size="xs" mt={4}>
                      Skor: <strong>{submission.score}</strong>
                    </Text>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          </Paper>
        </>
      )}

      {/* Form Submit/Resubmit */}
      {canSubmit ? (
        <>
          <Divider label="Kumpulkan Tugas" labelPosition="center" mb="md" />
          <Stack>
            <Title order={6}>
              {existingSubmission
                ? "Kumpulkan Ulang Jawaban"
                : "Kumpulkan Jawaban"}
            </Title>
            <FileInput
              label="Upload File Jawaban"
              placeholder={
                file ? file.name : "Pilih file (.pdf, .docx, .zip, .jpg, .png)"
              }
              onChange={setFile}
              clearable
              accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png"
              disabled={!!text || isProcessing}
              leftSection={<IconUpload size={16} />}
            />
            <Divider label="ATAU" labelPosition="center" />
            <Textarea
              label="Tulis Jawaban Teks"
              placeholder="Ketik jawaban Anda di sini..."
              minRows={4}
              onChange={(e) => setText(e.currentTarget.value)}
              value={text}
              disabled={!!file || isProcessing}
            />
            <Button
              onClick={handleSubmit}
              loading={isProcessing}
              leftSection={<IconUpload size={16} />}
              disabled={(!file && !text) || isProcessing}
              mt="md"
            >
              {isUploading
                ? "Mengupload File..."
                : existingSubmission
                  ? "Kumpulkan Ulang Tugas"
                  : "Kumpulkan Tugas"}
            </Button>

            {!existingSubmission && (
              <Alert variant="light" color="blue" icon={<IconAlertCircle />}>
                Progress akan bertambah setelah tugas dinilai dan disetujui
                dosen.
              </Alert>
            )}
          </Stack>
        </>
      ) : (
        <Alert
          color="green"
          icon={<IconCircleCheckFilled />}
          title="Tugas Telah Dinilai Lulus"
        >
          Anda sudah lulus untuk tugas ini. Tidak perlu mengumpulkan ulang.
        </Alert>
      )}
    </Paper>
  );
}
