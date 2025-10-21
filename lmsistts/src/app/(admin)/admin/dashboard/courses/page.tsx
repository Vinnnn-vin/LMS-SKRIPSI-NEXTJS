// lmsistts/src/app/%28admin%29/admin/dashboard/courses/page.tsx

import { Container, Title, Text, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { getAllCoursesForAdmin, getAllCategoriesForAdmin, getAllUsersForAdmin } from '@/app/actions/admin.actions';
import { CourseManagementTable } from '@/components/admin/CourseManagementTable';
import { User } from '@/lib/models'; // Impor User untuk filter dosen

export default async function ManageCoursesPage() {
    // Ambil semua data yang diperlukan secara paralel
    const [coursesResult, categoriesResult, usersResult] = await Promise.all([
        getAllCoursesForAdmin(),
        getAllCategoriesForAdmin(),
        getAllUsersForAdmin()
    ]);

    // Filter hanya user dengan role 'lecturer'
    const lecturers = usersResult.success ? usersResult.data?.filter(u => u.role === 'lecturer') : [];

    const hasError = !coursesResult.success || !categoriesResult.success || !usersResult.success;
    const errorMessage = coursesResult.error || categoriesResult.error || usersResult.error;

    return (
        <Container fluid>
            <Title order={3}>Manajemen Kursus</Title>
            <Text c="dimmed" mb="lg">Buat, edit, publikasikan, dan hapus kursus.</Text>
            
            {hasError ? (
                <Alert color="red" title="Gagal Memuat Data" icon={<IconAlertCircle />}>
                    {errorMessage}
                </Alert>
            ) : (
                <CourseManagementTable 
                    courses={coursesResult.data as any[]} 
                    categories={categoriesResult.data as any[]} 
                    lecturers={lecturers as any[]}
                />
            )}
        </Container>
    );
}