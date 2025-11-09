// lmsistts\src\app\(student)\student\dashboard\layout.tsx

"use client";

import { Box, NavLink, Paper } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconLayoutDashboard,
  IconSchool,
  IconCertificate,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StudentHeader } from "@/components/student/StudentHeader";

const navLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  {
    href: "/student/dashboard/my-courses",
    label: "Kursus Saya",
    icon: IconSchool,
  },
  {
    href: "/student/dashboard/my-certificates",
    label: "Sertifikat Saya",
    icon: IconCertificate,
  },
  { href: "/profile/edit", label: "Edit Profil", icon: IconUser },
];

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure(false);
  const pathname = usePathname();

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <StudentHeader navbarOpened={navbarOpened} toggleNavbar={toggleNavbar} />
      <Box style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Box
          component="nav"
          w={{ base: "80%", sm: 250 }}
          p="md"
          style={{
            borderRight: `1px solid var(--mantine-color-gray-3)`,
            transition: "transform 0.2s ease",
            transform: navbarOpened ? "translateX(0)" : "translateX(-100%)",
            position: "fixed",
            top: 60,
            bottom: 0,
            zIndex: 100,
            backgroundColor: "var(--mantine-color-body)",
          }}
          hiddenFrom="sm"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              href={link.href}
              label={link.label}
              leftSection={<link.icon size="1rem" stroke={1.5} />}
              component={Link}
              active={pathname === link.href}
              onClick={toggleNavbar}
            />
          ))}
        </Box>

        <Paper
          component="nav"
          withBorder
          radius={0}
          w={250}
          p="md"
          visibleFrom="sm"
          style={{ height: "calc(100vh - 60px)", overflowY: "auto" }}
        >
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

        <Box
          component="main"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--mantine-spacing-md)",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
