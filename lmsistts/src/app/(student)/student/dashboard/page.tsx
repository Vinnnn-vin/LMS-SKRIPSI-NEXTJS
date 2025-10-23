import { Container, Title, Text, SimpleGrid, Paper, Group, ThemeIcon, rem, Alert, Stack, Card, Image, Badge, Progress, Button, CardSection } from '@mantine/core';
import { IconSchool, IconCertificate, IconPlayerPlay, IconAlertCircle } from '@tabler/icons-react';
import { getStudentDashboardStats, getMyEnrolledCourses } from '@/app/actions/student.actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';

// Helper
const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

export default async function StudentDashboardPage() {
    const session = await getServerSession(authOptions);
    
    // Ambil data statistik dan data kursus secara bersamaan
    const [statsResult, coursesResult] = await Promise.all([
        getStudentDashboardStats(),
        getMyEnrolledCourses()
    ]);

    // Handle error jika salah satu gagal
    if (!statsResult.success || !coursesResult.success) {
        return (
            <Container py="xl">
                <Alert color="red" title="Gagal Memuat Data Dashboard" icon={<IconAlertCircle />}>
                    {statsResult.error || coursesResult.error || 'Terjadi kesalahan.'}
                </Alert>
            </Container>
        );
    }
    
    const stats = [
        { title: 'Kursus Aktif', value: formatNumber(statsResult.data.activeCourses), icon: IconSchool, color: 'blue' },
        { title: 'Kursus Selesai', value: formatNumber(statsResult.data.completedCourses), icon: IconCertificate, color: 'green' },
    ];

    const enrolledCourses = coursesResult.data || [];

    return (
        <Container fluid>
            <Stack mb="xl">
                <Title order={3}>Selamat Datang, {session?.user?.name || 'Mahasiswa'}</Title>
                <Text c="dimmed">Mari lanjutkan perjalanan belajar Anda hari ini!</Text>
            </Stack>

            {/* Kartu Statistik Ringkas */}
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                {stats.map((stat) => (
                <Paper withBorder p="md" radius="md" key={stat.title}>
                    <Group>
                        <ThemeIcon color={stat.color} variant="light" size={60} radius={60}>
                            <stat.icon style={{ width: rem(32), height: rem(32) }} stroke={1.5} />
                        </ThemeIcon>
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>{stat.title}</Text>
                            <Text fw={700} size="xl">{stat.value}</Text>
                        </div>
                    </Group>
                </Paper>
                ))}
            </SimpleGrid>

            {/* Daftar Kursus yang Sedang Diikuti */}
            <Title order={4} mt="xl" mb="md">Kursus Saya</Title>
            
            {enrolledCourses.length > 0 ? (
                <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
                    {enrolledCourses.map((course: any) => (
                        <Card shadow="sm" padding="lg" radius="md" withBorder key={course.enrollment_id}>
                            <CardSection>
                                <Image
                                    src={course.thumbnail_url || 'https://placehold.co/600x400?text=Course'}
                                    height={160}
                                    alt={course.course_title}
                                />
                            </CardSection>

                            <Group justify="space-between" mt="md" mb="xs">
                                <Text fw={500} size="lg" lineClamp={1}>{course.course_title}</Text>
                                <Badge color="pink" variant="light">
                                    {course.category?.category_name || 'General'}
                                </Badge>
                            </Group>

                            {/* Progress Bar */}
                            <Stack gap="xs" mt="sm">
                                <Text size="xs" c="dimmed">{course.progress}% Selesai</Text>
                                <Progress value={course.progress} radius="sm" animated={course.progress < 100} />
                            </Stack>

                            <Button
                                component={Link}
                                // Arahkan ke halaman belajar kursus (perlu dibuat)
                                href={`/student/courses/${course.course_id}/learn`} 
                                variant="light"
                                color="blue"
                                fullWidth
                                mt="md"
                                radius="md"
                                leftSection={<IconPlayerPlay size={16} />}
                            >
                                {course.progress > 0 ? 'Lanjutkan Belajar' : 'Mulai Belajar'}
                            </Button>
                        </Card>
                    ))}
                </SimpleGrid>
            ) : (
                <Paper withBorder p="xl" radius="md" ta="center">
                    <Text c="dimmed">Anda belum mendaftar di kursus apa pun.</Text>
                    <Button component={Link} href="/courses" mt="md">
                        Jelajahi Kursus Sekarang
                    </Button>
                </Paper>
            )}
        </Container>
    );
}