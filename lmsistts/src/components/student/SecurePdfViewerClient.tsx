"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Box, Button, Group, Text, Loader, Center, Stack } from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { PdfWatermark } from "./PdfWatermark";

// Import CSS styles
// import "react-pdf/dist/esm/Page/AnnotationLayer.css";
// import "react-pdf/dist/esm/Page/TextLayer.css";

// Setup worker - gunakan jsdelivr yang lebih reliable
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  fileUrl: string;
  userName: string;
}

export default function SecurePdfViewerClientV10({ fileUrl, userName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);

  // MAXIMUM PROTECTION - Block all methods to steal content
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Ctrl+P (print)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        alert("Print dinonaktifkan untuk melindungi konten.");
        return false;
      }
      // Disable Ctrl+S (save)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        alert("Save dinonaktifkan untuk melindungi konten.");
        return false;
      }
      // Disable PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard.writeText(""); // Clear clipboard
        alert("Screenshot dinonaktifkan untuk melindungi konten.");
        return false;
      }
      // Disable F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+Shift+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+U (view source)
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        return false;
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  // Responsive width
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((e) => setWidth(e[0].contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

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
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      onCopy={(e) => {
        e.preventDefault();
        return false;
      }}
      onCut={(e) => {
        e.preventDefault();
        return false;
      }}
      onDragStart={(e) => {
        e.preventDefault();
        return false;
      }}
      onMouseDown={(e) => {
        // Prevent text selection on mouse down
        if (e.detail > 1) {
          e.preventDefault();
        }
      }}
    >
      {/* Watermark - user identification */}
      <PdfWatermark text={`• MILIK ISTTS CLICK •`} />

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
          <Group justify="center" mt="md">
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

      {/* Additional CSS protection */}
      <style jsx global>{`
        /* Disable text selection in PDF canvas */
        .react-pdf__Page__canvas {
          pointer-events: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        
        /* Block print media */
        @media print {
          body * {
            visibility: hidden !important;
          }
          body::after {
            content: "⚠️ Print dinonaktifkan untuk melindungi konten." !important;
            visibility: visible !important;
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            font-size: 24px !important;
            font-weight: bold !important;
            color: red !important;
          }
        }
      `}</style>
    </Box>
  );
}