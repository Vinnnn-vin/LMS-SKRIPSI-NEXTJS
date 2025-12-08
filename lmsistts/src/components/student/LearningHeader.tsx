// lmsistts\src\components\student\LearningHeader.tsx

"use client";

import React from "react";
import {
  Box,
  Group,
  Tooltip,
  ActionIcon,
  Text,
  Title,
  Progress,
  Stack,
  Badge,
  Container,
} from "@mantine/core";
import Link from "next/link";
import { IconArrowLeft, IconTrophy } from "@tabler/icons-react";

export function LearningHeader({
  courseTitle,
  totalProgress,
}: {
  courseTitle: string;
  totalProgress: number;
}) {
  return (
    <>
      {/* Desktop & Tablet Header */}
      <Box
        component="header"
        px="md"
        py="sm"
        visibleFrom="sm"
        style={{
          borderBottom: `1px solid var(--mantine-color-gray-3)`,
          backgroundColor: "var(--mantine-color-body)",
        }}
      >
        <Container size="xl" px="md">
          <Group justify="space-between" wrap="nowrap" gap="md">
            {/* Left Section */}
            <Group gap="md" style={{ flex: 1, minWidth: 0 }}>
              <Tooltip label="Kembali ke Dashboard" withArrow>
                <ActionIcon
                  component={Link}
                  href="/student/dashboard/my-courses"
                  variant="light"
                  size="lg"
                  color="blue"
                  style={{ flexShrink: 0 }}
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>
              </Tooltip>
              <Box style={{ minWidth: 0, flex: 1 }}>
                <Text size="xs" c="dimmed" fw={500}>
                  Sedang Belajar
                </Text>
                <Title 
                  order={4} 
                  lineClamp={1}
                  style={{ 
                    fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                  }}
                >
                  {courseTitle}
                </Title>
              </Box>
            </Group>

            {/* Right Section - Progress */}
            <Box w={{ base: 200, md: 280 }} style={{ flexShrink: 0 }}>
              <Group justify="space-between" mb={4} gap="xs">
                <Text size="xs" c="dimmed" fw={500}>
                  Progress
                </Text>
                <Badge
                  variant="light"
                  color={totalProgress === 100 ? "green" : "blue"}
                  size="sm"
                >
                  {totalProgress}%
                </Badge>
              </Group>
              <Progress
                value={totalProgress}
                size="lg"
                radius="sm"
                animated={totalProgress < 100}
                color={totalProgress === 100 ? "green" : "blue"}
                style={{
                  boxShadow: totalProgress === 100 
                    ? '0 0 8px rgba(64, 192, 87, 0.3)' 
                    : '0 0 8px rgba(34, 139, 230, 0.2)'
                }}
              />
            </Box>
          </Group>
        </Container>
      </Box>

      {/* Mobile Header */}
      <Box
        component="header"
        p="sm"
        hiddenFrom="sm"
        style={{
          borderBottom: `1px solid var(--mantine-color-gray-3)`,
          backgroundColor: "var(--mantine-color-body)",
        }}
      >
        <Stack gap="sm">
          {/* Top Row - Back button and Title */}
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              component={Link}
              href="/student/dashboard/my-courses"
              variant="light"
              size="lg"
              color="blue"
              style={{ flexShrink: 0 }}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
            <Box style={{ minWidth: 0, flex: 1 }}>
              <Text size="xs" c="dimmed" fw={500} lineClamp={1}>
                Sedang Belajar
              </Text>
              <Title 
                order={5} 
                lineClamp={1}
                style={{ fontSize: '0.95rem' }}
              >
                {courseTitle}
              </Title>
            </Box>
          </Group>

          {/* Bottom Row - Progress Bar */}
          <Box>
            <Group justify="space-between" mb={6}>
              <Text size="xs" c="dimmed" fw={500}>
                Progress Pembelajaran
              </Text>
              <Group gap={6}>
                <Badge
                  variant="filled"
                  color={totalProgress === 100 ? "green" : "blue"}
                  size="sm"
                  style={{ fontWeight: 700 }}
                >
                  {totalProgress}%
                </Badge>
                {totalProgress === 100 && (
                  <Badge
                    variant="light"
                    color="green"
                    size="sm"
                    leftSection={<IconTrophy size={12} />}
                  >
                    Selesai
                  </Badge>
                )}
              </Group>
            </Group>
            <Progress
              value={totalProgress}
              size="md"
              radius="xl"
              animated={totalProgress < 100}
              color={totalProgress === 100 ? "green" : "blue"}
              style={{
                boxShadow: totalProgress === 100 
                  ? '0 2px 8px rgba(64, 192, 87, 0.3)' 
                  : '0 2px 8px rgba(34, 139, 230, 0.2)'
              }}
            />
          </Box>
        </Stack>
      </Box>
    </>
  );
}