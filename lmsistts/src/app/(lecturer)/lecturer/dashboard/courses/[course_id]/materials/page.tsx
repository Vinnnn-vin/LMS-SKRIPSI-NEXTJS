// lmsistts\src\app\(lecturer)\lecturer\dashboard\courses\[course_id]\materials\page.tsx

import { Container, Title, Text, Alert, Breadcrumbs, Anchor } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMaterialsByCourseId } from '@/app/actions/lecturer.actions';
import { getCourseByIdForAdmin } from '@/app/actions/admin.actions'; // Kita pakai ini untuk ambil judul kursus
import { MaterialManager } from '@/components/lecturer/MaterialManager';

export default async function ManageCourseMaterialsPage({ params }: { params: { course_id: string } }) {
    const courseId = parseInt(params.course_id, 10);
    if (isNaN(courseId)) notFound();

    // Ambil data materi dan detail kursus secara paralel
    const [materialsResult, courseResult] = await Promise.all([
        getMaterialsByCourseId(courseId),
        getCourseByIdForAdmin(courseId) // Ambil judul kursus
    ]);

    const hasError = !materialsResult.success || !courseResult.success;
    const errorMessage = materialsResult.error || courseResult.error;

    if (errorMessage === 'Kursus tidak ditemukan atau Anda tidak berhak mengaksesnya.') {
        notFound(); // Tampilkan 404 jika kursus invalid
    }

    const items = [
        { title: 'Dashboard', href: '/lecturer/dashboard' },
        { title: 'Manajemen Kursus', href: '/lecturer/dashboard/courses' },
        { title: courseResult.data?.course_title || `Kursus ${courseId}`, href: `/lecturer/dashboard/courses/${courseId}/materials` },
    ].map((item, index) => (
        <Anchor component={Link} href={item.href} key={index}>
            {item.title}
        </Anchor>
    ));

    return (
        <Container fluid>
             <Breadcrumbs mb="lg">{items}</Breadcrumbs>
             <Title order={3}>Manajemen Bab/Seksi Materi</Title>
             <Text c="dimmed" mb="lg">Atur struktur kurikulum untuk kursus: "{courseResult.data?.course_title || 'Kursus Tidak Ditemukan'}".</Text>

            {hasError ? (
                <Alert color="red" title="Gagal Memuat Data" icon={<IconAlertCircle />}>
                    {errorMessage}
                </Alert>
            ) : (
                <MaterialManager
                    materials={materialsResult.data as any[]}
                    courseId={courseId}
                />
            )}
        </Container>
    );
}