// lmsistts\src\app\(student)\student\dashboard\my-certificates\page.tsx

import { Container, Title, Text, SimpleGrid, Card, Group, Button, Alert, Paper, Center } from '@mantine/core';
import { IconAlertCircle, IconCertificate, IconDownload } from '@tabler/icons-react';
import { getMyCertificates } from '@/app/actions/student.actions';
import Link from 'next/link';
import dayjs from 'dayjs';

export default async function MyCertificatesPage() {
    const result = await getMyCertificates();

    if (!result.success) {
        return <Container py="xl"><Alert color="red" title="Gagal Memuat Data">{result.error}</Alert></Container>;
    }

    const certificates = result.data || [];

    return (
        <Container fluid>
            <Title order={3} mb="lg">Sertifikat Saya</Title>
            
            {certificates.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                    {certificates.map((cert: any) => (
                        <Card shadow="sm" padding="lg" radius="md" withBorder key={cert.certificate_id}>
                            <Title order={5} lineClamp={2}>{cert.course.course_title}</Title>
                            <Text size="sm" c="dimmed" mt="xs">Diterbitkan: {dayjs(cert.issued_at).format('DD MMMM YYYY')}</Text>
                            <Text size="xs" c="dimmed">No: {cert.certificate_number}</Text>
                            
                            <Button
                                component={Link}
                                href={cert.certificate_url} // Link ke halaman sertifikat
                                target="_blank" // Buka di tab baru
                                variant="light"
                                color="blue"
                                fullWidth
                                mt="md"
                                radius="md"
                                leftSection={<IconDownload size={16} />}
                            >
                                Lihat & Download
                            </Button>
                        </Card>
                    ))}
                </SimpleGrid>
            ) : (
                 <Paper withBorder p="xl" radius="md" ta="center">
                    <IconCertificate size={60} stroke={1} color="var(--mantine-color-gray-5)"/>
                    <Title order={4} mt="md">Belum Ada Sertifikat</Title>
                    <Text c="dimmed" mt="xs">Selesaikan kursus Anda untuk mendapatkan sertifikat kelulusan.</Text>
                    <Button component={Link} href="/student/dashboard/my-courses" mt="lg" variant='outline'>
                        Lihat Kursus Saya
                    </Button>
                </Paper>
            )}
        </Container>
    );
}