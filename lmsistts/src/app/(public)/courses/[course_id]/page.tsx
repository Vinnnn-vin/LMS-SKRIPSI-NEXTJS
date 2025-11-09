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
  Box,
  Divider,
  List,
  Avatar,
  Rating,
  ListItem,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconVideo,
  IconFileText,
  IconLink,
  IconPencil,
  IconClock,
  IconUsers,
  IconTrophy,
  IconCertificate,
  IconCheck,
  IconPlayerPlay,
  IconChevronRight,
  IconTool,
} from "@tabler/icons-react";
import { notFound } from "next/navigation";
import { getCourseDetailsById } from "@/app/actions/course.actions";
import Link from "next/link";
import classes from "./CourseDetail.module.css";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined || price === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

function getMaterialIcon(type: number) {
  const iconSize = { width: rem(18), height: rem(18) };
  switch (type) {
    case 1:
      return <IconVideo style={iconSize} />;
    case 2:
      return <IconFileText style={iconSize} />;
    case 3:
      return <IconLink style={iconSize} />;
    case 4:
      return <IconPencil style={iconSize} />;
    default:
      return <IconFileText style={iconSize} />;
  }
}

function getMaterialTypeLabel(type: number) {
  switch (type) {
    case 1:
      return "Video";
    case 2:
      return "Dokumen";
    case 3:
      return "Link";
    case 4:
      return "Tugas";
    default:
      return "Materi";
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  const courseId = parseInt((await params).course_id, 10);
  if (isNaN(courseId)) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  const { success, data: course, error } = await getCourseDetailsById(courseId);

  if (!success || !course) {
    if (error === "Kursus tidak ditemukan.") {
      notFound();
    }
    return (
      <Container py="xl">
        <Alert color="red" title="Terjadi Kesalahan" icon={<IconAlertCircle />}>
          {error || "Gagal memuat kursus."}
        </Alert>
      </Container>
    );
  }

  let buttonHref = `/courses/${courseId}/checkout`;
  let buttonText = "Daftar Kursus";
  let buttonIcon = undefined;

  if (userRole === "admin") {
    buttonHref = "/admin/dashboard/courses";
    buttonText = "Kelola Kursus (Admin)";
    buttonIcon = <IconTool size={18} />;
  } else if (userRole === "lecturer") {
    buttonHref = "/lecturer/dashboard/courses";
    buttonText = "Kelola Kursus (Dosen)";
    buttonIcon = <IconTool size={18} />;
  }

  const totalMaterials =
    course.materials?.reduce(
      (acc: number, mat: any) => acc + (mat.details?.length || 0),
      0
    ) || 0;

  const estimatedHours = Math.floor(totalMaterials * 0.5) + 2;

  return (
    <>
      <Box className={classes.heroSection}>
        <Container size="xl">
          <Grid gutter="xl" align="center">
            <GridCol span={{ base: 12, md: 7 }}>
              <Stack gap="lg">
                <Group gap="sm">
                  <Badge
                    size="lg"
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan" }}
                  >
                    {course.category?.category_name || "General"}
                  </Badge>
                  <Badge size="lg" variant="light" color="green">
                    Akses Selamanya
                  </Badge>
                </Group>

                <Title order={1} size="h1" className={classes.courseTitle}>
                  {course.course_title}
                </Title>

                <Text
                  size="lg"
                  c="dimmed"
                  className={classes.courseDescription}
                >
                  {course.course_description ||
                    "Tingkatkan skill Anda dengan kursus berkualitas ini."}
                </Text>

                <Group gap="xl">
                  <Group gap="xs">
                    <Avatar
                      size="md"
                      radius="xl"
                      variant="gradient"
                      gradient={{ from: "blue", to: "cyan" }}
                    >
                      {course.lecturer?.first_name?.[0] || "I"}
                    </Avatar>
                    <Box>
                      <Text size="sm" c="dimmed">
                        Instruktur
                      </Text>
                      <Text fw={600}>
                        {course.lecturer
                          ? `${course.lecturer.first_name || ""} ${course.lecturer.last_name || ""}`.trim()
                          : "N/A"}
                      </Text>
                    </Box>
                  </Group>

                  <Divider orientation="vertical" />

                  <Box>
                    <Group gap={4}>
                      <Rating value={4.5} fractions={2} readOnly size="sm" />
                      <Text fw={600}>4.5</Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      1,234 siswa
                    </Text>
                  </Box>
                </Group>
              </Stack>
            </GridCol>

            <GridCol span={{ base: 12, md: 5 }}>
              <Card
                shadow="xl"
                padding="lg"
                radius="lg"
                className={classes.priceCard}
                withBorder
              >
                <CardSection>
                  <Box className={classes.thumbnailWrapper}>
                    <Image
                      src={
                        course.thumbnail_url ||
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3"
                      }
                      height={200}
                      alt={course.course_title}
                    />
                    <Box className={classes.playOverlay}>
                      <ThemeIcon
                        size={60}
                        radius="xl"
                        variant="white"
                        className={classes.playButton}
                      >
                        <IconPlayerPlay size={30} />
                      </ThemeIcon>
                    </Box>
                  </Box>
                </CardSection>

                <Stack mt="lg" gap="md">
                  <Group justify="space-between" align="center">
                    <Box>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Harga Kursus
                      </Text>
                      <Text size="2rem" fw={900} className={classes.price}>
                        {formatPrice(course.course_price)}
                      </Text>
                    </Box>
                  </Group>

                  <Button
                    size="lg"
                    fullWidth
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan" }}
                    component={Link}
                    href={buttonHref}
                    leftSection={buttonIcon}
                    className={classes.enrollButton}
                    rightSection={<IconChevronRight size={20} />}
                    color={
                      userRole === "admin" || userRole === "lecturer"
                        ? "gray"
                        : "blue"
                    }
                  >
                    {buttonText}
                  </Button>

                  <Divider />

                  <Stack gap="sm">
                    <Group gap="xs">
                      <IconCheck
                        size={18}
                        color="var(--mantine-color-green-6)"
                      />
                      {userRole !== "admin" && userRole !== "lecturer" && (
                        <Text size="xs" c="dimmed" ta="center">
                          Akses selamanya ke semua materi
                        </Text>
                      )}
                    </Group>
                    <Group gap="xs">
                      <IconCheck
                        size={18}
                        color="var(--mantine-color-green-6)"
                      />
                      <Text size="sm">Sertifikat kelulusan</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck
                        size={18}
                        color="var(--mantine-color-green-6)"
                      />
                      <Text size="sm">Akses di mobile & desktop</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck
                        size={18}
                        color="var(--mantine-color-green-6)"
                      />
                      <Text size="sm">
                        {totalMaterials} materi pembelajaran
                      </Text>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            </GridCol>
          </Grid>
        </Container>
      </Box>

      <Box className={classes.statsSection}>
        <Container size="xl">
          <Grid>
            <GridCol span={{ base: 6, sm: 3 }}>
              <Paper p="md" radius="md" className={classes.statCard}>
                <Group>
                  <ThemeIcon size="lg" variant="light" color="blue">
                    <IconClock size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xl" fw={700}>
                      {estimatedHours}h
                    </Text>
                    <Text size="xs" c="dimmed">
                      Durasi
                    </Text>
                  </Box>
                </Group>
              </Paper>
            </GridCol>
            <GridCol span={{ base: 6, sm: 3 }}>
              <Paper p="md" radius="md" className={classes.statCard}>
                <Group>
                  <ThemeIcon size="lg" variant="light" color="cyan">
                    <IconUsers size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xl" fw={700}>
                      1.2K
                    </Text>
                    <Text size="xs" c="dimmed">
                      Siswa
                    </Text>
                  </Box>
                </Group>
              </Paper>
            </GridCol>
            <GridCol span={{ base: 6, sm: 3 }}>
              <Paper p="md" radius="md" className={classes.statCard}>
                <Group>
                  <ThemeIcon size="lg" variant="light" color="teal">
                    <IconTrophy size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xl" fw={700}>
                      4.5
                    </Text>
                    <Text size="xs" c="dimmed">
                      Rating
                    </Text>
                  </Box>
                </Group>
              </Paper>
            </GridCol>
            <GridCol span={{ base: 6, sm: 3 }}>
              <Paper p="md" radius="md" className={classes.statCard}>
                <Group>
                  <ThemeIcon size="lg" variant="light" color="grape">
                    <IconCertificate size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xl" fw={700}>
                      Yes
                    </Text>
                    <Text size="xs" c="dimmed">
                      Sertifikat
                    </Text>
                  </Box>
                </Group>
              </Paper>
            </GridCol>
          </Grid>
        </Container>
      </Box>

      <Container size="xl" py={60}>
        <Grid gutter="xl">
          <GridCol span={{ base: 12, md: 8 }}>
            <Stack gap="xl">
              <Box>
                <Title order={2} mb="md">
                  Kurikulum Kursus
                </Title>
                <Text c="dimmed" mb="xl">
                  {course.materials?.length || 0} bab • {totalMaterials} materi
                  pembelajaran
                </Text>

                <Accordion
                  variant="separated"
                  radius="md"
                  className={classes.curriculum}
                  defaultValue={course.materials?.[0]?.material_id?.toString()}
                >
                  {course.materials?.map((material: any, index: number) => (
                    <AccordionItem
                      key={material.material_id}
                      value={String(material.material_id)}
                      className={classes.accordionItem}
                    >
                      <AccordionControl className={classes.accordionControl}>
                        <Group>
                          <ThemeIcon
                            variant="light"
                            size="lg"
                            color="blue"
                            radius="md"
                          >
                            <Text size="sm" fw={700}>
                              {index + 1}
                            </Text>
                          </ThemeIcon>
                          <Box style={{ flex: 1 }}>
                            <Text fw={600} size="md">
                              {material.material_name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {material.details?.length || 0} materi
                            </Text>
                          </Box>
                        </Group>
                      </AccordionControl>
                      <AccordionPanel>
                        <Stack gap="xs">
                          {material.details?.map(
                            (detail: any, detailIndex: number) => (
                              <Paper
                                key={detail.material_detail_id}
                                p="md"
                                withBorder
                                radius="md"
                                className={classes.materialItem}
                              >
                                <Group justify="space-between">
                                  <Group>
                                    <ThemeIcon
                                      variant="light"
                                      size="md"
                                      color="cyan"
                                    >
                                      {getMaterialIcon(
                                        detail.material_detail_type
                                      )}
                                    </ThemeIcon>
                                    <Box>
                                      <Text size="sm" fw={500}>
                                        {detail.material_detail_name}
                                      </Text>
                                      <Text size="xs" c="dimmed">
                                        {getMaterialTypeLabel(
                                          detail.material_detail_type
                                        )}
                                      </Text>
                                    </Box>
                                  </Group>
                                  <Badge size="sm" variant="light" color="gray">
                                    {Math.floor(Math.random() * 15) + 5} menit
                                  </Badge>
                                </Group>
                              </Paper>
                            )
                          )}
                        </Stack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Box>
            </Stack>
          </GridCol>

          <GridCol span={{ base: 12, md: 4 }}>
            <Stack gap="lg">
              <Paper p="lg" radius="md" withBorder>
                <Title order={3} size="h4" mb="md">
                  Yang Akan Anda Pelajari
                </Title>
                <List
                  spacing="sm"
                  size="sm"
                  icon={
                    <ThemeIcon color="green" size={20} radius="xl">
                      <IconCheck size={12} />
                    </ThemeIcon>
                  }
                >
                  <ListItem>Memahami konsep dasar hingga lanjutan</ListItem>
                  <ListItem>Praktik langsung dengan project nyata</ListItem>
                  <ListItem>Best practices dari industri</ListItem>
                  <ListItem>Tips dan trik dari expert</ListItem>
                </List>
              </Paper>

              <Paper p="lg" radius="md" withBorder>
                <Title order={3} size="h4" mb="md">
                  Persyaratan
                </Title>
                <List spacing="sm" size="sm">
                  <ListItem>Komputer atau laptop</ListItem>
                  <ListItem>Koneksi internet stabil</ListItem>
                  <ListItem>Semangat untuk belajar</ListItem>
                </List>
              </Paper>

              <Paper p="lg" radius="md" withBorder className={classes.ctaCard}>
                <Stack gap="md" align="center" ta="center">
                  <ThemeIcon
                    size={60}
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan" }}
                  >
                    <IconTrophy size={30} />
                  </ThemeIcon>
                  <Box>
                    <Title order={4} size="h5">
                      Siap Memulai?
                    </Title>
                    <Text size="sm" c="dimmed" mt={4}>
                      Bergabunglah dengan ribuan siswa lainnya
                    </Text>
                  </Box>
                  <Button
                    fullWidth
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan" }}
                    component={Link}
                    href={`/student/courses/${courseId}/checkout`}
                  >
                    Daftar Sekarang
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </GridCol>
        </Grid>
      </Container>
    </>
  );
}
