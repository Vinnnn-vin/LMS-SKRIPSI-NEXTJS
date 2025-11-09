// lmsistts\src\app\(lecturer)\lecturer\dashboard\assignments\page.tsx

import { Container, Title, Text, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { getAssignmentsToReviewByLecturer } from "@/app/actions/lecturer.actions";
import { AssignmentReviewTable } from "@/components/lecturer/AssignmentReviewTable";

export default async function ReviewAssignmentsPage() {
  const result = await getAssignmentsToReviewByLecturer({ page: 1, limit: 15 });

  return (
    <Container fluid>
      <Title order={3}>Review Tugas Mahasiswa</Title>
      <Text c="dimmed" mb="lg">
        Lihat dan nilai tugas yang dikumpulkan oleh mahasiswa di kursus Anda.
      </Text>

      {result.success ? (
        <AssignmentReviewTable
          initialData={result.data as any[]}
          totalRecords={result.total}
        />
      ) : (
        <Alert color="red" title="Gagal Memuat Data" icon={<IconAlertCircle />}>
          {result.error || "Terjadi kesalahan saat mengambil data tugas."}
        </Alert>
      )}
    </Container>
  );
}
