// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Arqon ERP — Arquitectura de tus operaciones",
    template: "%s · Arqon ERP",
  },
  description: "Arqon ERP: arquitectura de tus operaciones.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Arqon ERP",
    description: "Arquitectura de tus operaciones",
    siteName: "Arqon ERP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arqon ERP",
    description: "Arquitectura de tus operaciones",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen overflow-y-scroll bg-neutral-50">
        {children}
      </body>
    </html>
  );
}
