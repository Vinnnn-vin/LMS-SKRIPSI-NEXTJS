// lmsistts\src\components\landing\HeroBanner.tsx

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
            <span className={classes.highlight}>iClick</span>
          </Title>
          <Text className={classes.description}>
            Pintu gerbang Anda menuju pengetahuan tak terbatas. Belajar dari para ahli industri, 
            kapan saja, di mana saja, dan capai tujuan karir Anda lebih cepat.
          </Text>
          <Group className={classes.controls}>
            <Button 
              size="xl" 
              className={`${classes.control} ${classes.primaryButton}`}
              component={Link} 
              href="/courses"
            >
              Jelajahi Kursus
            </Button>
            <Button 
              size="xl"
              className={`${classes.control} ${classes.secondaryButton}`}
              component={Link} 
              href="/register"
            >
              Daftar Gratis
            </Button>
          </Group>
        </div>
      </Container>
    </div>
  );
}