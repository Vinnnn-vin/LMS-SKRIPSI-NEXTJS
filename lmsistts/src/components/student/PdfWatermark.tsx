"use client";

import { Text } from "@mantine/core";
import { useEffect, useState } from "react";

export function PdfWatermark({ text }: { text: string }) {
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    // Update timestamp setiap 5 detik untuk tracking
    const updateTime = () => {
      const now = new Date();
      setTimestamp(
        now.toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Main watermark grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 20,
          opacity: 0.08,
          transform: "rotate(-35deg)",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          alignItems: "center",
          justifyItems: "center",
          gap: "20px",
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Text fw={900} size="xl" style={{ whiteSpace: "nowrap" }}>
              🔒 ISTTS PROTECTED
            </Text>
            <Text fw={700} size="sm" style={{ whiteSpace: "nowrap" }}>
              {text}
            </Text>
            <Text fw={600} size="xs" style={{ whiteSpace: "nowrap" }}>
              {timestamp}
            </Text>
          </div>
        ))}
      </div>

      {/* Corner watermarks (harder to crop) */}
      {[
        { top: "10px", left: "10px", rotate: "-45deg" },
        { top: "10px", right: "10px", rotate: "45deg" },
        { bottom: "10px", left: "10px", rotate: "45deg" },
        { bottom: "10px", right: "10px", rotate: "-45deg" },
      ].map((pos, i) => (
        <div
          key={`corner-${i}`}
          style={{
            position: "absolute",
            ...pos,
            pointerEvents: "none",
            zIndex: 25,
            opacity: 0.15,
            transform: `rotate(${pos.rotate})`,
          }}
        >
          <Text fw={900} size="xs" c="red">
            {text}
          </Text>
        </div>
      ))}

      {/* Center watermark (most visible) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-35deg)",
          pointerEvents: "none",
          zIndex: 22,
          opacity: 0.12,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Text fw={900} size="40px" c="red">
            🔒 ISTTS
          </Text>
          <Text fw={800} size="xl">
            {text}
          </Text>
          <Text fw={700} size="md">
            {timestamp}
          </Text>
        </div>
      </div>
    </>
  );
}