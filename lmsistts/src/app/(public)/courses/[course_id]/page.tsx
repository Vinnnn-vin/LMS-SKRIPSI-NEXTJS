// lmsistts\src\app\(public)\courses\[course_id]\page.tsx

import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Image,
  Badge,
  Group,
  Button,
  Alert,
  Stack,
  rem,
  Accordion,
  ThemeIcon,
  Paper,
  GridCol,
  CardSection,
  AccordionItem,
  AccordionControl,
  AccordionPanel,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconVideo,
  IconFileText,
  IconLink,
  IconPencil,
} from "@tabler/icons-react";
import { notFound } from "next/navigation";
import { getCourseDetailsById } from "@/app/actions/course.actions";

// Helper untuk format harga
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined || price === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

// Fungsi untuk mendapatkan ikon berdasarkan tipe materi
function getMaterialIcon(type: number) {
  switch (type) {
    case 1:
      return <IconVideo style={{ width: rem(20), height: rem(20) }} />;
    case 2:
      return <IconFileText style={{ width: rem(20), height: rem(20) }} />;
    case 3:
      return <IconLink style={{ width: rem(20), height: rem(20) }} />;
    case 4:
      return <IconPencil style={{ width: rem(20), height: rem(20) }} />;
    default:
      return null;
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: { course_id: string };
}) {
  const courseId = parseInt(params.course_id, 10);
  if (isNaN(courseId)) {
    notFound(); // Tampilkan halaman 404 jika ID tidak valid
  }

  const { success, data: course, error } = await getCourseDetailsById(courseId);

  if (!success || !course) {
    if (error === "Kursus tidak ditemukan.") {
      notFound();
    }
    // Tampilkan pesan error jika ada masalah lain
    return (
      <Container py="xl">
        <Alert color="red" title="Terjadi Kesalahan" icon={<IconAlertCircle />}>
          {error || "Gagal memuat kursus."}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Grid>
        {/* Kolom Kiri: Detail Kursus */}
        <GridCol span={{ base: 12, md: 8 }}>
          <Stack>
            <Badge color="pink" size="lg" variant="light">
              {course.category?.category_name || "General"}
            </Badge>
            <Title order={1}>{course.course_title}</Title>
            <Text c="dimmed" size="lg">
              {course.course_description}
            </Text>
            <Group>
              <Text size="sm">Dibuat oleh</Text>
              <Text fw={500}>
                {course.lecturer
                  ? `${course.lecturer.first_name || ""} ${course.lecturer.last_name || ""}`.trim()
                  : "N/A"}
              </Text>
            </Group>
          </Stack>
        </GridCol>

        {/* Kolom Kanan: Kartu Pembelian & Info */}
        <GridCol span={{ base: 12, md: 4 }}>
          <Card withBorder shadow="md" radius="md" p="lg">
            <CardSection>
              <Image
                src={
                  course.thumbnail_url ||
                  "https://placehold.co/600x400?text=Course"
                }
                height={200}
              />
            </CardSection>
            <Stack mt="lg">
              <Text size="3xl" fw={700} ta="center" c="blue">
                {formatPrice(course.course_price)}
              </Text>
              <Button size="lg" fullWidth>
                Daftar Kursus
              </Button>
              <Text size="xs" c="dimmed" ta="center">
                Akses selamanya ke semua materi
              </Text>
            </Stack>
          </Card>
        </GridCol>
      </Grid>

      {/* Kurikulum Kursus */}
      <Stack mt="xl">
        <Title order={2}>Kurikulum Kursus</Title>
        <Accordion variant="separated">
          {course.materials?.map((material: any) => (
            <AccordionItem
              key={material.material_id}
              value={String(material.material_id)}
            >
              <AccordionControl>
                <Title order={4}>{material.material_name}</Title>
              </AccordionControl>
              <AccordionPanel>
                <Stack>
                  {material.details?.map((detail: any) => (
                    <Paper
                      key={detail.material_detail_id}
                      p="md"
                      withBorder
                      radius="sm"
                    >
                      <Group>
                        <ThemeIcon variant="light" size={30}>
                          {getMaterialIcon(detail.material_detail_type)}
                        </ThemeIcon>
                        <Text>{detail.material_detail_name}</Text>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </Stack>
    </Container>
  );
}
