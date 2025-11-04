// lmsistts\src\app\(public)\courses\page.tsx

'use client';

import { 
  Container, 
  Title, 
  Text, 
  SimpleGrid, 
  Card, 
  Badge, 
  Group, 
  Button, 
  Alert, 
  Stack, 
  CardSection,
  Box,
  BackgroundImage,
  Overlay,
  Center,
  Rating,
  Avatar,
  Paper,
  TextInput,
  Select,
  Grid,
  ThemeIcon,
  GridCol,
  ActionIcon,
  Loader
} from '@mantine/core';
import { 
  IconAlertCircle, 
  IconSearch, 
  IconFilter,
  IconUsers,
  IconClock,
  IconBook,
  IconRocket,
  IconTrendingUp,
  IconCertificate,
  IconArrowRight,
  IconPlayCard,
  IconX
} from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { getAllCourses, getAllCategories } from '@/app/actions/course.actions';
import type { CourseCardData } from '@/lib/schemas/course.schema';
import classes from './CoursePage.module.css';
import { useDebouncedValue } from '@mantine/hooks';

// Helper untuk format harga
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined || price === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};

// Komponen Course Card yang lebih menarik
function CourseCard({ course }: { course: any }) {
  const getRandomStudents = () => Math.floor(Math.random() * 500) + 50;
  const getRandomRating = () => (Math.random() * 1 + 4).toFixed(1);
  const getRandomDuration = () => `${Math.floor(Math.random() * 10) + 5} jam`;

  return (
    <Card
      shadow="md"
      padding="lg"
      radius="lg"
      className={classes.courseCard}
      withBorder
    >
      <CardSection className={classes.imageSection}>
        <BackgroundImage
          src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'}
          className={classes.courseImage}
        >
          <Overlay gradient="linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%)" opacity={0.8} />
          <Badge
            size="lg"
            variant="filled"
            className={classes.categoryBadge}
          >
            {course.category?.category_name || 'General'}
          </Badge>
          <div className={classes.imageOverlay}>
            <Button
              component={Link}
              href={`/courses/${course.course_id}`}
              variant="white"
              size="sm"
              radius="xl"
              leftSection={<IconPlayCard size={16} />}
              className={classes.previewButton}
            >
              Preview
            </Button>
          </div>
        </BackgroundImage>
      </CardSection>

      <Stack gap="md" mt="md" className={classes.courseContent}>
        <Box>
          <Title order={4} className={classes.courseTitle} lineClamp={2}>
            {course.course_title}
          </Title>
          <Text size="sm" c="dimmed" lineClamp={2} mt={4}>
            {course.course_description || 'Kursus premium dengan materi terupdate dan instruktur berpengalaman.'}
          </Text>
        </Box>

        <Group gap="xs" align="center">
          <Avatar 
            size="sm" 
            radius="xl"
            src={course.lecturer?.image}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
          >
            {course.lecturer?.name?.[0] || 'I'}
          </Avatar>
          <Text size="sm" c="dimmed" fw={500}>
            {course.lecturer?.name || 'Instruktur'}
          </Text>
        </Group>

        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Group gap={4}>
              <Rating value={parseFloat(getRandomRating())} fractions={2} readOnly size="sm" />
              <Text size="sm" fw={600}>{getRandomRating()}</Text>
            </Group>
            <Text size="xs" c="dimmed">{getRandomStudents()} siswa</Text>
          </Stack>
          <Group gap={4}>
            <IconClock size={14} />
            <Text size="sm">{getRandomDuration()}</Text>
          </Group>
        </Group>

        <Group justify="space-between" align="center" mt="auto">
          <Box>
            <Text size="xs" c="dimmed" fw={600}>
              Harga
            </Text>
            <Text size="xl" fw={900} className={classes.coursePrice}>
              {formatPrice(course.course_price)}
            </Text>
          </Box>
          <Button
            component={Link}
            href={`/courses/${course.course_id}`}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            size="md"
            radius="lg"
            className={classes.detailButton}
            rightSection={<IconArrowRight size={16} />}
          >
            Lihat
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

// Komponen Hero Section
function CoursesHero() {
  return (
    <Box className={classes.heroSection}>
      <Container size="xl">
        <Center py={80}>
          <Stack gap="xl" align="center" maw={800}>
            <Badge 
              size="xl" 
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              className={classes.heroBadge}
            >
              <IconRocket size={16} style={{ marginRight: 8 }} />
              Katalog Kursus
            </Badge>
            <Title order={1} ta="center" className={classes.heroTitle}>
              Temukan <span className={classes.gradientText}>Kursus Perfect</span> untuk Anda
            </Title>
            <Text ta="center" c="dimmed" size="xl">
              Jelajahi berbagai kursus berkualitas dari instruktur ahli dan tingkatkan skill Anda
            </Text>
          </Stack>
        </Center>
      </Container>
    </Box>
  );
}

// Komponen Features Section
function FeaturesSection() {
  const features = [
    {
      icon: IconCertificate,
      title: 'Sertifikat Resmi',
      description: 'Dapatkan sertifikat kelulusan yang diakui industri'
    },
    {
      icon: IconUsers,
      title: 'Instruktur Ahli',
      description: 'Belajar dari praktisi dan ahli di bidangnya'
    },
    {
      icon: IconClock,
      title: 'Akses Seumur Hidup',
      description: 'Akses materi selamanya setelah pembelian'
    },
    {
      icon: IconTrendingUp,
      title: 'Karir Terjamin',
      description: 'Tingkatkan peluang karir dengan skill baru'
    }
  ];

  return (
    <Box className={classes.featuresSection}>
      <Container size="xl" py={60}>
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
          {features.map((feature, index) => (
            <Paper
              key={feature.title}
              p="lg"
              radius="lg"
              className={classes.featureCard}
            >
              <Stack gap="sm" align="center" ta="center">
                <ThemeIcon
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  size={60}
                  radius="lg"
                >
                  <feature.icon size={28} />
                </ThemeIcon>
                <Text fw={700} size="lg">{feature.title}</Text>
                <Text size="sm" c="dimmed" ta="center">
                  {feature.description}
                </Text>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

export default function CoursesPage() {
  const [allCourses, setAllCourses] = useState<CourseCardData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchValue, setSearchValue] = useState('');
  const [categoryValue, setCategoryValue] = useState<string | null>(null);
  const [sortValue, setSortValue] = useState<string>('newest');

  const [debouncedSearch] = useDebouncedValue(searchValue, 300);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [coursesResult, categoriesResult] = await Promise.all([
        getAllCourses(),
        getAllCategories()
      ]);

      if (coursesResult.success && coursesResult.data) {
        setAllCourses(coursesResult.data);
      } else {
        setError(coursesResult.error || 'Gagal memuat kursus');
      }

      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Filter dan sort courses di client side untuk response yang instant
  const filteredCourses = useMemo(() => {
    let filtered = [...allCourses];

    // Filter by search
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(course => 
        course.course_title.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (categoryValue) {
      filtered = filtered.filter(course => 
        course.category.category_name === categoryValue
      );
    }

    // Sort
    switch (sortValue) {
      case 'newest':
        // Courses are already sorted by newest from backend
        break;
      case 'popular':
        // Keep current order or implement your own logic
        break;
      case 'rating':
        // Keep current order or implement your own logic
        break;
      case 'price_low':
        filtered.sort((a, b) => (a.course_price || 0) - (b.course_price || 0));
        break;
      case 'price_high':
        filtered.sort((a, b) => (b.course_price || 0) - (a.course_price || 0));
        break;
    }

    return filtered;
  }, [allCourses, debouncedSearch, categoryValue, sortValue]);

  // Handle reset
  const handleReset = () => {
    setSearchValue('');
    setCategoryValue(null);
    setSortValue('newest');
  };

  const activeFiltersCount = [searchValue, categoryValue].filter(Boolean).length;

  const sortOptions = [
    { value: 'newest', label: 'Terbaru' },
    { value: 'popular', label: 'Populer' },
    { value: 'rating', label: 'Rating Tertinggi' },
    { value: 'price_low', label: 'Harga Terendah' },
    { value: 'price_high', label: 'Harga Tertinggi' },
  ];

  return (
    <Box className={classes.pageContainer}>
      <CoursesHero />
      <FeaturesSection />
      
      {/* Filter Section */}
      <Box className={classes.filterSection}>
        <Container size="xl">
          <Paper p="xl" radius="lg" className={classes.filterPaper}>
            <Grid gutter="lg">
              <GridCol span={{ base: 12, md: 6 }}>
                <TextInput
                  placeholder="Cari kursus berdasarkan judul..."
                  leftSection={<IconSearch size={18} />}
                  size="md"
                  radius="lg"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  rightSection={
                    searchValue && (
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => setSearchValue('')}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    )
                  }
                />
              </GridCol>

              <GridCol span={{ base: 12, sm: 6, md: 3 }}>
                <Select
                  placeholder="Pilih Kategori"
                  leftSection={<IconFilter size={18} />}
                  data={categories}
                  value={categoryValue}
                  onChange={setCategoryValue}
                  size="md"
                  radius="lg"
                  clearable
                  searchable
                />
              </GridCol>

              <GridCol span={{ base: 12, sm: 6, md: 3 }}>
                <Select
                  placeholder="Urutkan"
                  data={sortOptions}
                  value={sortValue}
                  onChange={(val) => setSortValue(val || 'newest')}
                  size="md"
                  radius="lg"
                />
              </GridCol>
            </Grid>

            {activeFiltersCount > 0 && (
              <Group mt="md" gap="xs" align="center">
                <Text size="sm" c="dimmed">Filter aktif:</Text>
                {searchValue && (
                  <Badge 
                    variant="light" 
                    color="blue"
                    rightSection={
                      <ActionIcon 
                        size="xs" 
                        color="blue" 
                        radius="xl" 
                        variant="transparent"
                        onClick={() => setSearchValue('')}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    }
                  >
                    Pencarian: {searchValue}
                  </Badge>
                )}
                {categoryValue && (
                  <Badge 
                    variant="light" 
                    color="cyan"
                    rightSection={
                      <ActionIcon 
                        size="xs" 
                        color="cyan" 
                        radius="xl" 
                        variant="transparent"
                        onClick={() => setCategoryValue(null)}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    }
                  >
                    {categoryValue}
                  </Badge>
                )}
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  onClick={handleReset}
                  leftSection={<IconX size={14} />}
                >
                  Reset Semua
                </Button>
              </Group>
            )}
          </Paper>
        </Container>
      </Box>
      
      <Container size="xl" py={80}>
        <Stack gap="xl">
          <Group justify="space-between" align="center">
            <Box>
              <Title order={2} className={classes.coursesTitle}>
                {searchValue ? `Hasil Pencarian: "${searchValue}"` : 'Semua Kursus'}
              </Title>
              <Text c="dimmed">
                {loading ? 'Memuat...' : `${filteredCourses.length} kursus tersedia`}
                {categoryValue && ` di kategori ${categoryValue}`}
              </Text>
            </Box>
          </Group>

          {error && (
            <Alert color="red" title="Terjadi Kesalahan" icon={<IconAlertCircle />}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Center py={60}>
              <Stack align="center" gap="md">
                <Loader size="lg" />
                <Text c="dimmed">Memuat kursus...</Text>
              </Stack>
            </Center>
          ) : filteredCourses.length > 0 ? (
            <SimpleGrid 
              cols={{ base: 1, sm: 2, lg: 3 }} 
              spacing="xl"
              verticalSpacing="xl"
            >
              {filteredCourses.map((course: any) => (
                <CourseCard key={course.course_id} course={course} />
              ))}
            </SimpleGrid>
          ) : (
            <Paper p="xl" radius="lg" ta="center" className={classes.emptyState}>
              <Stack gap="md" align="center">
                <IconBook size={48} color="var(--mantine-color-gray-4)" />
                <Title order={3} c="dimmed">
                  {searchValue || categoryValue ? 'Tidak ada kursus yang sesuai' : 'Tidak ada kursus yang tersedia'}
                </Title>
                <Text c="dimmed" maw={400}>
                  {searchValue || categoryValue 
                    ? 'Coba ubah filter pencarian Anda atau hapus beberapa filter.'
                    : 'Saat ini belum ada kursus yang tersedia. Silakan kembali lagi nanti.'}
                </Text>
                {(searchValue || categoryValue) && (
                  <Button
                    variant="light"
                    size="md"
                    radius="lg"
                    onClick={handleReset}
                  >
                    Reset Filter
                  </Button>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}