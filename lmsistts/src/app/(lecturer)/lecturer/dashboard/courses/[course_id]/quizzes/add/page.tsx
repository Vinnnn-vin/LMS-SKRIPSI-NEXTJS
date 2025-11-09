// lmsistts\src\app\(lecturer)\lecturer\dashboard\courses\[course_id]\quizzes\add\page.tsx

'use client';

import { use, useState, useTransition } from 'react';
import { Container, Title, Text, Paper, TextInput, Button, Stack, Alert, LoadingOverlay, NumberInput, Textarea, Group } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createQuizSchema, CreateQuizInput } from '@/lib/schemas/quiz.schema';
import { createQuiz } from '@/app/actions/lecturer.actions';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { zod4Resolver } from 'mantine-form-zod-resolver';

export default function AddQuizPage({ params }: { params: Promise<{ course_id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const { course_id } = use(params);
    const courseId = parseInt(course_id, 10);
    const materialId = parseInt(searchParams.get('materialId') || '', 10);

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<CreateQuizInput>({
        initialValues: {
            quiz_title: '',
            quiz_description: '',
            passing_score: 70,
            time_limit: 10,
            max_attempts: 3,
        },
        validate: zod4Resolver(createQuizSchema),
    });

    const handleSubmit = (values: CreateQuizInput) => {
        setError(null);
        if (isNaN(materialId) || isNaN(courseId)) {
            setError("ID Kursus atau ID Materi tidak valid.");
            return;
        }

        startTransition(async () => {
            const result = await createQuiz(courseId, materialId, values);
            if (result.error) {
                setError(result.error);
            } else if (result.success && result.data?.quiz_id) {
                notifications.show({
                     title: 'Sukses',
                     message: 'Quiz berhasil dibuat. Sekarang, tambahkan pertanyaan.',
                     color: 'green',
                 });
                 router.push(`/lecturer/dashboard/courses/${courseId}/quizzes/${result.data.quiz_id}/edit`);
            }
        });
    };

    if (isNaN(materialId)) {
        return <Alert color="red">ID Materi tidak ditemukan. Silakan kembali.</Alert>
    }

    return (
        <Container size="md" py="xl">
            <Group justify="space-between" mb="lg">
                <Title order={3}>Buat Quiz Baru</Title>
                <Button variant="outline" component={Link} href={`/lecturer/dashboard/courses/${courseId}/materials`} leftSection={<IconArrowLeft size={16} />}>
                    Kembali ke Daftar Materi
                </Button>
            </Group>
            
            <Paper withBorder shadow="md" p={30} radius="md" pos="relative">
                <LoadingOverlay visible={isPending} />
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        {error && <Alert title="Gagal" color="red" icon={<IconAlertCircle />}>{error}</Alert>}
                        <TextInput label="Judul Quiz" placeholder="e.g., Kuis Bab 1: Pengenalan" required {...form.getInputProps('quiz_title')} />
                        <Textarea label="Deskripsi (Opsional)" placeholder="Instruksi singkat untuk quiz..." minRows={3} {...form.getInputProps('quiz_description')} />
                        <Group grow>
                            <NumberInput label="Skor Lulus (0-100)" min={0} max={100} required {...form.getInputProps('passing_score')} />
                            <NumberInput label="Batas Waktu (Menit)" min={1} required {...form.getInputProps('time_limit')} />
                            <NumberInput label="Maksimal Percobaan" min={1} max={10} required {...form.getInputProps('max_attempts')} />
                        </Group>
                        <Button type="submit" mt="xl" loading={isPending}>
                            Simpan & Tambah Pertanyaan
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
}