'use client';

import { Box, Burger, Group, NavLink, Title, Grid, Paper } from '@mantine/core'; // Impor Grid, Box, Paper
import { useDisclosure } from '@mantine/hooks';
import { IconGauge, IconUsers, IconBook, IconCategory, IconCash } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/admin/dashboard', label: 'Overview', icon: IconGauge },
  { href: '/admin/dashboard/users', label: 'Manajemen User', icon: IconUsers },
  { href: '/admin/dashboard/courses', label: 'Manajemen Kursus', icon: IconBook },
  { href: '/admin/dashboard/categories', label: 'Manajemen Kategori', icon: IconCategory },
  { href: '/admin/dashboard/sales', label: 'Manajemen Penjualan', icon: IconCash },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  return (
    <Grid gutter="md" style={{ height: 'calc(100vh - 70px)' }}> {/* Adjust height based on header */}
      {/* Sidebar */}
      <Grid.Col span={{ base: 12, sm: 3, md: 2 }}>
        <Paper withBorder p="md" style={{ height: '100%' }}>
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              href={link.href}
              label={link.label}
              leftSection={<link.icon size="1rem" stroke={1.5} />}
              component={Link}
              active={pathname === link.href}
            />
          ))}
        </Paper>
      </Grid.Col>

      {/* Main Content */}
      <Grid.Col span={{ base: 12, sm: 9, md: 10 }}>
        <Box p="md">{children}</Box>
      </Grid.Col>
    </Grid>
  );
}