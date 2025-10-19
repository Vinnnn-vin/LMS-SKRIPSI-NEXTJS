'use client';

import { Container, Group, Button, Menu, Avatar, Text, UnstyledButton, Burger } from '@mantine/core';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { IconChevronDown, IconDashboard, IconLogout } from '@tabler/icons-react';
import classes from './Header.module.css';
import { useDisclosure } from '@mantine/hooks';

// --- PASTIKAN 'export' ADA DI SINI ---
export function Header() {
  const { data: session, status } = useSession();
  const [opened, { toggle }] = useDisclosure(false);

  const user = session?.user;
  const isLoading = status === 'loading';

  // Tentukan link dashboard berdasarkan role
  let dashboardLink = '/'; // Default
  if (user?.role === 'student') {
    dashboardLink = '/student/dashboard';
  } else if (user?.role === 'admin') {
    dashboardLink = '/admin/dashboard';
  } else if (user?.role === 'lecturer') {
    dashboardLink = '/lecturer/dashboard';
  }

  return (
    <header className={classes.header}>
      <Container size="xl" className={classes.inner}>
        <Link href="/" passHref>
           <Text fw={700} size="xl" component="a">LMS</Text>
        </Link>

        <Group gap={5} visibleFrom="sm">
          {isLoading ? (
            <Text size="sm">Memuat...</Text>
          ) : user ? (
            <Menu shadow="md" width={200} trigger="hover" openDelay={100} closeDelay={400}>
              <Menu.Target>
                <UnstyledButton className={classes.user}>
                   <Group>
                    <Avatar
                      src={user.image}
                      alt={user.name ?? 'User Avatar'}
                      radius="xl"
                      size={30}
                    />
                    <Text fw={500} size="sm" style={{ lineHeight: 1 }} mr={3}>
                      {user.name || user.email}
                    </Text>
                    <IconChevronDown size={14} stroke={1.5} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Akun Saya</Menu.Label>
                <Menu.Item
                  leftSection={<IconDashboard size={16} />}
                  component={Link}
                  href={dashboardLink}
                >
                  Dashboard
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <>
              <Button component={Link} href="/login" variant="default">
                Log in
              </Button>
              <Button component={Link} href="/register">
                Sign up
              </Button>
            </>
          )}
        </Group>

        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
      </Container>
    </header>
  );
}

