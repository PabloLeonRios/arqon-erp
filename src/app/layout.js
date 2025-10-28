export const metadata = {
  title: "Arqon ERP — Arquitectura de tus operaciones",
  description:
    "Plataforma ERP moderna para facturación, tesorería, inventario, CRM e insights. Tecnología de punta con diseño internacional.",
  icons: { icon: "/logo.png" },
  themeColor: "#00A878",
};

import "../styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <body className="bg-grid text-gray-100 antialiased">
        {/* Glow superior */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-x-0 -top-48 mx-auto h-80 w-[70%] rounded-full bg-emerald-500/20 blur-3xl" />
        </div>
        {children}
      </body>
    </html>
  );
}
