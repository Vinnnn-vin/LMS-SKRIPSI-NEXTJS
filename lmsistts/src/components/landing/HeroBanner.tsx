// lmsistts\src\components\landing\HeroBanner.tsx

"use client";

import { Container, Title, Text, Button, Group, Box } from "@mantine/core";
import Link from "next/link";
import classes from "./HeroBanner.module.css";
import { TransitionLinkButton } from "../ui/TransitionLinkButton";

export function HeroBanner() {
  return (
    <Box className={classes.hero}>
      {/* 3D Floating Shapes */}
      <div className={classes.floatingShapes}>
        <div className={`${classes.shape} ${classes.shape1}`} />
        <div className={`${classes.shape} ${classes.shape2}`} />
        <div className={`${classes.shape} ${classes.shape3}`} />
        <div className={`${classes.shape} ${classes.shape4}`} />
        <div className={`${classes.shape} ${classes.shape5}`} />
        <div className={`${classes.shape} ${classes.shape6}`} />
      </div>

      {/* Animated Grid Background */}
      <div className={classes.gridBackground} />

      {/* Gradient Orbs */}
      <div className={classes.orb1} />
      <div className={classes.orb2} />

      {/* Content */}
      <Container size="lg" className={classes.content}>
        <div className={classes.inner}>
          <Title className={classes.title}>
            Tingkatkan Skill Anda <br />
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: "yellow", to: "pink", deg: 45 }}
              inherit
            >
              Bersama iClick
            </Text>
          </Title>

          <Text className={classes.description} size="xl">
            Platform pembelajaran online terbaik dengan instruktur berpengalaman
            dan materi berkualitas tinggi
          </Text>

          <Group className={classes.controls}>
            <TransitionLinkButton
              // component={Link}
              href="/courses"
              size="xl"
              variant="gradient"
              gradient={{ from: "blue", to: "cyan", deg: 45 }}
              className={classes.ctaButton}
            >
              Mulai Belajar Sekarang
            </TransitionLinkButton>
            <TransitionLinkButton
              href="/courses"
              size="xl"
              variant="white"
              className={classes.outlineButton}
            >
              Jelajahi Kursus
            </TransitionLinkButton>
          </Group>
        </div>
      </Container>
    </Box>
  );
}
