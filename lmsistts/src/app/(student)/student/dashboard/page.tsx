// lmsistts\src\app\(student)\student\dashboard\page.tsx

import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Paper,
  Group,
  ThemeIcon,
  rem,
  Alert,
  Stack,
  Card,
  Image,
  Badge,
  Progress,
  Button,
  CardSection,
  Tooltip,
} from "@mantine/core";
import {
  IconSchool,
  IconCertificate,
  IconPlayerPlay,
  IconAlertCircle,
  IconBookmark,
  IconCreditCard,
} from "@tabler/icons-react";
import {
  getStudentDashboardStats,
  getMyEnrolledCoursesWithProgress,
  getPendingPayments,
} from "@/app/actions/student.actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";

const formatNumber = (num: number) =>
  new Intl.NumberFormat("id-ID").format(num);

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);

  const [statsResult, coursesResult, pendingPaymentsResult] = await Promise.all(
    [
      getStudentDashboardStats(),
      getMyEnrolledCoursesWithProgress(),
      getPendingPayments(),
    ]
  );

  if (
    !statsResult.success ||
    !coursesResult.success ||
    !pendingPaymentsResult.success
  ) {
    return (
      <Container py="xl">
        <Alert
          color="red"
          title="Gagal Memuat Data Dashboard"
          icon={<IconAlertCircle />}
        >
          {statsResult.error ||
            coursesResult.error ||
            pendingPaymentsResult.error || // <-- Tampilkan error jika ada
            "Terjadi kesalahan."}
        </Alert>
      </Container>
    );
  }

  const stats = [
    {
      title: "Kursus Aktif",
      value: formatNumber(statsResult.data.activeCourses),
      icon: IconSchool,
      color: "blue",
    },
    {
      title: "Kursus Selesai",
      value: formatNumber(statsResult.data.completedCourses),
      icon: IconCertificate,
      color: "green",
    },
  ];

  const activeCourses = coursesResult.data?.active || [];
  const completedCourses = coursesResult.data?.completed || [];
  const pendingPayments = pendingPaymentsResult.data || [];

  return (
    <Container fluid>
      <Stack mb="xl">
        <Title order={3}>
          Selamat Datang, {session?.user?.name || "Mahasiswa"}
        </Title>
        <Text c="dimmed">Mari lanjutkan perjalanan belajar Anda hari ini!</Text>
      </Stack>
      {pendingPayments.length > 0 && (
        <Alert
          color="orange"
          icon={<IconCreditCard size={24} />}
          title="Pembayaran Tertunda"
          mb="xl"
          radius="md"
        >
          <Stack gap="md">
            <Text size="sm">
              Anda memiliki {pendingPayments.length} transaksi yang belum
              selesai. Selesaikan pembayaran untuk memulai kursus Anda.
            </Text>
            {pendingPayments.map((payment: any) => (
              <Paper withBorder p="sm" radius="md" key={payment.payment_id}>
                <Group justify="space-between">
                  <Stack gap={0}>
                    <Text fw={500}>{payment.course.course_title}</Text>
                    <Text size="xs" c="dimmed">
                      Invoice ID: {payment.gateway_external_id}
                    </Text>
                  </Stack>
                  <Button
                    component={Link}
                    href={`/courses/${payment.course_id}/checkout`}
                    size="xs"
                    variant="filled"
                    color="orange"
                  >
                    Lanjutkan Pembayaran
                  </Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {stats.map((stat) => (
          <Paper withBorder p="md" radius="md" key={stat.title}>
            <Group>
              <ThemeIcon
                color={stat.color}
                variant="light"
                size={60}
                radius={60}
              >
                <stat.icon
                  style={{ width: rem(32), height: rem(32) }}
                  stroke={1.5}
                />
              </ThemeIcon>
              <div>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                  {stat.title}
                </Text>
                <Text fw={700} size="xl">
                  {stat.value}
                </Text>
              </div>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      {activeCourses.length > 0 && (
        <>
          <Title order={4} mt="xl" mb="md">
            Kursus Aktif
          </Title>

          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
            {activeCourses.map((course: any) => (
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                key={course.enrollment_id}
              >
                <CardSection>
                  <Image
                    src={
                      course.thumbnail_url ||
                      "https://placehold.co/600x400?text=Course"
                    }
                    height={160}
                    alt={course.course_title}
                  />
                </CardSection>

                <Group justify="space-between" mt="md" mb="xs">
                  <Text fw={500} size="lg" lineClamp={1}>
                    {course.course_title}
                  </Text>
                  <Badge color="pink" variant="light">
                    {course.category?.category_name || "General"}
                  </Badge>
                </Group>

                <Stack gap="xs" mt="sm">
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      {course.progress}% Selesai
                    </Text>
                    {course.lastCheckpoint && (
                      <Tooltip label="Ada checkpoint tersimpan">
                        <Badge
                          size="xs"
                          color="blue"
                          variant="dot"
                          leftSection={<IconBookmark size={12} />}
                        >
                          Tersimpan
                        </Badge>
                      </Tooltip>
                    )}
                  </Group>
                  <Progress
                    value={course.progress}
                    radius="sm"
                    animated={course.progress < 100}
                  />
                </Stack>

                <Button
                  component={Link}
                  href={`/student/courses/${course.course_id}/learn`}
                  variant="light"
                  color="blue"
                  fullWidth
                  mt="md"
                  radius="md"
                  leftSection={<IconPlayerPlay size={16} />}
                >
                  {course.progress > 0 ? "Lanjutkan Belajar" : "Mulai Belajar"}
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        </>
      )}

      {completedCourses.length > 0 && (
        <>
          <Title order={4} mt="xl" mb="md">
            Kursus Selesai
          </Title>

          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
            {completedCourses.map((course: any) => (
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                key={course.enrollment_id}
              >
                <CardSection>
                  <Image
                    src={
                      course.thumbnail_url ||
                      "https://placehold.co/600x400?text=Course"
                    }
                    height={160}
                    alt={course.course_title}
                  />
                </CardSection>

                <Group justify="space-between" mt="md" mb="xs">
                  <Text fw={500} size="lg" lineClamp={1}>
                    {course.course_title}
                  </Text>
                  <Badge color="green" variant="light">
                    Selesai
                  </Badge>
                </Group>

                <Button
                  component={Link}
                  href={`/student/courses/${course.course_id}/learn`}
                  variant="outline"
                  color="green"
                  fullWidth
                  mt="md"
                  radius="md"
                  leftSection={<IconCertificate size={16} />}
                >
                  Lihat Materi
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        </>
      )}

      {activeCourses.length === 0 && completedCourses.length === 0 && (
        <Paper withBorder p="xl" radius="md" ta="center" mt="xl">
          <Text c="dimmed">Anda belum mendaftar di kursus apa pun.</Text>
          <Button component={Link} href="/courses" mt="md">
            Jelajahi Kursus Sekarang
          </Button>
        </Paper>
      )}
    </Container>
  );
}
