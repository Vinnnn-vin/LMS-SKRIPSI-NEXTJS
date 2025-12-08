// lmsistts\src\components\layout\Footer.tsx

"use client";

import {
  Text,
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
import { useRouter } from "next/navigation";
import classes from "./Footer.module.css";

const data = [
  {
    title: "Tentang",
    links: [
      { label: "Tentang Kami", link: "/about", available: true },
      { label: "Blog", link: "/blog", available: false },
      { label: "Karir", link: "/careers", available: false },
      { label: "Menjadi Instruktur", link: "/become-instructor", available: false },
    ],
  },
  {
    title: "Komunitas",
    links: [
      { label: "Gabung Discord", link: "https://discord.gg/iclick", available: false, external: true },
      { label: "Forum", link: "/forum", available: false },
      { label: "Event", link: "/events", available: false },
      { label: "Success Stories", link: "/success-stories", available: false },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "FAQ", link: "/faq", available: false },
      { label: "Kontak Kami", link: "/contact", available: false },
      { label: "Support Center", link: "/support", available: false },
    ],
  },
  {
    title: "Kategori",
    links: [
      { label: "Web Development", link: "/categories/web-development", available: false },
      { label: "Data Science", link: "/categories/data-science", available: false },
      { label: "Mobile Development", link: "/categories/mobile-development", available: false },
      { label: "UI/UX Design", link: "/categories/ui-ux-design", available: false },
    ],
  },
];

export function Footer() {
  const router = useRouter();

  const handleLinkClick = (e: React.MouseEvent, link: any) => {
    e.preventDefault();
    
    if (link.external) {
      window.open(link.link, "_blank", "noopener,noreferrer");
      return;
    }

    if (!link.available) {
      router.push(`/coming-soon?dest=${encodeURIComponent(link.link)}`);
    } else {
      router.push(link.link);
    }
  };

  const groups = data.map((group) => (
    <Stack gap={4} key={group.title} className={classes.wrapper}>
      <Text className={classes.title}>{group.title}</Text>
      <Stack gap={2}>
        {group.links.map((link, index) => (
          <Anchor
            key={index}
            href={link.link}
            className={classes.link}
            onClick={(e) => handleLinkClick(e, link)}
          >
            {link.label}
          </Anchor>
        ))}
      </Stack>
    </Stack>
  ));

  const handleSocialClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    router.push(`/coming-soon?dest=${encodeURIComponent(url)}`);
  };

  const handleBottomLinkClick = (e: React.MouseEvent, link: string) => {
    e.preventDefault();
    router.push(`/coming-soon?dest=${encodeURIComponent(link)}`);
  };

  return (
    <Box component="footer" className={classes.footer}>
      <Box className={classes.inner}>
        {/* Logo Section */}
        <Stack gap="md" className={classes.logoSection}>
          <Text className={classes.logoText}>iClick</Text>
          <Box>
            <Text className={classes.description}>
              Belajar tanpa batas, capai impianmu.
            </Text>
            <Text className={classes.subDescription}>
              Platform pembelajaran online terdepan dengan kursus berkualitas
              dari instruktur ahli.
            </Text>
          </Box>

          {/* Social Icons */}
          <Group gap="xs">
            <ActionIcon
              component="a"
              href="https://twitter.com/iclick"
              onClick={(e) => handleSocialClick(e, "https://twitter.com/iclick")}
              variant="subtle"
              size="lg"
              aria-label="Twitter"
            >
              <IconBrandTwitter size={18} stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component="a"
              href="https://youtube.com/iclick"
              onClick={(e) => handleSocialClick(e, "https://youtube.com/iclick")}
              variant="subtle"
              size="lg"
              aria-label="YouTube"
            >
              <IconBrandYoutube size={18} stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component="a"
              href="https://instagram.com/iclick"
              onClick={(e) => handleSocialClick(e, "https://instagram.com/iclick")}
              variant="subtle"
              size="lg"
              aria-label="Instagram"
            >
              <IconBrandInstagram size={18} stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component="a"
              href="https://discord.gg/iclick"
              onClick={(e) => handleSocialClick(e, "https://discord.gg/iclick")}
              variant="subtle"
              size="lg"
              aria-label="Discord"
            >
              <IconBrandDiscord size={18} stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component="a"
              href="https://github.com/iclick"
              onClick={(e) => handleSocialClick(e, "https://github.com/iclick")}
              variant="subtle"
              size="lg"
              aria-label="GitHub"
            >
              <IconBrandGithub size={18} stroke={1.5} />
            </ActionIcon>
          </Group>
        </Stack>

        {/* Link Groups */}
        <div className={classes.groups}>{groups}</div>
      </Box>

      {/* Bottom Section */}
      <Box className={classes.afterFooter}>
        <Text className={classes.copyright}>
          © {new Date().getFullYear()} iClick LMS. All rights reserved.
        </Text>

        <Group gap="md" className={classes.bottomLinks}>
          <Anchor 
            href="/terms" 
            className={classes.bottomLink}
            onClick={(e) => handleBottomLinkClick(e, "/terms")}
          >
            Terms of Service
          </Anchor>
          <Anchor
            href="/privacy"
            className={classes.bottomLink}
            onClick={(e) => handleBottomLinkClick(e, "/privacy")}
          >
            Privacy Policy
          </Anchor>
          <Anchor
            href="/cookies"
            className={classes.bottomLink}
            onClick={(e) => handleBottomLinkClick(e, "/cookies")}
          >
            Cookie Policy
          </Anchor>
        </Group>
      </Box>
    </Box>
  );
}