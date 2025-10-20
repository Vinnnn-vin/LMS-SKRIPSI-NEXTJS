// lmsistts\src\components\layout\Footer.tsx

'use client';

import { Text, Container, ActionIcon, Group, rem, Anchor } from '@mantine/core';
import { IconBrandTwitter, IconBrandYoutube, IconBrandInstagram } from '@tabler/icons-react';
import Link from 'next/link';
import classes from './Footer.module.css';

const data = [
  {
    title: 'Tentang',
    links: [
      { label: 'Tentang Kami', link: '/about' },
      { label: 'Blog', link: '#' },
      { label: 'Karir', link: '#' },
    ],
  },
  {
    title: 'Komunitas',
    links: [
      { label: 'Gabung Discord', link: '#' },
      { label: 'Forum', link: '#' },
      { label: 'Menjadi Instruktur', link: '#' },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'FAQ', link: '#' },
      { label: 'Kontak Kami', link: '#' },
    ],
  },
];

export function Footer() {
  const groups = data.map((group) => {
    const links = group.links.map((link, index) => (
      <Anchor<'a'>
        key={index}
        className={classes.link}
        component="a"
        href={link.link}
      >
        {link.label}
      </Anchor>
    ));

    return (
      <div className={classes.wrapper} key={group.title}>
        <Text className={classes.title}>{group.title}</Text>
        {links}
      </div>
    );
  });

  return (
    <footer className={classes.footer}>
      <Container className={classes.inner}>
        <div className={classes.logo}>
          <Text className={classes.logoText}>iClick</Text>
          <Text size="sm" className={classes.description}>
            Belajar tanpa batas, capai impianmu.
          </Text>
        </div>
        <div className={classes.groups}>{groups}</div>
      </Container>
      <Container className={classes.afterFooter}>
        <Text className={classes.copyright}>
          © {new Date().getFullYear()} iClick LMS. All rights reserved.
        </Text>

        <Group gap={0} justify="flex-end" wrap="nowrap">
          <ActionIcon 
            size="lg" 
            color="gray" 
            variant="subtle"
            className={classes.socialIcon}
            data-platform="twitter"
          >
            <IconBrandTwitter style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
          </ActionIcon>
          <ActionIcon 
            size="lg" 
            color="gray" 
            variant="subtle"
            className={classes.socialIcon}
            data-platform="youtube"
          >
            <IconBrandYoutube style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
          </ActionIcon>
          <ActionIcon 
            size="lg" 
            color="gray" 
            variant="subtle"
            className={classes.socialIcon}
            data-platform="instagram"
          >
            <IconBrandInstagram style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Container>
    </footer>
  );
}