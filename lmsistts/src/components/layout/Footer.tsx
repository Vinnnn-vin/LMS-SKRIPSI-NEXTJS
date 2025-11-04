"use client";

import {
  Text,
  Container,
  ActionIcon,
  Group,
  Anchor,
  Box,
  Stack,
} from "@mantine/core";
import {
  IconBrandTwitter,
  IconBrandYoutube,
  IconBrandInstagram,
  IconBrandDiscord,
  IconBrandGithub,
} from "@tabler/icons-react";
import Link from "next/link";
import classes from "./Footer.module.css";

const data = [
  {
    title: "Tentang",
    links: [
      { label: "Tentang Kami", link: "/about" },
      { label: "Blog", link: "/blog" },
      { label: "Karir", link: "/careers" },
      { label: "Menjadi Instruktur", link: "/become-instructor" },
    ],
  },
  {
    title: "Komunitas",
    links: [
      { label: "Gabung Discord", link: "https://discord.gg/iclick" },
      { label: "Forum", link: "/forum" },
      { label: "Event", link: "/events" },
      { label: "Success Stories", link: "/success-stories" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "FAQ", link: "/faq" },
      { label: "Kontak Kami", link: "/contact" },
      { label: "Support Center", link: "/support" },
    ],
  },
  {
    title: "Kategori",
    links: [
      { label: "Web Development", link: "/categories/web-development" },
      { label: "Data Science", link: "/categories/data-science" },
      { label: "Mobile Development", link: "/categories/mobile-development" },
      { label: "UI/UX Design", link: "/categories/ui-ux-design" },
    ],
  },
];

export function Footer() {
  const groups = data.map((group) => (
    <Stack gap="xs" key={group.title} className={classes.wrapper}>
      <Text className={classes.title}>{group.title}</Text>
      <Stack gap={4}>
        {group.links.map((link, index) => (
          <Anchor
            key={index}
            component={Link}
            href={link.link}
            className={classes.link}
            onClick={(e) => {
              if (link.link.startsWith("http")) {
                e.preventDefault();
                window.open(link.link, "_blank", "noopener,noreferrer");
              }
            }}
          >
            {link.label}
          </Anchor>
        ))}
      </Stack>
    </Stack>
  ));

  return (
    <Box component="footer" className={classes.footer}>
      <Container size="xl" className={classes.inner}>
        {/* Logo dan Deskripsi */}
        <Stack gap="md" className={classes.logoSection}>
          <Text className={classes.logoText}>iClick</Text>
          <Stack gap={4}>
            <Text className={classes.description}>
              Belajar tanpa batas, capai impianmu.
            </Text>
            <Text className={classes.subDescription}>
              Platform pembelajaran online terdepan dengan kursus berkualitas
              dari instruktur ahli.
            </Text>
          </Stack>

          {/* Ikon Sosial */}
          <Group gap="xs">
            <ActionIcon
              component="a"
              href="https://twitter.com/iclick"
              target="_blank"
              variant="subtle"
            >
              <IconBrandTwitter size={18} stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component="a"
              href="https://youtube.com/iclick"
              target="_blank"
              variant="subtle"
            >
              <IconBrandYoutube size={18} stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component="a"
              href="https://instagram.com/iclick"
              target="_blank"
              variant="subtle"
            >
              <IconBrandInstagram size={18} stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component="a"
              href="https://discord.gg/iclick"
              target="_blank"
              variant="subtle"
            >
              <IconBrandDiscord size={18} stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component="a"
              href="https://github.com/iclick"
              target="_blank"
              variant="subtle"
            >
              <IconBrandGithub size={18} stroke={1.5} />
            </ActionIcon>
          </Group>
        </Stack>

        {/* Kanan: Link Group */}
        <div className={classes.groups}>{groups}</div>
      </Container>

      {/* Bagian Bawah */}
      <Container size="xl" className={classes.afterFooter}>
        <Text className={classes.copyright}>
          © {new Date().getFullYear()} iClick LMS. All rights reserved.
        </Text>

        <Group gap="md" className={classes.bottomLinks}>
          <Anchor component={Link} href="/terms" className={classes.bottomLink}>
            Terms of Service
          </Anchor>
          <Anchor
            component={Link}
            href="/privacy"
            className={classes.bottomLink}
          >
            Privacy Policy
          </Anchor>
          <Anchor
            component={Link}
            href="/cookies"
            className={classes.bottomLink}
          >
            Cookie Policy
          </Anchor>
        </Group>
      </Container>
    </Box>
  );
}
