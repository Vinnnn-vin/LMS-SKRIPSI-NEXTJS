// lmsistts/src/components/student/StudentHeader.tsx

"use client";

import {
  Group,
  Burger,
  Title,
  rem,
  Box,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface StudentHeaderProps {
  navbarOpened: boolean;
  toggleNavbar: () => void;
}

export function StudentHeader({
  navbarOpened,
  toggleNavbar,
}: StudentHeaderProps) {
  const router = useRouter();

  return (
    <Box
      component="header"
      h={60}
      px="md"
      style={{
        borderBottom: `1px solid var(--mantine-color-gray-3)`,
        backgroundColor: "var(--mantine-color-body)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Group h="100%" justify="space-between" style={{ width: "100%" }}>
        <Group>
          <Burger
            opened={navbarOpened}
            onClick={toggleNavbar}
            hiddenFrom="sm"
            size="sm"
          />
          <Tooltip label="Kembali ke Halaman Utama">
            <ActionIcon
              variant="default"
              onClick={() => router.push("/")}
              size="lg"
              visibleFrom="sm"
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Tooltip>
          <Title order={4}>Student Dashboard</Title>
        </Group>
      </Group>
    </Box>
  );
}
