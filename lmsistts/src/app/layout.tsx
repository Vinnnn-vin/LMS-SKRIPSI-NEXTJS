// lmsistts\src\app\layout.tsx
import type { Metadata } from "next";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import AuthProvider from "./AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "LMS",
  description: "Learning Management System",
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
        <AuthProvider>
          <MantineProvider defaultColorScheme="auto">
            <Notifications />
            {/* <Header /> */}
            <main>{children}</main>
            {/* <Footer /> */}
          </MantineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
