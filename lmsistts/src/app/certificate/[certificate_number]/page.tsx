// lmsistts\src\app\certificate\[certificate_number]\page.tsx

import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Center,
  Box,
} from "@mantine/core";
import { notFound } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { User, Course, Certificate } from "@/lib/models";
import classes from "./Certificate.module.css";
import PrintButton from "./PrintButton";

dayjs.locale("id");

export default async function CertificatePage({
  params,
}: {
  params: { certificate_number: string };
}) {
  const certificate = await Certificate.findOne({
    where: { certificate_number: params.certificate_number },
    include: [
      { model: User, as: "student", attributes: ["first_name", "last_name"] },
      { model: Course, as: "course", attributes: ["course_title"] },
    ],
  });

  if (!certificate) {
    notFound();
  }

  const studentName =
    `${certificate.student?.first_name || ""} ${certificate.student?.last_name || ""}`.trim();
  const courseTitle = certificate.course?.course_title;
  const issuedDate = dayjs(certificate.issued_at).format("DD MMMM YYYY");

  return (
    <Box className={classes.pageWrapper}>
      <Container size="xl" px="md">
        <Paper className={classes.certificateWrapper} shadow="xl" radius="md">
          <Stack align="center" gap="sm">
            <Text
              c="dimmed"
              tt="uppercase"
              size="sm"
              style={{ color: "#0a2a5b !important" }}
            >
              Sertifikat Kelulusan
            </Text>

            <Title order={1} className={classes.title}>
              Certificate of Completion
            </Title>

            <Text mt="lg" size="lg">
              Dengan bangga diberikan kepada:
            </Text>

            <Title order={2} className={classes.studentName}>
              {studentName || "Siswa"}
            </Title>

            <Text mt="md" size="lg" ta="center">
              Atas keberhasilannya menyelesaikan kursus:
            </Text>

            <Title order={3} className={classes.courseTitle}>
              {courseTitle || "Kursus Pilihan"}
            </Title>

            <Group justify="space-between" mt="xl" w="100%" gap="md">
              <Stack gap={0} align="center" style={{ flex: 1 }}>
                <Text size="sm">Tanda Tangan Instruktur</Text>
                <Text mt="xl" className={classes.signatureLine}>
                  Dosen Pengampu
                </Text>
              </Stack>
              <Stack gap={0} align="center" style={{ flex: 1 }}>
                <Text size="sm">Tanggal Diterbitkan</Text>
                <Text mt="xl" className={classes.signatureLine}>
                  {issuedDate}
                </Text>
              </Stack>
            </Group>

            <Text
              size="xs"
              c="dimmed"
              mt="sm"
              style={{ color: "#0a2a5b !important" }}
            >
              No: {certificate.certificate_number}
            </Text>
          </Stack>
        </Paper>

        <Center mt="xl" className={classes.printButtonWrapper}>
          <PrintButton />
        </Center>
      </Container>
    </Box>
  );
}