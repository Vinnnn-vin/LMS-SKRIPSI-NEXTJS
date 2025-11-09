// lmsistts\src\app\unauthorized\page.tsx

import { Container, Title, Text, Button, Paper } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <Container size={420} my={100}>
      <Paper withBorder shadow="md" p={30} radius="md" ta="center">
        <IconLock
          size={60}
          stroke={1.5}
          style={{ margin: "0 auto", opacity: 0.5 }}
        />
        <Title order={2} mt="md">
          Akses Ditolak
        </Title>
        <Text c="dimmed" size="sm" mt={5}>
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </Text>
        <Button component={Link} href="/" fullWidth mt="xl">
          Kembali ke Beranda
        </Button>
      </Paper>
    </Container>
  );
}
