// lmsistts\src\components\layout\Header.tsx

"use client";

import {
  Container,
  Group,
  Button,
  Menu,
  Avatar,
  Text,
  UnstyledButton,
  Burger,
  Divider,
  Box,
} from "@mantine/core";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  IconChevronDown,
  IconDashboard,
  IconLogout,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useMantineTheme } from "@mantine/core";

export function Header() {
  const { data: session, status } = useSession();
  const [opened, { toggle }] = useDisclosure(false);
  const theme = useMantineTheme();

  const user = session?.user;
  const isLoading = status === "loading";

  // Tentukan link dashboard berdasarkan role
  let dashboardLink = "/";
  if (user?.role === "student") {
    dashboardLink = "/student/dashboard";
  } else if (user?.role === "admin") {
    dashboardLink = "/admin/dashboard";
  } else if (user?.role === "lecturer") {
    dashboardLink = "/lecturer/dashboard";
  }
  return (
    <Box
      component="header"
      style={{
        borderBottom: `1px solid ${theme.colors.gray[3]}`,
        backgroundColor: theme.white,
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <Container size="xl" py="sm">
        <Group justify="space-between" align="center">
          {/* Kiri: Logo + Navigasi */}
          <Group>
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              <Text fw={700} size="xl">
                LMS Platform
              </Text>
            </Link>

            {/* Navigasi (Desktop) */}
            <Group ml="xl" gap="sm" visibleFrom="sm">
              <Button
                component={Link}
                href="/courses"
                variant="subtle"
                color="gray"
              >
                Courses
              </Button>
              <Button
                component={Link}
                href="/categories"
                variant="subtle"
                color="gray"
              >
                Categories
              </Button>
              <Button
                component={Link}
                href="/about"
                variant="subtle"
                color="gray"
              >
                About Us
              </Button>
            </Group>
          </Group>

          {/* Kanan: Menu Akun */}
          <Group visibleFrom="sm">
            {isLoading ? (
              <Text size="sm">Memuat...</Text>
            ) : user ? (
              <Menu
                shadow="md"
                width={200}
                trigger="hover"
                openDelay={100}
                closeDelay={400}
              >
                <Menu.Target>
                  <UnstyledButton>
                    <Group>
                      <Avatar src={user.image} radius="xl" size={30} />
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                          {user.name || user.email}
                        </Text>
                      </div>
                      <IconChevronDown size={14} stroke={1.5} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Akun</Menu.Label>
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
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Group>
                <Button component={Link} href="/login" variant="default">
                  Log in
                </Button>
                <Button component={Link} href="/register">
                  Sign up
                </Button>
              </Group>
            )}
          </Group>

          {/* Tombol Burger (Mobile) */}
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        </Group>

        {/* Menu mobile (opsional) */}
        {opened && (
          <Box mt="sm" hiddenFrom="sm">
            <Divider my="sm" />
            <Group dir="column" align="start">
              <Button
                component={Link}
                href="/courses"
                variant="subtle"
                color="gray"
                fullWidth
              >
                Courses
              </Button>
              <Button
                component={Link}
                href="/categories"
                variant="subtle"
                color="gray"
                fullWidth
              >
                Categories
              </Button>
              <Button
                component={Link}
                href="/about"
                variant="subtle"
                color="gray"
                fullWidth
              >
                About Us
              </Button>
              <Divider my="sm" />
              {user ? (
                <Button
                  color="red"
                  variant="light"
                  fullWidth
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Logout
                </Button>
              ) : (
                <>
                  <Button
                    component={Link}
                    href="/login"
                    variant="default"
                    fullWidth
                  >
                    Log in
                  </Button>
                  <Button component={Link} href="/register" fullWidth>
                    Sign up
                  </Button>
                </>
              )}
            </Group>
          </Box>
        )}
      </Container>
    </Box>
  );
}
