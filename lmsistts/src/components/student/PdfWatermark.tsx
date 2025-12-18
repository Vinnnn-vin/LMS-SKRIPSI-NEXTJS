"use client";

import { Text } from "@mantine/core";

export function PdfWatermark({ text }: { text: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 20,
        opacity: 0.12,
        transform: "rotate(-35deg)",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <Text key={i} fw={900} size="lg">
          {text}
        </Text>
      ))}
    </div>
  );
}
