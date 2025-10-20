'use client';
import { Title, Text, Button, Container, Group } from '@mantine/core';
import Link from 'next/link';
import classes from './HeroBanner.module.css';

export function HeroBanner() {
  return (
    <div className={classes.wrapper}>
      <Container size="lg" py="xl">
        <div className={classes.inner}>
          <Title className={classes.title}>
            Tingkatkan Potensi Anda Bersama{' '}
            <Text component="span" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} inherit>
              iClick
            </Text>
          </Title>
          <Text className={classes.description} c="dimmed">
            Pintu gerbang Anda menuju pengetahuan tak terbatas. Belajar dari para ahli industri, kapan saja, di mana saja, dan capai tujuan karir Anda lebih cepat.
          </Text>
          <Group className={classes.controls}>
            <Button size="xl" className={classes.control} variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} component={Link} href="/courses">
              Jelajahi Kursus
            </Button>
            <Button size="xl" variant="default" className={classes.control} component={Link} href="/register">
              Daftar Gratis
            </Button>
          </Group>
        </div>
      </Container>
    </div>
  );
}