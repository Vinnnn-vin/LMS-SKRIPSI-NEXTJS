'use client';

import { useState, useTransition, useMemo } from 'react';
import { Box, Grid, Paper, Stack, Title, Text, Accordion, NavLink, ThemeIcon, rem, Center, Badge, Button, Alert, LoadingOverlay, Divider, Anchor, Progress, Group, Tooltip, ActionIcon, FileInput, Textarea, List } from '@mantine/core';
import { IconVideo, IconFileText, IconLink, IconPencil, IconQuestionMark, IconCircleCheckFilled, IconPlayerPlay, IconDownload, IconArrowLeft, IconUpload, IconListCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { markMaterialAsComplete, createAssignmentSubmission } from '@/app/actions/student.actions';
import { notifications } from '@mantine/notifications';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// --- Komponen Header Khusus Halaman Belajar ---
function LearningHeader({ courseTitle, courseDuration, totalProgress }: { courseTitle: string, courseDuration?: number, totalProgress: number }) {
  const router = useRouter();
  return (
    <Box component="header" h={70} px="md" style={{ borderBottom: `1px solid var(--mantine-color-gray-3)`, backgroundColor: 'var(--mantine-color-body)', display: 'flex', alignItems: 'center' }}>
      <Group h="100%" justify="space-between" style={{ width: '100%' }}>
        <Group>
            <Tooltip label="Kembali ke Dashboard">
                <ActionIcon component={Link} href="/student/dashboard/my-courses" variant="default" size="lg">
                    <IconArrowLeft size={18} />
                </ActionIcon>
            </Tooltip>
            <div>
                <Text size="sm" c="dimmed">Sedang Belajar:</Text>
                <Title order={4} lineClamp={1}>{courseTitle}</Title>
            </div>
        </Group>
        <Group w={{ base: 'auto', sm: 300 }}>
            <Box style={{ flex: 1 }}>
                <Text size="xs" c="dimmed">{totalProgress}% Selesai</Text>
                <Progress value={totalProgress} size="lg" radius="sm" animated={totalProgress < 100} color={totalProgress === 100 ? 'green' : 'blue'} />
            </Box>
            {courseDuration ? (<Text size="sm" visibleFrom="sm">{courseDuration} Jam</Text>) : null}
        </Group>
      </Group>
    </Box>
  );
}
// ---------------------------------------------

// --- Komponen Tombol Selesai ---
function CompleteButton({ materialDetailId, courseId, enrollmentId, isCompleted }: { materialDetailId: number, courseId: number, enrollmentId: number, isCompleted: boolean }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const handleClick = () => {
        startTransition(async () => {
            const result = await markMaterialAsComplete(materialDetailId, courseId, enrollmentId);
            if (result.success) {
                notifications.show({ title: 'Progres Disimpan!', message: 'Materi telah ditandai selesai.', color: 'green' });
                if (result.certificateGranted) {
                     notifications.show({ title: 'SELAMAT!', message: 'Anda telah menyelesaikan kursus!', color: 'teal', autoClose: 10000 });
                }
                router.refresh(); 
            } else {
                 notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
            }
        });
    };
    return ( <Button color={isCompleted ? 'green' : 'blue'} leftSection={isCompleted ? <IconCircleCheckFilled size={16} /> : <IconPlayerPlay size={16} />} onClick={handleClick} loading={isPending} disabled={isCompleted}>{isCompleted ? 'Telah Selesai' : 'Tandai Selesai'}</Button> );
}
// ---------------------------------------------

// --- Komponen Pengumpulan Tugas ---
function AssignmentSubmission({ detail, courseId, enrollmentId, isCompleted }: { detail: any, courseId: number, enrollmentId: number, isCompleted: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState('');
    const router = useRouter();

    const handleSubmit = () => {
        if (!file && !text) {
            notifications.show({ title: 'Error', message: 'Pilih file atau isi jawaban teks untuk dikumpulkan.', color: 'red' });
            return;
        }
        startTransition(async () => {
            const formData = new FormData();
            formData.append('material_detail_id', detail.material_detail_id);
            formData.append('course_id', String(courseId));
            formData.append('enrollment_id', String(enrollmentId));
            if (file) {
                formData.append('submission_file', file);
                formData.append('submission_type', 'file');
            } else {
                formData.append('submission_text', text);
                formData.append('submission_type', 'text');
            }
            
            const result = await createAssignmentSubmission(formData); // Panggil server action
            if (result.success) { 
                notifications.show({ title: 'Sukses', message: result.success, color: 'green' });
                router.refresh(); // Refresh untuk update status 'isCompleted'
            } else { 
                notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
            }
        });
    };

    return (
        <Paper p="md" withBorder radius="md">
            <Title order={5}>Kumpulkan Tugas Anda</Title>
            {isCompleted ? (
                <Alert color="green" title="Tugas Terkumpul" icon={<IconCircleCheckFilled />} mt="md">
                    Anda telah mengumpulkan tugas ini dan menandainya sebagai selesai.
                </Alert>
            ) : (
                <Stack mt="md">
                    <FileInput label="Upload File" placeholder="Pilih file tugas Anda (.pdf, .docx, .zip)" onChange={setFile} value={file} />
                    <Textarea label="Atau Tulis Jawaban" placeholder="Ketik jawaban Anda di sini..." minRows={4} onChange={(e) => setText(e.currentTarget.value)} value={text} />
                    <Button onClick={handleSubmit} loading={isPending} leftSection={<IconUpload size={16}/>}>
                        Kumpulkan Tugas & Tandai Selesai
                    </Button>
                </Stack>
            )}
        </Paper>
    );
}
// ---------------------------------------------

// --- Komponen Pengerjaan Quiz ---
function QuizPlayer({ quiz, courseId, enrollmentId, isCompleted }: { quiz: any, courseId: number, enrollmentId: number, isCompleted: boolean }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    // State untuk menyimpan jawaban
    const [answers, setAnswers] = useState<Record<number, string | string[]>>({});

    const handleAnswerChange = (questionId: number, value: string, type: 'multiple_choice' | 'checkbox') => {
        setAnswers(prev => {
            if (type === 'multiple_choice') {
                return { ...prev, [questionId]: value };
            } else { // checkbox
                const current = (prev[questionId] as string[]) || [];
                const newAnswers = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
                return { ...prev, [questionId]: newAnswers };
            }
        });
    };

    const handleSubmitQuiz = () => {
        startTransition(async () => {
            // TODO: Buat server action 'submitQuizAttempt'
            // const result = await submitQuizAttempt(quiz.quiz_id, courseId, enrollmentId, answers);
            // if (result.success) {
            //    notifications.show({ title: `Quiz Selesai! Skor Anda: ${result.score}`, ... });
            //    router.refresh();
            // } else { ... }
            
            // Placeholder
            notifications.show({ title: 'Simulasi', message: 'Quiz berhasil dikumpulkan (simulasi).', color: 'green' });
            router.refresh(); // Refresh untuk update status (placeholder)
        });
    };
    
    return (
        <Stack>
            <Alert color="orange" title="Pengerjaan Quiz (UI Sederhana)" icon={<IconQuestionMark />}>
                Fitur pengerjaan quiz lengkap dengan timer dan validasi jawaban perlu implementasi lebih lanjut.
            </Alert>
            <Stack gap="xl" mt="md">
                {quiz.questions?.map((q: any, index: number) => (
                    <Paper key={q.question_id} p="md" withBorder radius="md">
                        <Text fw={500} mb="sm">{index + 1}. {q.question_text}</Text>
                        {q.question_type === 'multiple_choice' && (
                            <Stack gap="xs">
                                {q.options?.map((opt: any) => (
                                    <Button key={opt.option_id} variant={answers[q.question_id] === String(opt.option_id) ? 'filled' : 'outline'} onClick={() => handleAnswerChange(q.question_id, String(opt.option_id), 'multiple_choice')} disabled={isCompleted}>
                                        {opt.option_text}
                                    </Button>
                                ))}
                            </Stack>
                        )}
                        {q.question_type === 'checkbox' && (
                             <Stack gap="xs">
                                {q.options?.map((opt: any) => (
                                    <Button key={opt.option_id} variant={(answers[q.question_id] as string[])?.includes(String(opt.option_id)) ? 'filled' : 'outline'} onClick={() => handleAnswerChange(q.question_id, String(opt.option_id), 'checkbox')} disabled={isCompleted}>
                                        {opt.option_text}
                                    </Button>
                                ))}
                            </Stack>
                        )}
                    </Paper>
                ))}
            </Stack>
             <Group justify="flex-end" mt="xl">
                 <Button leftSection={isCompleted ? <IconCircleCheckFilled size={16} /> : <IconListCheck size={16} />} onClick={handleSubmitQuiz} disabled={isCompleted} color={isCompleted ? 'green' : 'blue'} loading={isPending}>
                    {isCompleted ? 'Quiz Selesai' : 'Kumpulkan Jawaban Quiz'}
                 </Button>
            </Group>
        </Stack>
    );
}
// ---------------------------------------------


// Helper ikon
const getMaterialIcon = (type: number) => {
    switch (type) {
        case 1: return <IconVideo size={16} />;
        case 2: return <IconFileText size={16} />;
        case 3: return <IconLink size={16} />;
        case 4: return <IconPencil size={16} />; // Tugas
        default: return null;
    }
};

// --- Komponen UI Utama ---
export function CourseLearningClientUI({ course, completedItems, enrollmentId, totalProgress }: { course: any, completedItems: { details: Set<number>, quizzes: Set<number> }, enrollmentId: number, totalProgress: number }) {
    const [activeContent, setActiveContent] = useState<any>(null);
    const [contentType, setContentType] = useState<'detail' | 'quiz' | null>(null);

    const completedDetails = completedItems.details;
    const completedQuizzes = completedItems.quizzes;

    const handleSelectContent = (content: any, type: 'detail' | 'quiz') => {
        setActiveContent(content);
        setContentType(type);
    };

    // Render Konten di Area Utama
    const renderContent = () => {
        if (!activeContent) {
            return ( <Center h="100%"><Stack align="center" gap="xs"><IconPlayerPlay size={48} stroke={1} color="gray" /><Title order={4}>Selamat Datang</Title><Text c="dimmed">Pilih materi dari sidebar untuk memulai.</Text></Stack></Center> );
        }

        if (contentType === 'detail') {
            const detail = activeContent;
            const isCompleted = completedDetails.has(detail.material_detail_id);
            return (
                <Stack h="100%" justify="space-between">
                    <Box>
                        <Title order={3} mb="md">{detail.material_detail_name}</Title>
                        <Text mb="lg" dangerouslySetInnerHTML={{ __html: detail.material_detail_description.replace(/\n/g, '<br />') }} />
                        
                        {/* 1. Tipe Video (Placeholder) */}
                        {detail.material_detail_type === 1 && ( <Alert color="blue" title="Konten Video">(Placeholder Pemutar Video untuk: {detail.materi_detail_url})</Alert> )}
                        
                        {/* 2. Tipe PDF */}
                        {detail.material_detail_type === 2 && detail.materi_detail_url && (
                            <iframe src={detail.materi_detail_url} style={{ width: '100%', height: '60vh', border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)' }} title={detail.material_detail_name} />
                        )}
                        
                        {/* 3. Tipe YouTube */}
                        {detail.material_detail_type === 3 && detail.materi_detail_url.includes('youtube.com') && (
                            <Box style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--mantine-radius-md)' }}>
                                <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} src={`https://www.youtube.com/embed/${new URL(detail.materi_detail_url).searchParams.get('v')}`} title={detail.material_detail_name} frameBorder="0" allowFullScreen></iframe>
                            </Box>
                        )}
                        
                        {/* 4. Tipe Tugas (Assignment) */}
                        {detail.material_detail_type === 4 && (
                            <AssignmentSubmission detail={detail} courseId={course.course_id} enrollmentId={enrollmentId} isCompleted={isCompleted} />
                        )}
                    </Box>
                    <Divider my="md" />
                    <Group justify="flex-end">
                        {/* Tombol Selesai (hanya untuk tipe 1, 2, 3) */}
                        {(detail.material_detail_type === 1 || detail.material_detail_type === 2 || detail.material_detail_type === 3) && (
                             <CompleteButton materialDetailId={detail.material_detail_id} courseId={course.course_id} enrollmentId={enrollmentId} isCompleted={isCompleted} />
                        )}
                    </Group>
                </Stack>
            );
        }
        
        if (contentType === 'quiz') {
            const quiz = activeContent;
            const isCompleted = completedQuizzes.has(quiz.quiz_id);
             return (
                <QuizPlayer
                    quiz={quiz}
                    courseId={course.course_id}
                    enrollmentId={enrollmentId}
                    isCompleted={isCompleted}
                />
            );
        }
    };

    return (
        <Box>
            {/* --- HEADER KUSTOM DENGAN PROGRES --- */}
            <LearningHeader 
                courseTitle={course.course_title}
                courseDuration={course.course_duration}
                totalProgress={totalProgress}
            />
            <Grid gutter={0}>
                {/* Sidebar Kurikulum */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper withBorder radius={0} p="md" style={{ height: 'calc(100vh - 70px)', overflowY: 'auto' }}>
                        <Title order={5} mb="md">Kurikulum</Title>
                        <Accordion chevronPosition="left" variant="separated" defaultValue={course.materials?.[0]?.material_id.toString()}>
                            {course.materials?.map((material: any) => (
                                <Accordion.Item key={material.material_id} value={String(material.material_id)}>
                                    <Accordion.Control>{material.material_name}</Accordion.Control>
                                    <Accordion.Panel>
                                        <Stack gap="xs">
                                            {/* List Konten (MaterialDetail) */}
                                            {material.details?.map((detail: any) => {
                                                const isCompleted = completedDetails.has(detail.material_detail_id);
                                                return (
                                                    <NavLink
                                                        key={`detail-${detail.material_detail_id}`}
                                                        label={detail.material_detail_name}
                                                        leftSection={<ThemeIcon variant='light' color={isCompleted ? 'green' : 'gray'} size={20}>{getMaterialIcon(detail.material_detail_type)}</ThemeIcon>}
                                                        // --- PERBAIKAN: Tanda Selesai ---
                                                        rightSection={isCompleted ? <IconCircleCheckFilled size={16} style={{ color: 'var(--mantine-color-green-5)' }}/> : null}
                                                        onClick={() => handleSelectContent(detail, 'detail')}
                                                        active={contentType === 'detail' && activeContent?.material_detail_id === detail.material_detail_id}
                                                    />
                                                );
                                            })}
                                            {/* List Quiz */}
                                            {material.quizzes?.map((quiz: any) => {
                                                const isCompleted = completedQuizzes.has(quiz.quiz_id);
                                                return (
                                                    <NavLink
                                                        key={`quiz-${quiz.quiz_id}`}
                                                        label={quiz.quiz_title}
                                                        leftSection={<ThemeIcon variant='light' color={isCompleted ? 'green' : 'orange'} size={20}><IconQuestionMark size={16}/></ThemeIcon>}
                                                        // --- PERBAIKAN: Tanda Selesai ---
                                                        rightSection={isCompleted ? <IconCircleCheckFilled size={16} style={{ color: 'var(--mantine-color-green-5)' }}/> : null}
                                                        onClick={() => handleSelectContent(quiz, 'quiz')}
                                                        active={contentType === 'quiz' && activeContent?.quiz_id === quiz.quiz_id}
                                                    />
                                                );
                                            })}
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                    </Paper>
                </Grid.Col>

                {/* Area Konten Utama */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Box p="lg" style={{ height: 'calc(100vh - 70px)', overflowY: 'auto' }}>
                        {renderContent()}
                    </Box>
                </Grid.Col>
            </Grid>
        </Box>
    );
}