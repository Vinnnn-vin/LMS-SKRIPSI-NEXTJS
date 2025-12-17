// lmsistts\src\app\layout.tsx
import type { Metadata } from "next";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css"; // PENTING!
import NextTopLoader from "nextjs-toploader";
import AuthProvider from "./AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "LMS",
  description: "Learning Management System",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-mantine-color-scheme="light">
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <NextTopLoader
          color="#228be6" // Warna Biru Mantine (sesuaikan dengan tema Anda)
          initialPosition={0.08} // Posisi awal saat mulai (0.08 = 8%)
          crawlSpeed={200} // Kecepatan animasi merambat
          height={3} // Ketebalan garis (3px cukup elegan)
          crawl={true} // Aktifkan animasi merambat
          showSpinner={false} // False = HANYA garis di atas (seperti GitHub). True = Ada spinner putar di pojok kanan.
          easing="ease"
          speed={200}
          shadow="0 0 10px #228be6,0 0 5px #228be6" // Efek glowing/bayangan
          zIndex={1600} // Pastikan di atas navbar/modal Mantine
        />
        <AuthProvider>
          <MantineProvider defaultColorScheme="auto">
            <Notifications position="top-right" zIndex={9999} limit={3} />
            {/* <Header /> */}
            <main>{children}</main>
            {/* <Footer /> */}
          </MantineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
