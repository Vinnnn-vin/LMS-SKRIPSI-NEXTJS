// lmsistts\src\app\(lecturer)\lecturer\dashboard\courses\page.tsx

import { Container, Title, Text, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { getCoursesByLecturer } from '@/app/actions/lecturer.actions';
import { getAllCategoriesForAdmin } from '@/app/actions/admin.actions'; // Kita perlu kategori untuk form
import { LecturerCourseTable } from '@/components/lecturer/LecturerCourseTable';

export default async function ManageLecturerCoursesPage() {
    const [coursesResult, categoriesResult] = await Promise.all([
        getCoursesByLecturer(),
        getAllCategoriesForAdmin() // Ambil kategori untuk dropdown di form
    ]);

    const hasError = !coursesResult.success || !categoriesResult.success;
    const errorMessage = coursesResult.error || categoriesResult.error;

    return (
        <Container fluid>
            <Title order={3}>Manajemen Kursus Anda</Title>
            <Text c="dimmed" mb="lg">Buat, edit, dan kelola materi kursus yang Anda ampu.</Text>
            
            {hasError ? (
                <Alert color="red" title="Gagal Memuat Data" icon={<IconAlertCircle />}>
                    {errorMessage}
                </Alert>
            ) : (
                <LecturerCourseTable
                    courses={coursesResult.data as any[]}
                    categories={categoriesResult.data as any[]}
                />
            )}
        </Container>
    );
}