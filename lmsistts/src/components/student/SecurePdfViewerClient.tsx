"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Box, Button, Group, Text, Loader, Center, Stack, Paper } from "@mantine/core";
import { IconArrowLeft, IconArrowRight, IconShieldLock } from "@tabler/icons-react";
import { PdfWatermark } from "./PdfWatermark";

// Setup worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  fileUrl: string;
  userName: string;
}

export default function SecurePdfViewerClient({ fileUrl, userName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  // ============================================
  // 1. BLOCK KEYBOARD SHORTCUTS
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Disable Print (Ctrl+P)
      if (ctrl && e.key === "p") {
        e.preventDefault();
        e.stopPropagation();
        alert("🚫 Print dinonaktifkan untuk melindungi konten.");
        return false;
      }

      // Disable Save (Ctrl+S)
      if (ctrl && e.key === "s") {
        e.preventDefault();
        e.stopPropagation();
        alert("🚫 Save dinonaktifkan untuk melindungi konten.");
        return false;
      }

      // Disable PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard.writeText("");
        alert("🚫 Screenshot dinonaktifkan untuk melindungi konten.");
        return false;
      }

      // Disable DevTools - F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      // Disable DevTools - Ctrl+Shift+I
      if (ctrl && shift && e.key === "I") {
        e.preventDefault();
        return false;
      }

      // Disable DevTools - Ctrl+Shift+J
      if (ctrl && shift && e.key === "J") {
        e.preventDefault();
        return false;
      }

      // Disable DevTools - Ctrl+Shift+C
      if (ctrl && shift && e.key === "C") {
        e.preventDefault();
        return false;
      }

      // Disable View Source - Ctrl+U
      if (ctrl && e.key === "u") {
        e.preventDefault();
        return false;
      }

      // Disable Select All - Ctrl+A
      if (ctrl && e.key === "a") {
        e.preventDefault();
        return false;
      }

      // Disable Copy - Ctrl+C
      if (ctrl && e.key === "c") {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  // ============================================
  // 2. BLOCK COPY, PASTE, CUT
  // ============================================
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCut, true);
    document.addEventListener("paste", handlePaste, true);

    return () => {
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCut, true);
      document.removeEventListener("paste", handlePaste, true);
    };
  }, []);

  // ============================================
  // 3. BLOCK RIGHT CLICK / CONTEXT MENU
  // ============================================
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener("contextmenu", handleContextMenu, true);
    return () => document.removeEventListener("contextmenu", handleContextMenu, true);
  }, []);

  // ============================================
  // 4. DETECT DEVTOOLS OPEN
  // ============================================
  useEffect(() => {
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        setIsDevToolsOpen(true);
      } else {
        setIsDevToolsOpen(false);
      }
    };

    detectDevTools();
    window.addEventListener("resize", detectDevTools);
    
    const interval = setInterval(detectDevTools, 1000);

    return () => {
      window.removeEventListener("resize", detectDevTools);
      clearInterval(interval);
    };
  }, []);

  // ============================================
  // 5. BLOCK PRINT DIALOG
  // ============================================
  useEffect(() => {
    const beforePrint = (e: Event) => {
      e.preventDefault();
      alert("🚫 Print dinonaktifkan untuk melindungi konten.");
      return false;
    };

    window.addEventListener("beforeprint", beforePrint);
    return () => window.removeEventListener("beforeprint", beforePrint);
  }, []);

  // ============================================
  // 6. RESPONSIVE WIDTH
  // ============================================
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((e) => setWidth(e[0].contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ============================================
  // 7. DISABLE DRAG & DROP
  // ============================================
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // If DevTools detected, show warning
  if (isDevToolsOpen) {
    return (
      <Center style={{ minHeight: "400px" }}>
        <Paper p="xl" withBorder shadow="md" radius="md">
          <Stack align="center" gap="md">
            <IconShieldLock size={64} color="red" />
            <Text size="xl" fw={700} c="red">
              Konten Dilindungi
            </Text>
            <Text size="sm" ta="center" c="dimmed">
              Developer Tools terdeteksi. Tutup Developer Tools untuk melanjutkan.
            </Text>
          </Stack>
        </Paper>
      </Center>
    );
  }

  return (
    <Box
      ref={containerRef}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        WebkitTouchCallout: "none",
        position: "relative",
        overflow: "hidden",
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onCopy={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onCut={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onMouseDown={(e) => {
        if (e.detail > 1) {
          e.preventDefault();
        }
      }}
      
    >
      {/* Multiple Watermarks for better protection */}
      <PdfWatermark text={userName || "ISTTS PROTECTED"} />
      
      {/* Transparent overlay to block interaction */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      />

      <Stack gap="md">
        <Center>
          <Document
            file={fileUrl}
            loading={
              <Center style={{ minHeight: "400px" }}>
                <Loader size="lg" />
              </Center>
            }
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            error={
              <Center style={{ minHeight: "400px" }}>
                <Text c="red" size="sm">
                  PDF gagal dimuat. Pastikan file dapat diakses.
                </Text>
              </Center>
            }
          >
            <Page
              pageNumber={page}
              width={Math.min(width, 900)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </Center>

        {numPages > 1 && (
          <Group justify="center" mt="md" style={{ position: "relative", zIndex: 15 }}>
            <Button
              variant="default"
              disabled={page <= 1}
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>

            <Text size="sm" fw={500}>
              Halaman {page} dari {numPages}
            </Text>

            <Button
              variant="default"
              disabled={page >= numPages}
              rightSection={<IconArrowRight size={16} />}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </Group>
        )}
      </Stack>

      {/* Enhanced CSS Protection */}
      <style jsx global>{`
        /* Disable ALL text selection */
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }

        /* Block PDF canvas interaction */
        .react-pdf__Page__canvas {
          pointer-events: none !important;
          -webkit-user-drag: none !important;
          -khtml-user-drag: none !important;
          -moz-user-drag: none !important;
          -o-user-drag: none !important;
          user-drag: none !important;
        }

        /* Block text layer */
        .react-pdf__Page__textContent {
          display: none !important;
        }

        /* Block annotation layer */
        .react-pdf__Page__annotations {
          display: none !important;
        }

        /* Block print completely */
        @media print {
          * {
            display: none !important;
            visibility: hidden !important;
          }
          
          body {
            display: block !important;
            visibility: visible !important;
          }
          
          body::after {
            content: "⚠️ PRINT DINONAKTIFKAN - Konten dilindungi hak cipta ISTTS" !important;
            display: block !important;
            visibility: visible !important;
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            font-size: 28px !important;
            font-weight: bold !important;
            color: #ff0000 !important;
            text-align: center !important;
            background: white !important;
            padding: 40px !important;
            border: 5px solid red !important;
            z-index: 999999 !important;
          }
        }

        /* Disable drag on images */
        img {
          pointer-events: none !important;
          -webkit-user-drag: none !important;
          user-drag: none !important;
        }

        /* Block screenshot tools overlay */
        ::selection {
          background: transparent !important;
          color: inherit !important;
        }

        ::-moz-selection {
          background: transparent !important;
          color: inherit !important;
        }
      `}</style>
    </Box>
  );
}