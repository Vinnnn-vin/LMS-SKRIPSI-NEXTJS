// src/app/(public)/coming-soon/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Title, Text, Center, Stack, ThemeIcon, Paper, Loader, rem } from "@mantine/core";
import { IconClockHour3, IconHome } from "@tabler/icons-react";

export default function ComingSoonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State untuk hitungan mundur dan status penguncian
  const [countdown, setCountdown] = useState(3);
  const [isDisabled, setIsDisabled] = useState(true); // Mulai dalam keadaan terkunci

  const destination = searchParams.get('dest') || '/'; // Ambil destinasi dari query param jika ada

  useEffect(() => {
    // 1. Set interval untuk hitungan mundur
    const timer = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          // 2. Ketika hitungan mencapai 0
          clearInterval(timer);
          setIsDisabled(false);
          router.push("/"); 
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <Container size="sm" py={120} >
      <Paper withBorder p="xl" radius="md" ta="center">
        <Center>
          <ThemeIcon size={60} radius="xl" color="orange" mb="lg">
            <IconClockHour3 size={32} />
          </ThemeIcon>
        </Center>
        
        <Title order={2} mb="xs">
          Halaman Segera Hadir!
        </Title>
        <Text c="dimmed" size="lg" mb="xl">
          Kami sedang dalam proses membangun halaman <Text span fw={700} c="orange">{destination}</Text>.
        </Text>
        
        <Stack align="center" gap="md" 
            style={{ pointerEvents: isDisabled ? 'none' : 'auto', opacity: isDisabled ? 0.7 : 1 }}
        >
          <Text size="sm">
            Anda akan diarahkan kembali ke <IconHome size={14}/> Beranda dalam:
          </Text>
          <Title order={1} c="blue" style={{ fontSize: rem(64) }}>
            {countdown}
          </Title>
          <Loader color="blue" size="md" />
          
          {/* Contoh tombol/link yang dinonaktifkan */}
          {/* Anchor di sini akan dinonaktifkan oleh style={{ pointerEvents: 'none' }} di Stack parent */}
          <Text size="xs" c="dimmed">
            (Interaksi dikunci untuk menghindari kesalahan user saat loading)
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}