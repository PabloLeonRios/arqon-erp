export const metadata = {
  title: "Arqon ERP — Arquitectura de tus operaciones",
  description: "Plataforma ERP para consumo masivo — Arqon",
};

import "./../styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header className="border-b border-neutral-800 sticky top-0 z-50 bg-[var(--bg)]/80 backdrop-blur">
          <div className="container flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Arqon" className="h-6 w-6 rounded-full ring-1 ring-white/10" />
              <span className="font-medium tracking-wide">Arqon ERP</span>
            </div>
            <nav className="text-sm text-[var(--muted)]">
              <a href="/" className="hover:text-white transition">Inicio</a>
              <span className="mx-3 opacity-50">•</span>
              <a href="/status" className="hover:text-white transition">Status</a>
            </nav>
          </div>
        </header>
        <main className="container py-12">{children}</main>
        <footer className="border-t border-neutral-800 py-8 mt-12 text-sm text-[var(--muted)]">
          <div className="container flex items-center justify-between">
            <span>© {new Date().getFullYear()} Arqon ERP</span>
            <span>Arquitectura de tus operaciones</span>
          </div>
        </footer>
      </body>
    </html>
  );
}