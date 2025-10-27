'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const NAV = [
  { href: '/panel', label: 'Panel' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/productos', label: 'Productos' },
  { href: '/facturas', label: 'Facturas' },
  { href: '/tesoreria', label: 'Tesorería' },
  { href: '/presupuestos', label: 'Presupuestos' },
  { href: '/ctacte', label: 'Cta. Cte.' },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur bg-black/40 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/panel" className="flex items-center gap-3">
            <Image
              src="/logo.png"           // PNG local en /public/logo.png
              alt="Arqon ERP"
              width={36}
              height={36}
              className="rounded-md object-contain"
              priority
            />
            <span className="text-lg font-semibold tracking-tight">Arqon ERP</span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-emerald-600 text-black'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/api/logout" className="btn btn-ghost">Salir</Link>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="page">
        {children}
      </main>
    </div>
  );
}
