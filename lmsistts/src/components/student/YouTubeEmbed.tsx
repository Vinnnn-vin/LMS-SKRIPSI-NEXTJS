// lmsistts\src\components\student\YouTubeEmbed.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Alert,
  Text,
  List,
  Loader,
  Center,
  Button,
  Group,
} from "@mantine/core";
import { IconAlertCircle, IconPlayerPlay } from "@tabler/icons-react";

interface YouTubeEmbedProps {
  url: string;
  title: string;
}

export function YouTubeEmbed({ url, title }: YouTubeEmbedProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userClicked, setUserClicked] = useState(false);

  const extractVideoId = (url: string): string | null => {
    try {
      console.log(
        "🔍 [YouTubeEmbed] ============ START EXTRACTION ============"
      );
      console.log("🔍 [YouTubeEmbed] Raw URL received:", url);
      console.log("🔍 [YouTubeEmbed] URL type:", typeof url);
      console.log("🔍 [YouTubeEmbed] URL length:", url?.length);

      url = url.trim();
      console.log("🔍 [YouTubeEmbed] Trimmed URL:", url);

      const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
      ];

      for (let i = 0; i < patterns.length; i++) {
        console.log(
          `🔍 [YouTubeEmbed] Testing pattern ${i}:`,
          patterns[i].toString()
        );
        const match = url.match(patterns[i]);
        console.log(`🔍 [YouTubeEmbed] Pattern ${i} match result:`, match);

        if (match && match[1]) {
          console.log(
            `✅ [YouTubeEmbed] VIDEO ID FOUND with pattern ${i}:`,
            match[1]
          );
          console.log("✅ [YouTubeEmbed] Full match array:", match);
          return match[1];
        }
      }

      console.error("❌ [YouTubeEmbed] NO PATTERN MATCHED!");
      console.error("❌ [YouTubeEmbed] URL analysis:", {
        hasYoutube: url.includes("youtube"),
        hasYoutu: url.includes("youtu"),
        hasWatch: url.includes("watch"),
        hasV: url.includes("v="),
        hasEmbed: url.includes("embed"),
      });
      return null;
    } catch (err) {
      console.error("❌ [YouTubeEmbed] EXCEPTION in extractVideoId:", err);
      console.error("❌ [YouTubeEmbed] Error details:", {
        name: err instanceof Error ? err.name : "Unknown",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return null;
    }
  };

  const verifyVideo = async (videoId: string): Promise<boolean> => {
    try {
      console.log(
        "🔍 [YouTubeEmbed] ============ START VERIFICATION ============"
      );
      console.log("🔍 [YouTubeEmbed] Verifying video ID:", videoId);

      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      console.log("🔍 [YouTubeEmbed] Thumbnail URL:", thumbnailUrl);

      const response = await fetch(thumbnailUrl, { method: "HEAD" });
      console.log("📡 [YouTubeEmbed] Response status:", response.status);
      console.log(
        "📡 [YouTubeEmbed] Response statusText:",
        response.statusText
      );
      console.log("📡 [YouTubeEmbed] Response OK:", response.ok);
      console.log(
        "📡 [YouTubeEmbed] Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        console.log("✅ [YouTubeEmbed] VERIFICATION SUCCESS!");
      } else {
        console.error(
          "❌ [YouTubeEmbed] VERIFICATION FAILED - Response not OK"
        );
      }

      return response.ok;
    } catch (err) {
      console.error("❌ [YouTubeEmbed] EXCEPTION in verifyVideo:", err);
      console.error("❌ [YouTubeEmbed] Error details:", {
        name: err instanceof Error ? err.name : "Unknown",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return false;
    }
  };

  useEffect(() => {
    const checkVideo = async () => {
      console.log(
        "🚀 [YouTubeEmbed] ============ USE EFFECT TRIGGERED ============"
      );
      console.log("🚀 [YouTubeEmbed] Component mounted/URL changed");
      console.log("🚀 [YouTubeEmbed] URL prop:", url);

      setIsLoading(true);
      setError(null);

      const id = extractVideoId(url);

      if (!id) {
        console.error(
          "❌ [YouTubeEmbed] ============ EXTRACTION FAILED ============"
        );
        setError("URL YouTube tidak valid");
        setIsLoading(false);
        return;
      }

      console.log(
        "✅ [YouTubeEmbed] Extraction successful, proceeding to verify..."
      );

      const isValid = await verifyVideo(id);

      if (!isValid) {
        console.error(
          "❌ [YouTubeEmbed] ============ VERIFICATION FAILED ============"
        );
        setError("Video tidak ditemukan atau tidak dapat di-embed");
        setIsLoading(false);
        return;
      }

      console.log(
        "✅ [YouTubeEmbed] ============ ALL CHECKS PASSED ============"
      );
      console.log("✅ [YouTubeEmbed] Setting video ID:", id);
      setVideoId(id);
      setIsLoading(false);
    };

    checkVideo();
  }, [url]);

  if (isLoading) {
    return (
      <Box
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
          overflow: "hidden",
          borderRadius: "var(--mantine-radius-md)",
          border: "1px solid var(--mantine-color-gray-3)",
          backgroundColor: "var(--mantine-color-gray-1)",
        }}
      >
        <Center style={{ position: "absolute", inset: 0 }}>
          <Loader size="md" />
        </Center>
      </Box>
    );
  }

  if (error || !videoId) {
    return (
      <Alert
        color="red"
        icon={<IconAlertCircle />}
        title="Tidak Dapat Memuat Video"
      >
        <Text size="sm" mb="xs">
          {error || "Video YouTube tidak dapat ditampilkan."}
        </Text>
        <Text size="sm" fw={500} mb="xs">
          Kemungkinan penyebab:
        </Text>
        <List size="xs" mb="md">
          <List.Item>Video bersifat private atau unlisted</List.Item>
          <List.Item>Pemilik video menonaktifkan fitur embed</List.Item>
          <List.Item>Video telah dihapus atau tidak tersedia</List.Item>
          <List.Item>Format URL tidak didukung</List.Item>
        </List>
        <Text size="xs" c="dimmed" mb="sm">
          URL: {url}
        </Text>
        <Group gap="xs">
          <Button
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            variant="light"
          >
            Buka di YouTube
          </Button>
        </Group>
      </Alert>
    );
  }

  if (!userClicked) {
    return (
      <Box
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
          overflow: "hidden",
          borderRadius: "var(--mantine-radius-md)",
          border: "1px solid var(--mantine-color-gray-3)",
          cursor: "pointer",
          backgroundImage: `url(https://img.youtube.com/vi/${videoId}/maxresdefault.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onClick={() => {
          console.log("👆 [YouTubeEmbed] User clicked play button");
          setUserClicked(true);
        }}
      >
        <Center
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
        >
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 0, 0, 0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
          >
            <IconPlayerPlay size={40} color="white" style={{ marginLeft: 4 }} />
          </Box>
        </Center>
      </Box>
    );
  }

  const iframeSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  console.log("🎬 [YouTubeEmbed] ============ RENDERING IFRAME ============");
  console.log("🎬 [YouTubeEmbed] Video ID:", videoId);
  console.log("🎬 [YouTubeEmbed] Iframe src:", iframeSrc);
  console.log("🎬 [YouTubeEmbed] User clicked:", userClicked);

  return (
    <Box
      style={{
        position: "relative",
        paddingBottom: "56.25%",
        height: 0,
        overflow: "hidden",
        borderRadius: "var(--mantine-radius-md)",
        border: "1px solid var(--mantine-color-gray-3)",
      }}
    >
      <iframe
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        src={iframeSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        onLoad={() =>
          console.log("✅ [YouTubeEmbed] Iframe loaded successfully")
        }
        onError={(e) =>
          console.error("❌ [YouTubeEmbed] Iframe load error:", e)
        }
      />
    </Box>
  );
}
