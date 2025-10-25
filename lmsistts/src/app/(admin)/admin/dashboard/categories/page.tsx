// lmsistts\src\app\(admin)\admin\dashboard\categories\page.tsx

import { Container, Title, Text, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { getAllCategoriesForAdmin } from '@/app/actions/admin.actions';
import { CategoryManagementTable } from '@/components/admin/CategoryManagementTable';

export default async function ManageCategoriesPage() {
    // Panggil fungsi yang sudah menyertakan course_count
    const result = await getAllCategoriesForAdmin(); 

    return (
        <Container fluid>
            <Title order={3}>Manajemen Kategori</Title>
            <Text c="dimmed" mb="lg">Buat, edit, atau hapus kategori kursus.</Text>

            {result?.success ? (
                // Kirim data kategori (termasuk course_count) ke tabel
                <CategoryManagementTable categories={result.data as any[]} /> 
            ) : (
                <Alert color="red" title="Gagal Memuat Data" icon={<IconAlertCircle />}>
                    {result?.error || 'Tidak dapat mengambil data kategori.'}
                </Alert>
            )}
        </Container>
    );
}