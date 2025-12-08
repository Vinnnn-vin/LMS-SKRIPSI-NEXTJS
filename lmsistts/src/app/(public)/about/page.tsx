// lmsistts\src\app\(public)\about\page.tsx
"use client";
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Grid,
  Image,
  List,
  ThemeIcon,
  Divider,
  GridCol,
  ListItem,
  SimpleGrid,
  Box,
  Badge,
  Group,
  Center,
} from "@mantine/core";
import {
  IconCheck,
  IconTarget,
  IconEye,
  IconRocket,
  IconUsers,
  IconTrophy,
  IconSparkles,
  IconBook,
  IconCertificate,
  IconDeviceLaptop,
  IconBulb,
  IconHeart,
  IconPalette,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import classes from "./about.module.css";

export default function AboutUsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    { value: "10K+", label: "Siswa Aktif", icon: IconUsers, color: "blue" },
    { value: "500+", label: "Kursus Tersedia", icon: IconBook, color: "cyan" },
    {
      value: "98%",
      label: "Tingkat Kepuasan",
      icon: IconTrophy,
      color: "teal",
    },
    {
      value: "50+",
      label: "Instruktur Expert",
      icon: IconSparkles,
      color: "grape",
    },
  ];

  const features = [
    {
      icon: IconBook,
      title: "Kurikulum Berkualitas",
      description: "Materi terstruktur dari para ahli di bidangnya",
      color: "blue",
    },
    {
      icon: IconDeviceLaptop,
      title: "Platform Modern",
      description: "Antarmuka yang mudah digunakan dan responsif",
      color: "cyan",
    },
    {
      icon: IconBulb,
      title: "Pembelajaran Interaktif",
      description: "Kuis, tugas, dan diskusi yang menarik",
      color: "orange",
    },
    {
      icon: IconCertificate,
      title: "Sertifikat Resmi",
      description: "Dapatkan sertifikat setelah menyelesaikan kursus",
      color: "teal",
    },
    {
      icon: IconUsers,
      title: "Komunitas Suportif",
      description: "Belajar bersama ribuan siswa lainnya",
      color: "grape",
    },
    {
      icon: IconRocket,
      title: "Update Berkelanjutan",
      description: "Materi selalu diperbarui mengikuti perkembangan",
      color: "pink",
    },
  ];

  const team = [
    {
      name: "Product Manager",
      role: "Strategy & Vision",
      icon: IconTarget,
      color: { from: "blue", to: "cyan" },
    },
    {
      name: "Lead Developer",
      role: "Technical Expert",
      icon: IconDeviceLaptop,
      color: { from: "grape", to: "pink" },
    },
    {
      name: "UX Designer",
      role: "User Experience",
      icon: IconPalette,
      color: { from: "orange", to: "red" },
    },
    {
      name: "Content Creator",
      role: "Quality Content",
      icon: IconBulb,
      color: { from: "teal", to: "lime" },
    },
  ];

  return (
    <Box className={classes.pageWrapper}>
      {/* Hero Section */}
      <Box className={classes.heroSection}>
        <Container size="xl" className={classes.heroContainer}>
          <Center>
            <Stack
              gap="xl"
              align="center"
              maw={800}
              className={`${classes.heroContent} ${mounted ? classes.mounted : ""}`}
            >
              <Badge size="lg" variant="white" className={classes.heroBadge}>
                <Group gap="xs">
                  <IconSparkles size={16} />
                  <Text className={classes.badgeText}>
                    Platform Pembelajaran Modern
                  </Text>
                </Group>
              </Badge>

              <Title order={1} ta="center" c="white" className={classes.heroTitle}>
                Tentang iClick LMS
              </Title>

              <Text size="lg" ta="center" c="white" className={classes.heroDescription}>
                Membawa pendidikan ke level berikutnya dengan teknologi dan
                inovasi terkini
              </Text>
            </Stack>
          </Center>
        </Container>

        <Box className={classes.heroGradient} />
      </Box>

      <Container size="xl" className={classes.mainContainer}>
        {/* Stats Section */}
        <SimpleGrid
          cols={{ base: 2, sm: 2, md: 4 }}
          spacing="xl"
          className={`${classes.statsGrid} ${mounted ? classes.mounted : ""}`}
        >
          {stats.map((stat, index) => (
            <Paper
              key={index}
              p="xl"
              radius="lg"
              withBorder
              className={classes.statCard}
            >
              <ThemeIcon
                size={60}
                radius="xl"
                variant="light"
                color={stat.color}
                className={classes.statIcon}
              >
                <stat.icon className={classes.statIconSvg} />
              </ThemeIcon>
              <Text className={classes.statValue} data-color={stat.color}>
                {stat.value}
              </Text>
              <Text size="sm" c="dimmed" fw={500}>
                {stat.label}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>

        {/* Main Content Grid */}
        <Grid gutter="xl" className={classes.contentGrid}>
          <GridCol span={{ base: 12, md: 7 }}>
            <Paper
              shadow="md"
              p="xl"
              radius="lg"
              withBorder
              className={`${classes.mainContent} ${mounted ? classes.mounted : ""}`}
            >
              <Stack gap="xl">
                <Group wrap="nowrap" align="flex-start" className={classes.contentHeader}>
                  <ThemeIcon
                    size={60}
                    radius="lg"
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan" }}
                  >
                    <IconRocket className={classes.headerIcon} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      Tentang Kami
                    </Text>
                    <Title order={2} className={classes.sectionTitle}>
                      Platform Belajar Inovatif
                    </Title>
                  </Box>
                </Group>

                <Text size="lg" style={{ lineHeight: 1.8 }} c="dimmed" className={classes.description}>
                  iClick LMS adalah platform Learning Management System modern
                  yang dirancang untuk memberikan pengalaman belajar online yang
                  interaktif, fleksibel, dan efektif. Kami percaya bahwa
                  pendidikan berkualitas harus dapat diakses oleh siapa saja,
                  kapan saja, dan di mana saja.
                </Text>

                <Text size="lg" style={{ lineHeight: 1.8 }} c="dimmed" className={classes.description}>
                  Dibangun dengan teknologi terkini (Next.js, Mantine UI,
                  Sequelize), iClick LMS menawarkan antarmuka yang ramah
                  pengguna, fitur yang kaya, dan performa yang handal untuk
                  mendukung perjalanan belajar Anda.
                </Text>

                <Divider
                  my="md"
                  label={
                    <Badge variant="light" size="lg">
                      <Group gap="xs">
                        <IconHeart size={14} />
                        <Text>Misi & Visi</Text>
                      </Group>
                    </Badge>
                  }
                  labelPosition="center"
                />

                <Grid gutter="md">
                  <GridCol span={{ base: 12, sm: 6 }}>
                    <Paper p="xl" radius="md" className={classes.missionCard}>
                      <Stack gap="md">
                        <ThemeIcon size={50} radius="xl" variant="white">
                          <IconTarget size={26} />
                        </ThemeIcon>
                        <Box>
                          <Title order={4} c="white" mb="xs" className={classes.cardTitle}>
                            Misi Kami
                          </Title>
                          <Text size="sm" c="white" className={classes.cardText}>
                            Memberdayakan individu melalui pendidikan online
                            yang berkualitas dan mudah diakses, serta mendukung
                            para pengajar dalam berbagi ilmu secara efektif.
                          </Text>
                        </Box>
                      </Stack>
                    </Paper>
                  </GridCol>

                  <GridCol span={{ base: 12, sm: 6 }}>
                    <Paper p="xl" radius="md" className={classes.visionCard}>
                      <Stack gap="md">
                        <ThemeIcon size={50} radius="xl" variant="white">
                          <IconEye size={26} />
                        </ThemeIcon>
                        <Box>
                          <Title order={4} c="white" mb="xs" className={classes.cardTitle}>
                            Visi Kami
                          </Title>
                          <Text size="sm" c="white" className={classes.cardText}>
                            Menjadi platform LMS pilihan utama di Indonesia yang
                            menginspirasi pembelajaran seumur hidup dan inovasi
                            pendidikan.
                          </Text>
                        </Box>
                      </Stack>
                    </Paper>
                  </GridCol>
                </Grid>
              </Stack>
            </Paper>
          </GridCol>

          <GridCol span={{ base: 12, md: 5 }}>
            <Stack
              gap="lg"
              className={`${classes.sideContent} ${mounted ? classes.mounted : ""}`}
            >
              <Paper radius="lg" className={classes.imageCard}>
                <Image
                  radius="lg"
                  src="/images/about-placeholder.jpg"
                  alt="Tentang iClick LMS"
                  fallbackSrc="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&w=800"
                  style={{ display: "block", aspectRatio: "16/9" }}
                />
              </Paper>

              <Paper shadow="md" p="xl" radius="lg" withBorder>
                <Group mb="xl" wrap="nowrap" align="flex-start">
                  <ThemeIcon
                    size={50}
                    radius="lg"
                    variant="gradient"
                    gradient={{ from: "teal", to: "lime" }}
                  >
                    <IconCheck size={26} stroke={3} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                      Keunggulan
                    </Text>
                    <Title order={3} className={classes.listTitle}>Kenapa Memilih Kami?</Title>
                  </Box>
                </Group>

                <List
                  spacing="md"
                  size="md"
                  icon={
                    <ThemeIcon size={24} radius="xl" variant="light" color="teal">
                      <IconCheck size={14} stroke={3} />
                    </ThemeIcon>
                  }
                >
                  <ListItem>
                    <Text fw={500} className={classes.listItemText}>
                      Kurikulum terstruktur dari para ahli
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text fw={500} className={classes.listItemText}>
                      Platform modern dan mudah digunakan
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text fw={500} className={classes.listItemText}>
                      Fitur interaktif (kuis, tugas, diskusi)
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text fw={500} className={classes.listItemText}>
                      Sertifikat penyelesaian kursus
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text fw={500} className={classes.listItemText}>
                      Komunitas belajar yang suportif
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text fw={500} className={classes.listItemText}>
                      Update materi berkelanjutan
                    </Text>
                  </ListItem>
                </List>
              </Paper>
            </Stack>
          </GridCol>
        </Grid>

        {/* Features Section */}
        <Box className={classes.featuresSection}>
          <Center className={classes.sectionHeader}>
            <Stack gap="md" align="center" maw={700}>
              <Badge size="lg" variant="light" color="blue">
                Fitur Unggulan
              </Badge>
              <Title order={2} ta="center" className={classes.featuresTitle}>
                Mengapa iClick LMS?
              </Title>
              <Text size="lg" ta="center" c="dimmed" className={classes.featuresDescription}>
                Fitur-fitur canggih yang dirancang untuk pengalaman belajar
                terbaik
              </Text>
            </Stack>
          </Center>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
            {features.map((feature, index) => (
              <Paper
                key={index}
                p="xl"
                radius="lg"
                withBorder
                className={classes.featureCard}
              >
                <Stack gap="md" align="center" ta="center">
                  <ThemeIcon
                    size={70}
                    radius="xl"
                    variant="light"
                    color={feature.color}
                  >
                    <feature.icon className={classes.featureIcon} />
                  </ThemeIcon>
                  <Box>
                    <Title order={4} mb="xs" className={classes.featureTitle}>
                      {feature.title}
                    </Title>
                    <Text size="sm" c="dimmed" className={classes.featureDescription}>
                      {feature.description}
                    </Text>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Box>

        {/* Team Section */}
        <Box className={classes.teamSection}>
          <Center className={classes.sectionHeader}>
            <Stack gap="md" align="center" maw={700}>
              <Badge
                size="lg"
                variant="gradient"
                gradient={{ from: "blue", to: "cyan" }}
              >
                Tim Profesional
              </Badge>
              <Title order={2} ta="center" className={classes.teamTitle}>
                Tim Kami
              </Title>
              <Text size="lg" ta="center" c="dimmed" className={classes.teamDescription}>
                Bersama para expert yang berdedikasi untuk memberikan yang
                terbaik
              </Text>
            </Stack>
          </Center>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
            {team.map((member, index) => (
              <Paper
                key={index}
                p="xl"
                radius="lg"
                withBorder
                className={classes.teamCard}
              >
                <Stack gap="md" align="center">
                  <ThemeIcon
                    size={80}
                    radius="xl"
                    variant="gradient"
                    gradient={member.color}
                  >
                    <member.icon className={classes.teamIcon} />
                  </ThemeIcon>
                  <Box style={{ textAlign: "center" }}>
                    <Text fw={700} size="lg">
                      {member.name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {member.role}
                    </Text>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Box>
      </Container>
    </Box>
  );
}