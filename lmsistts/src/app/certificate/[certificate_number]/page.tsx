// lmsistts\src\app\certificate\[certificate_number]\page.tsx

import { Container, Title, Text, Paper, Stack, Button, Group, Center } from '@mantine/core';
import { Certificate } from '@/lib/models'; // Impor model
import { notFound } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/id'; // Impor locale Indonesia
import { User, Course } from '@/lib/models'; // Impor model terkait
import classes from './Certificate.module.css'; // Kita akan buat file CSS

// Atur locale dayjs ke Indonesia
dayjs.locale('id');

// Komponen Client untuk Tombol Print
function PrintButton() {
    'use client';
    // Sembunyikan tombol saat print
    return <Button onClick={() => window.print()} size="lg" className={classes.printButton}>Print / Download PDF</Button>;
}

export default async function CertificatePage({ params }: { params: { certificate_number: string } }) {
    const certificate = await Certificate.findOne({
        where: { certificate_number: params.certificate_number },
        include: [
            { model: User, as: 'student', attributes: ['first_name', 'last_name'] },
            { model: Course, as: 'course', attributes: ['course_title'] }
        ]
    });

    if (!certificate) {
        notFound();
    }

    const studentName = `${certificate.student?.first_name || ''} ${certificate.student?.last_name || ''}`.trim();
    const courseTitle = certificate.course?.course_title;
    const issuedDate = dayjs(certificate.issued_at).format('DD MMMM YYYY');

    return (
        // Gunakan <Container> untuk membatasi lebar di layar besar
        <Container size="lg" py="xl"> 
            <Paper className={classes.certificateWrapper} shadow="xl" radius="md" withBorder>
                {/* ... (Struktur HTML/Mantine untuk tampilan sertifikat) ... */}
                <Stack align="center" gap="xs">
                    <Text c="dimmed" tt="uppercase" size="sm">Sertifikat Kelulusan</Text>
                    <Title order={1} className={classes.title}>Certificate of Completion</Title>
                    <Text mt="lg" size="lg">Dengan bangga diberikan kepada:</Text>
                    
                    <Title order={2} className={classes.studentName}>{studentName || 'Siswa'}</Title>
                    
                    <Text mt="md" size="lg" ta="center">
                        Atas keberhasilannya menyelesaikan kursus:
                    </Text>
                    <Title order={3} className={classes.courseTitle}>{courseTitle || 'Kursus Pilihan'}</Title>
                    
                    <Group justify="space-between" mt="xl" w="100%">
                        <Stack gap={0} align="center">
                            <Text>Tanda Tangan Instruktur</Text>
                            <Text mt="xl" className={classes.signatureLine}>Dosen Pengampu</Text>
                        </Stack>
                        <Stack gap={0} align="center">
                            <Text>Tanggal Diterbitkan</Text>
                            <Text mt="xl" className={classes.signatureLine}>{issuedDate}</Text>
                        </Stack>
                    </Group>
                    
                     <Text size="xs" c="dimmed" mt="sm">No: {certificate.certificate_number}</Text>
                </Stack>
            </Paper>
            
            <Center mt="xl" className={classes.printButtonWrapper}>
                <PrintButton />
            </Center>
        </Container>
    );
}
