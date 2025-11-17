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
  IconLock,
  IconClipboardText,
} from "@tabler/icons-react";
import { notFound } from "next/navigation";
import { getCourseDetailsById } from "@/app/actions/course.actions";
import Link from "next/link";
import classes from "./CourseDetail.module.css";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { YouTubeEmbed } from "@/components/student/YouTubeEmbed";

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
                    {/* GUNAKAN DATA DARI DB */}
                    <Text size="xl" fw={700}>
                      {course.course_duration || "0"}h
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
                    {/* GUNAKAN DATA DARI DB */}
                    <Text size="xl" fw={700}>
                      {course.studentCount}
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
                    {/* GUNAKAN DATA DARI DB */}
                    <Text size="xl" fw={700}>
                      {course.averageRating}
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
                        <Stack gap="lg">
                          {" "}
                          {material.details?.map((detail: any) => (
                            <Paper
                              key={detail.material_detail_id}
                              p="md"
                              radius="md"
                              withBorder
                              bg={
                                detail.is_free
                                  ? "var(--mantine-color-gray-0)"
                                  : "white"
                              }
                            >
                              <Group
                                justify="space-between"
                                mb={detail.is_free ? "md" : 0}
                              >
                                <Group>
                                  <ThemeIcon
                                    variant="light"
                                    size="md"
                                    color={detail.is_free ? "teal" : "gray"}
                                  >
                                    {detail.is_free ? (
                                      getMaterialIcon(
                                        detail.material_detail_type
                                      )
                                    ) : (
                                      <IconLock size={16} />
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
                                  {detail.is_free && (
                                    <Badge color="teal" variant="filled">
                                      PREVIEW GRATIS
                                    </Badge>
                                  )}
                                </Group>
                                {!detail.is_free && (
                                  <Badge size="sm" variant="light" color="gray">
                                    Terkunci
                                  </Badge>
                                )}
                              </Group>

                              {detail.is_free && (
                                <Stack gap="xs" mt="md" pl={38}>
                                  {detail.material_detail_description && (
                                    <Text
                                      size="sm"
                                      c="dimmed"
                                      style={{ whiteSpace: "pre-wrap" }}
                                    >
                                      {detail.material_detail_description}
                                    </Text>
                                  )}

                                  {/* Tipe 1 & 3 (Video YouTube) */}
                                  {(detail.material_detail_type === 1 ||
                                    detail.material_detail_type === 3) &&
                                    detail.materi_detail_url && (
                                      <YouTubeEmbed
                                        url={detail.materi_detail_url}
                                        title={detail.material_detail_name}
                                      />
                                    )}

                                  {/* Tipe 2 (PDF) */}
                                  {detail.material_detail_type === 2 &&
                                    detail.materi_detail_url && (
                                      <iframe
                                        src={detail.materi_detail_url}
                                        style={{
                                          width: "100%",
                                          height: "400px",
                                          border:
                                            "1px solid var(--mantine-color-gray-3)",
                                          borderRadius:
                                            "var(--mantine-radius-md)",
                                        }}
                                        title={detail.material_detail_name}
                                      />
                                    )}

                                  {/* Tipe 4 (Tugas) - Hanya tampilkan deskripsi */}
                                  {detail.material_detail_type === 4 && (
                                    <Alert
                                      icon={<IconClipboardText size={16} />}
                                      color="blue"
                                      variant="light"
                                      title="Tugas"
                                    >
                                      Siswa akan diminta untuk mengumpulkan
                                      tugas pada materi ini.
                                    </Alert>
                                  )}
                                </Stack>
                              )}
                            </Paper>
                          ))}
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
                  {/* UBAH MENJADI DINAMIS */}
                  {course.learnList && course.learnList.length > 0 ? (
                    course.learnList.map((item: string, index: number) => (
                      <ListItem key={index}>{item}</ListItem>
                    ))
                  ) : (
                    <ListItem>
                      Detail pembelajaran akan segera ditambahkan.
                    </ListItem>
                  )}
                </List>
              </Paper>

              <Paper p="lg" radius="md" withBorder>
                <Title order={3} size="h4" mb="md">
                  Persyaratan
                </Title>
                <List spacing="sm" size="sm">
                  {/* UBAH MENJADI DINAMIS */}
                  {course.requirementsList &&
                  course.requirementsList.length > 0 ? (
                    course.requirementsList.map(
                      (item: string, index: number) => (
                        <ListItem key={index}>{item}</ListItem>
                      )
                    )
                  ) : (
                    <ListItem>Tidak ada persyaratan khusus.</ListItem>
                  )}
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
