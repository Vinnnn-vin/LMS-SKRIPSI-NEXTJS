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
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconChevronDown,
  IconDashboard,
  IconLogout,
  IconUserEdit,
} from "@tabler/icons-react";
import { useDisclosure, useWindowScroll } from "@mantine/hooks";
import classes from "./Header.module.css";

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [opened, { toggle }] = useDisclosure(false);

  const [scroll, scrollTo] = useWindowScroll();
  const isScrolled = scroll.y > 0;

  const user = session?.user;
  const isLoading = status === "loading";

  const getDashboardLink = () => {
    if (!user?.role) return "/";

    switch (user.role) {
      case "student":
        return "/student/dashboard";
      case "admin":
        return "/admin/dashboard";
      case "lecturer":
        return "/lecturer/dashboard";
      default:
        return "/";
    }
  };

  const dashboardLink = getDashboardLink();
  const editProfileLink = "/profile/edit";

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(dashboardLink);
  };

  const handleEditProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(editProfileLink);
  };

  return (
    <Box
      component="header"
      className={`${classes.header} ${isScrolled ? classes.scrolled : ""}`}
    >
      <Container size="xl" py="sm">
        <Group justify="space-between" align="center">
          {/* Kiri: Logo + Navigasi */}
          <Group>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Text className={classes.logo}>iClick</Text>
            </Link>

            {/* Navigasi (Desktop) */}
            <Group ml="xl" gap="sm" visibleFrom="sm">
              <Button
                component={Link}
                href="/courses"
                variant="subtle"
                className={`${classes.navButton} ${
                  isScrolled ? classes.navButtonScrolled : ""
                }`}
              >
                Courses
              </Button>
              <Button
                component={Link}
                href="/categories"
                variant="subtle"
                className={`${classes.navButton} ${
                  isScrolled ? classes.navButtonScrolled : ""
                }`}
              >
                Categories
              </Button>
              <Button
                component={Link}
                href="/about"
                variant="subtle"
                className={`${classes.navButton} ${
                  isScrolled ? classes.navButtonScrolled : ""
                }`}
              >
                About Us
              </Button>
            </Group>
          </Group>

          {/* Kanan: Menu Akun */}
          <Group visibleFrom="sm">
            {isLoading ? (
              <Text 
                size="sm" 
                className={isScrolled ? classes.textScrolled : classes.textNormal}
              >
                Memuat...
              </Text>
            ) : user ? (
              <Menu shadow="md" width={220}>
                <Menu.Target>
                  <UnstyledButton className={`${classes.userMenu} ${
                    isScrolled ? classes.userMenuScrolled : ""
                  }`}>
                    <Group gap="sm">
                      <Avatar
                        src={user.image}
                        alt={user.name ?? "Avatar"}
                        radius="xl"
                        size={32}
                      />
                      <Text 
                        size="sm" 
                        className={`${classes.userName} ${
                          isScrolled ? classes.userNameScrolled : ""
                        }`}
                      >
                        {user.name || user.email}
                      </Text>
                      <IconChevronDown 
                        size={14} 
                        stroke={1.5} 
                        className={`${classes.chevron} ${
                          isScrolled ? classes.chevronScrolled : ""
                        }`}
                      />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>
                    <Text size="xs" c="dimmed">
                      Role: {user.role?.toUpperCase()}
                    </Text>
                  </Menu.Label>

                  <Menu.Item
                    leftSection={<IconUserEdit size={16} />}
                    onClick={handleEditProfileClick}
                  >
                    Edit Profile
                  </Menu.Item>

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
                    onClick={() => {
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Group>
                <Button
                  component={Link}
                  href="/login"
                  variant="outline"
                  className={`${classes.loginButton} ${
                    isScrolled ? classes.loginButtonScrolled : ""
                  }`}
                >
                  Log in
                </Button>
                <Button
                  component={Link}
                  href="/register"
                  className={`${classes.signupButton} ${
                    isScrolled ? classes.signupButtonScrolled : ""
                  }`}
                >
                  Sign up
                </Button>
              </Group>
            )}
          </Group>

          {/* Tombol Burger (Mobile) */}
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
            className={isScrolled ? classes.burgerScrolled : classes.burgerNormal}
          />
        </Group>

        {/* Menu mobile */}
        {opened && (
          <Box className={`${classes.mobileMenu} ${
            isScrolled ? classes.mobileMenuScrolled : ""
          }`} hiddenFrom="sm">
            <Group dir="column" align="stretch" gap="xs">
              <Button
                component={Link}
                href="/courses"
                variant="subtle"
                fullWidth
                className={classes.navButton}
              >
                Courses
              </Button>
              <Button
                component={Link}
                href="/categories"
                variant="subtle"
                fullWidth
                className={classes.navButton}
              >
                Categories
              </Button>
              <Button
                component={Link}
                href="/about"
                variant="subtle"
                fullWidth
                className={classes.navButton}
              >
                About Us
              </Button>
              <Divider my="sm" color="rgba(203, 213, 225, 0.2)" />
              {user ? (
                <>
                  <Button
                    variant="light"
                    fullWidth
                    onClick={handleEditProfileClick}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="light"
                    fullWidth
                    onClick={handleDashboardClick}
                  >
                    Dashboard
                  </Button>
                  <Button
                    color="red"
                    variant="light"
                    fullWidth
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    component={Link}
                    href="/login"
                    variant="outline"
                    fullWidth
                    className={classes.loginButton}
                  >
                    Log in
                  </Button>
                  <Button
                    component={Link}
                    href="/register"
                    fullWidth
                    className={classes.signupButton}
                  >
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