// lmsistts\src\app\(admin)\admin\dashboard\layout.tsx

"use client";

import { Box, NavLink, Paper } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconGauge,
  IconUsers,
  IconBook,
  IconCategory,
  IconCash,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";

const navLinks = [
  { href: "/admin/dashboard", label: "Overview", icon: IconGauge },
  { href: "/admin/dashboard/users", label: "Manajemen User", icon: IconUsers },
  {
    href: "/admin/dashboard/courses",
    label: "Manajemen Kursus",
    icon: IconBook,
  },
  {
    href: "/admin/dashboard/categories",
    label: "Manajemen Kategori",
    icon: IconCategory,
  },
  {
    href: "/admin/dashboard/sales",
    label: "Manajemen Penjualan",
    icon: IconCash,
  },
];

export default function AdminDashboardLayout({
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
      <AdminHeader navbarOpened={navbarOpened} toggleNavbar={toggleNavbar} />

      <Box style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Box
          component="nav"
          w={{ base: "100%", sm: 250 }}
          p="md"
          style={{
            borderRight: `1px solid var(--mantine-color-gray-3)`,
            transition: "transform 0.2s ease",
            transform: navbarOpened ? "translateX(0)" : "translateX(-100%)",
            position: "absolute",
            top: 60,
            bottom: 0,
            zIndex: 10,
            backgroundColor: "var(--mantine-color-body)",
          }}
          visibleFrom="base"
          hiddenFrom="sm"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              href={link.href}
              label={link.label}
              leftSection={<link.icon size="1rem" />}
              component={Link}
              active={pathname === link.href}
              onClick={toggleNavbar}
            />
          ))}
        </Box>
        <Paper withBorder radius={0} w={250} p="md" visibleFrom="sm">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              href={link.href}
              label={link.label}
              leftSection={<link.icon size="1rem" />}
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
