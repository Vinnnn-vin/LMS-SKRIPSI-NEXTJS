// lmsistts\src\app\(lecturer)\lecturer\dashboard\courses\[course_id]\enrollments\page.tsx

import { Container, Title, Text, Alert, Breadcrumbs, Anchor } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseEnrollmentsForLecturer } from '@/app/actions/lecturer.actions'; // Action Dosen
import { getCourseByIdForAdmin } from '@/app/actions/admin.actions'; // Reuse action admin untuk ambil judul
import { EnrollmentListTable } from '@/components/admin/EnrollmentListTable'; // Komponen tabel yang sama

export default async function LecturerCourseEnrollmentsPage({ params }: { params: { course_id: string } }) {
    const courseId = parseInt(params.course_id, 10);
    if (isNaN(courseId)) notFound();

    // Panggil action yang berbeda, khusus lecturer
    const [enrollmentResult, courseResult] = await Promise.all([
        getCourseEnrollmentsForLecturer(courseId),
        getCourseByIdForAdmin(courseId)
    ]);

    if (!courseResult.success || enrollmentResult.error === 'Kursus tidak ditemukan atau Anda tidak berhak mengaksesnya.') {
        notFound();
    }

    const items = [
        { title: 'Dashboard', href: '/lecturer/dashboard' },
        { title: 'Manajemen Kursus', href: '/lecturer/dashboard/courses' },
        { title: courseResult.data?.course_title || 'Detail Kursus', href: `/lecturer/dashboard/courses/${courseId}/enrollments` },
    ].map((item, index) => (
        <Anchor component={Link} href={item.href} key={index}>{item.title}</Anchor>
    ));

    return (
        <Container fluid>
            <Breadcrumbs mb="lg">{items}</Breadcrumbs>
            <Title order={3}>Daftar Mahasiswa Anda</Title>
            <Text c="dimmed" mb="lg">Lihat progres mahasiswa di kursus "{courseResult.data?.course_title}".</Text>

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