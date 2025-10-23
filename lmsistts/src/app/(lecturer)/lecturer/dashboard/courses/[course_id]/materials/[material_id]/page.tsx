// lmsistts/src/app/(lecturer)/lecturer/dashboard/courses/[course_id]/materials/[material_id]/page.tsx

import {
  Container,
  Title,
  Text,
  Alert,
  Breadcrumbs,
  Anchor,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMaterialDetailsForLecturer } from "@/app/actions/lecturer.actions";
import { MaterialDetailManager } from "@/components/lecturer/MaterialDetailManager";

export default async function ManageMaterialDetailsPage({
  params,
}: {
  params: { course_id: string; material_id: string };
}) {
  const courseId = parseInt(params.course_id, 10);
  const materialId = parseInt(params.material_id, 10);

  if (isNaN(courseId) || isNaN(materialId)) notFound();

  // Ambil data detail materi (termasuk info material induknya)
  const result = await getMaterialDetailsForLecturer(materialId);

  if (!result.success) {
    if (result.error?.includes("tidak ditemukan")) notFound();
    return (
      <Container py="xl">
        <Alert color="red" title="Gagal Memuat Data" icon={<IconAlertCircle />}>
          {result.error || "Terjadi kesalahan."}
        </Alert>
      </Container>
    );
  }

  const { material, details, quizzes } = result.data;

  // Breadcrumbs
  const items = [
    { title: "Dashboard", href: "/lecturer/dashboard" },
    { title: "Manajemen Kursus", href: "/lecturer/dashboard/courses" },
    {
      title: "Materi Kursus",
      href: `/lecturer/dashboard/courses/${courseId}/materials`,
    },
    {
      title: material.material_name || `Bab ${materialId}`,
      href: `/lecturer/dashboard/courses/${courseId}/materials/${materialId}`,
    },
  ].map((item, index) => (
    <Anchor component={Link} href={item.href} key={index}>
      {item.title}
    </Anchor>
  ));

  return (
    <Container fluid>
      <Breadcrumbs mb="lg">{items}</Breadcrumbs>
      <Title order={3}>Kelola Konten: {material.material_name}</Title>
      <Text c="dimmed" mb="lg">
        Tambah, edit, atau hapus video, PDF, Quiz, link, dan tugas di dalam bab
        ini.
      </Text>

      <MaterialDetailManager
        details={details as any[]}
        quizzes={quizzes as any[]}
        materialId={materialId}
        courseId={courseId}
      />
      
    </Container>
  );
}
