// lmsistts\src\app\(admin)\admin\dashboard\courses\[courses_id]\enrollments\page.tsx

import { Container, Title, Text, Alert, Breadcrumbs, Anchor } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseEnrollmentsForAdmin } from '@/app/actions/admin.actions';
import { getCourseByIdForAdmin } from '@/app/actions/admin.actions'; // Untuk ambil judul kursus
import { EnrollmentListTable } from '@/components/admin/EnrollmentListTable';

export default async function CourseEnrollmentsPage({ params }: { params: { course_id: string } }) {
    const courseId = parseInt(params.course_id, 10);
    if (isNaN(courseId)) notFound();

    const [enrollmentResult, courseResult] = await Promise.all([
        getCourseEnrollmentsForAdmin(courseId),
        getCourseByIdForAdmin(courseId) // Ambil info kursus untuk breadcrumbs
    ]);

    if (!courseResult.success) notFound(); // Kursus tidak ditemukan

    const items = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Manajemen Kursus', href: '/admin/dashboard/courses' },
        { title: courseResult.data?.course_title || 'Detail Kursus', href: `/admin/dashboard/courses/${courseId}/enrollments` },
    ].map((item, index) => (
        <Anchor component={Link} href={item.href} key={index}>{item.title}</Anchor>
    ));

    return (
        <Container fluid>
            <Breadcrumbs mb="lg">{items}</Breadcrumbs>
            <Title order={3}>Daftar Mahasiswa</Title>
            <Text c="dimmed" mb="lg">Lihat progres dan status pendaftaran mahasiswa di kursus "{courseResult.data?.course_title}".</Text>

            {enrollmentResult.success ? (
                <EnrollmentListTable enrollments={enrollmentResult.data as any[]} />
            ) : (
                <Alert color="red" title="Gagal Memuat Data" icon={<IconAlertCircle />}>
                    {enrollmentResult.error || 'Terjadi kesalahan.'}
                </Alert>
            )}
        </Container>
    );
}