"use client";

import { useState, useEffect } from "react";
import { Modal, Stack, Title, Text, Button, Group, NumberInput, Textarea, Alert, Badge, Anchor, LoadingOverlay, Box, Divider, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "@mantine/form";
import { IconAlertCircle, IconDownload, IconLink } from "@tabler/icons-react";
import { reviewAssignmentSchema, ReviewAssignmentInput } from '@/lib/schemas/assignmentSubmission.schema';
import { gradeAssignmentByLecturer } from "@/app/actions/lecturer.actions";
import { notifications } from "@mantine/notifications";
import { zod4Resolver } from "mantine-form-zod-resolver";

interface AssignmentGradingModalProps {
    opened: boolean;
    onClose: () => void;
    submission: {
        submission_id: number;
        student: { first_name?: string | null; last_name?: string | null; email?: string | null };
        assignment: { material_detail_name?: string | null };
        status: 'submitted' | 'under_review' | 'approved' | 'rejected';
        score?: number | null;
        feedback?: string | null;
        submission_type: 'file' | 'url' | 'text';
        file_path?: string | null;
        submission_url?: string | null;
        submission_text?: string | null;
    };
    onGradeSubmit: () => void;
    startTransition: React.TransitionStartFunction;
}

export function AssignmentGradingModal({ opened, onClose, submission, onGradeSubmit, startTransition }: AssignmentGradingModalProps) {
    const [isPending, setIsPending] = useState(false);

    const form = useForm<ReviewAssignmentInput>({
        initialValues: {
            status: submission.status === 'approved' ? 'approved' : submission.status === 'rejected' ? 'rejected' : 'submitted',
            score: submission.score ?? null,
            feedback: submission.feedback ?? '',
        },
        validate: zod4Resolver(reviewAssignmentSchema),
    });

    useEffect(() => {
        form.setValues({
             status: submission.status === 'approved' ? 'approved' : submission.status === 'rejected' ? 'rejected' : 'submitted',
             score: submission.score ?? null,
             feedback: submission.feedback ?? '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submission]);

    const handleSubmit = (values: ReviewAssignmentInput) => {
        startTransition(() => {
             setIsPending(true);
             gradeAssignmentByLecturer(submission.submission_id, values)
                .then(result => {
                    if (result.success) {
                        notifications.show({ title: "Sukses", message: result.message, color: "green" });
                        onGradeSubmit();
                        onClose();
                    } else {
                        notifications.show({ title: "Gagal", message: result.error, color: "red" });
                    }
                })
                .catch(error => {
                     notifications.show({ title: "Error", message: error.message || "Terjadi kesalahan server.", color: "red" });
                })
                .finally(() => {
                     setIsPending(false);
                });
        });
    };

    const studentName = `${submission.student.first_name || ''} ${submission.student.last_name || ''}`.trim() || submission.student.email;

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
                <Text>Mahasiswa: <strong>{studentName}</strong></Text>

                <Box>
                    <Title order={6}>Konten Jawaban:</Title>
                    {submission.submission_type === 'file' && submission.file_path && (
                        <Button
                            component="a"
                            href={submission.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outline"
                            leftSection={<IconDownload size={16} />}
                        >
                            Download File Jawaban
                        </Button>
                    )}
                    {submission.submission_type === 'url' && submission.submission_url && (
                        <Anchor href={submission.submission_url} target="_blank" rel="noopener noreferrer">
                             <IconLink size={14} style={{ marginRight: 4 }} />
                             {submission.submission_url}
                        </Anchor>
                    )}
                    {submission.submission_type === 'text' && submission.submission_text && (
                        <Textarea
                            value={submission.submission_text}
                            readOnly
                            minRows={5}
                            autosize
                            variant="filled"
                            label="Jawaban Teks"
                        />
                    )}
                     {/* FIXED: Perbaikan logika kondisi */}
                     {!submission.file_path && !submission.submission_url && !submission.submission_text && (
                        <Text c="dimmed" size="sm">Siswa tidak mengirimkan konten jawaban.</Text>
                     )}
                </Box>

                <Divider label="Form Penilaian" labelPosition="center" />

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="sm">
                         <Select
                            label="Status Penilaian"
                            data={[
                                { value: 'submitted', label: 'Belum Dinilai (Submitted)' },
                                { value: 'approved', label: 'Disetujui (Lulus)' },
                                { value: 'rejected', label: 'Ditolak (Tidak Lulus)' },
                            ]}
                            required
                            {...form.getInputProps('status')}
                        />

                        {form.values.status !== 'rejected' && (
                            <NumberInput
                                label="Skor (0-100)"
                                placeholder="Masukkan skor"
                                min={0}
                                max={100}
                                allowDecimal={false}
                                required={form.values.status === 'approved'}
                                {...form.getInputProps('score')}
                            />
                        )}

                        <Textarea
                            label="Feedback / Komentar (Opsional)"
                            placeholder="Berikan masukan untuk mahasiswa..."
                            minRows={4}
                            {...form.getInputProps('feedback')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={onClose}>Batal</Button>
                            <Button type="submit" loading={isPending}>Simpan Penilaian</Button>
                        </Group>
                    </Stack>
                </form>
            </Stack>
        </Modal>
    );
}