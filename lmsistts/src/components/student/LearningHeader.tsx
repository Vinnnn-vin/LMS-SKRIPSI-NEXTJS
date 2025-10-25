// lmsistts/src/components/student/LearningHeader.tsx

'use client';

import { Group, Title, Text, ActionIcon, Tooltip, Progress, Box, Anchor } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

interface LearningHeaderProps {
    courseTitle: string;
    courseDuration?: number; // Dibuat opsional
    totalProgress: number;
}

export function LearningHeader({ courseTitle, courseDuration, totalProgress }: LearningHeaderProps) {
  return (
    <Box
      component="header"
      h={70}
      px="md"
      style={{
        borderBottom: `1px solid var(--mantine-color-gray-3)`,
        backgroundColor: 'var(--mantine-color-body)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Group h="100%" justify="space-between" style={{ width: '100%' }}>
        <Group>
            <Tooltip label="Kembali ke Dashboard">
                <ActionIcon component={Link} href="/student/dashboard" variant="default" size="lg">
                    <IconArrowLeft size={18} />
                </ActionIcon>
            </Tooltip>
            <div>
                <Text size="sm" c="dimmed">Sedang Belajar:</Text>
                <Title order={4} lineClamp={1}>{courseTitle}</Title>
            </div>
        </Group>
        <Group w={{ base: 'auto', sm: 300 }}>
            <Box style={{ flex: 1 }}>
                <Text size="xs" c="dimmed">{totalProgress}% Selesai</Text>
                <Progress value={totalProgress} size="lg" radius="sm" animated={totalProgress < 100} color={totalProgress === 100 ? 'green' : 'blue'} />
            </Box>
            {courseDuration && (
                 <Text size="sm" visibleFrom="sm">{courseDuration} Jam</Text>
            )}
        </Group>
      </Group>
    </Box>
  );
}