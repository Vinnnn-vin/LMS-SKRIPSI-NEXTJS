// lmsistts\src\app\(student)\student\courses\[course_id]\learn\page.tsx

import { Container, Alert, Loader, Center, Anchor, Text } from '@mantine/core';
import { getCourseLearningData } from '@/app/actions/student.actions';
import { notFound } from 'next/navigation';
import { CourseLearningClientUI } from '@/components/student/CourseLearningClientUI';
import { Suspense } from 'react';
import Link from 'next/link';

export default async function LearnCoursePage({ params }: { params: Promise<{ course_id: string }> }) {
    const courseId = parseInt((await params).course_id, 10);
    if (isNaN(courseId)) notFound();

    const result = await getCourseLearningData(courseId);

    if (!result.success) {
        if (result.error?.includes('Anda tidak terdaftar')) {
            return (
                <Container py="xl">
                    <Alert color="red" title="Akses Ditolak">
                        <Text>{result.error} <Anchor component={Link} href={`/courses/${courseId}`}>Lihat detail kursus.</Anchor></Text>
                    </Alert>
                </Container>
            );
        }
        notFound(); // 404 untuk error "kursus tidak ditemukan"
    }

    const { course, completedItems, enrollment_id, totalProgress } = result.data;

    return (
        // Gunakan Suspense untuk loading di komponen client
        <Suspense fallback={<Center h="100vh"><Loader /></Center>}>
            <CourseLearningClientUI
                course={course as any}
                completedItems={completedItems}
                enrollmentId={enrollment_id as number}
                totalProgress={totalProgress}
            />
        </Suspense>
    );
}