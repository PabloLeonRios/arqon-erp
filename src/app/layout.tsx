import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arqon ERP",
  description: "Arquitectura de tus operaciones",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
