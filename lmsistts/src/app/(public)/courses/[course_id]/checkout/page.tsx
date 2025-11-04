// src/app/(public)/courses/[course_id]/checkout/page.tsx
import { Container, Title, Text, Alert, Paper, Group, Button, Divider, Stack } from '@mantine/core';
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCourseDetailsById } from '@/app/actions/course.actions'; // Action untuk detail kursus
import { CheckEnrollmentStatus } from '@/app/actions/payment.actions'; // Action baru (cek pendaftaran)
import Link from 'next/link';
import { CheckoutButton } from '@/components/payment/CheckoutButton'; // Komponen client baru

// Helper format harga
const formatPrice = (price: number | null | undefined) => {
    // ... (implementasi formatPrice)
     if (price === null || price === undefined || price === 0) return "Gratis";
     return new Intl.NumberFormat("id-ID", {
        style: "currency", currency: "IDR", minimumFractionDigits: 0,
     }).format(price);
};

export default async function CheckoutPage({ params, searchParams }: { params: { course_id: string }, searchParams: { payment?: string } }) {
    const session = await getServerSession(authOptions);

    // 1. Cek Login
    if (!session?.user?.id) {
        // Redirect ke login, simpan halaman checkout sebagai callbackUrl
        const callbackUrl = encodeURIComponent(`/courses/${params.course_id}/checkout`);
        redirect(`/login?callbackUrl=${callbackUrl}`);
    }

    const courseId = parseInt(params.course_id, 10);
    if (isNaN(courseId)) {
        notFound();
    }

    // 2. Ambil Detail Kursus
    const courseResult = await getCourseDetailsById(courseId);
    if (!courseResult.success || !courseResult.data) {
        if (courseResult.error === "Kursus tidak ditemukan.") {
            notFound();
        }
        return (
            <Container py="xl">
                <Alert color="red" title="Error" icon={<IconAlertCircle />}>{courseResult.error || 'Gagal memuat detail kursus.'}</Alert>
                 <Button component={Link} href="/courses" leftSection={<IconArrowLeft size={16}/>} variant="outline" mt="md">Kembali ke Daftar Kursus</Button>
            </Container>
        );
    }
    const course = courseResult.data;

    // 3. Cek apakah user sudah terdaftar/membeli kursus ini
    const enrollmentStatus = await CheckEnrollmentStatus(courseId, parseInt(session.user.id));
    if (enrollmentStatus.isEnrolled) {
        // Jika sudah terdaftar, arahkan ke halaman belajar
        redirect(`/student/courses/${courseId}/learn`);
    }

     // 4. Handle pembayaran gratis
     if (course.course_price === 0) {
          // Jika gratis, langsung daftarkan (perlu action baru `enrollFreeCourse`) dan redirect
          // redirect(`/student/courses/${courseId}/learn?enrolled=free`);
          // Untuk sementara, tampilkan pesan:
          return (
            <Container py="xl" size="sm">
                <Paper withBorder p="xl" radius="md" ta="center">
                    <Title order={3}>Kursus Gratis!</Title>
                    <Text mt="sm" mb="lg">Kursus "{course.course_title}" ini gratis. Anda akan segera didaftarkan.</Text>
                     {/* Idealnya ada tombol/redirect otomatis setelah action enroll gratis */}
                     <Button component={Link} href={`/student/courses/${courseId}/learn`}>Masuk ke Kursus</Button>
                 </Paper>
             </Container>
          );
     }


    const paymentStatus = searchParams?.payment; // 'success' atau 'failed'

    return (
        <Container py="xl" size="sm">
            <Title order={2} ta="center" mb="lg">Checkout</Title>

             {/* Tampilkan pesan status pembayaran jika ada */}
             {paymentStatus === 'failed' && (
                <Alert color="red" title="Pembayaran Gagal" icon={<IconAlertCircle />} mb="lg">
                    Pembayaran Anda gagal atau dibatalkan. Silakan coba lagi.
                </Alert>
             )}
              {paymentStatus === 'success' && (
                 // Seharusnya redirect ke 'my-courses', tapi bisa tampilkan pesan jika kembali ke checkout
                 <Alert color="green" title="Pembayaran Berhasil" icon={<IconAlertCircle />} mb="lg">
                    Pembayaran berhasil! Anda sudah terdaftar di kursus.
                     <Button component={Link} href={`/student/courses/${courseId}/learn`} variant="light" size="xs" ml="sm">Mulai Belajar</Button>
                 </Alert>
             )}


            <Paper withBorder shadow="md" p="xl" radius="md">
                <Stack>
                    <Text fw={500}>Kursus yang Dibeli:</Text>
                    <Text size="lg">{course.course_title}</Text>
                    <Divider />
                    <Group justify="space-between">
                        <Text>Harga:</Text>
                        <Text fw={700} size="xl">{formatPrice(course.course_price)}</Text>
                    </Group>
                    <Divider />
                     <Text size="sm" c="dimmed">Detail Pembeli:</Text>
                     <Text size="sm">{session.user.name || session.user.email}</Text>

                    {/* Tombol Checkout (Client Component) */}
                    <CheckoutButton
                        courseId={course.course_id!}
                        userId={parseInt(session.user.id)}
                        amount={course.course_price!} // Harga pasti > 0 di sini
                        email={session.user.email!}
                        name={session.user.name || ''}
                    />

                     <Button component={Link} href={`/courses/${course.course_id}`} variant="outline" color="gray" leftSection={<IconArrowLeft size={16}/>}>
                        Batal
                     </Button>
                </Stack>
            </Paper>
        </Container>
    );
}