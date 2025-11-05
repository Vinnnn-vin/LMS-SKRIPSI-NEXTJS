// lmsistts\src\app\(lecturer)\lecturer\dashboard\layout.tsx
// Alternative Version: Priority-based matching (lebih robust)

"use client";

import { Box, NavLink, Paper } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBook,
  IconClipboardCheck,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LecturerHeader } from "@/components/lecturer/LecturerHeader";

const navLinks = [
  {
    href: "/lecturer/dashboard",
    label: "Dashboard",
    icon: IconLayoutDashboard,
  },
  {
    href: "/lecturer/dashboard/courses",
    label: "Manajemen Kursus",
    icon: IconBook,
  },
  {
    href: "/lecturer/dashboard/assignments",
    label: "Review Tugas",
    icon: IconClipboardCheck,
  },
];

export default function LecturerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure(false);
  const pathname = usePathname();

  // ✅ FIXED: Fungsi untuk menentukan active link dengan prioritas
  // Link yang lebih spesifik (lebih panjang) akan diprioritaskan
  const getActiveLink = () => {
    // Sort links by length (descending) untuk prioritas matching
    const sortedLinks = [...navLinks].sort(
      (a, b) => b.href.length - a.href.length
    );

    // Cari link pertama yang match
    for (const link of sortedLinks) {
      if (pathname === link.href) {
        return link.href; // Exact match
      }
      if (pathname.startsWith(link.href + "/")) {
        return link.href; // Child path match
      }
    }

    // Fallback ke dashboard jika tidak ada yang match
    return "/lecturer/dashboard";
  };

  const activeHref = getActiveLink();

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <LecturerHeader navbarOpened={navbarOpened} toggleNavbar={toggleNavbar} />
      <Box style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar Mobile */}
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
          hiddenFrom="sm"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              href={link.href}
              label={link.label}
              leftSection={<link.icon size="1rem" />}
              component={Link}
              active={activeHref === link.href} // ✅ FIXED: Hanya satu yang active
              onClick={toggleNavbar}
            />
          ))}
        </Box>
        
        {/* Sidebar Desktop */}
        <Paper withBorder radius={0} w={250} p="md" visibleFrom="sm">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              href={link.href}
              label={link.label}
              leftSection={<link.icon size="1rem" />}
              component={Link}
              active={activeHref === link.href} // ✅ FIXED: Hanya satu yang active
            />
          ))}
        </Paper>
        
        {/* Konten Utama */}
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