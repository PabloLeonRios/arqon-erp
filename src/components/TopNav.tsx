"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const links = [
  { href: "/panel", label: "Panel" },
  { href: "/clientes", label: "Clientes" },
  { href: "/productos", label: "Productos" },
  { href: "/facturas", label: "Facturas" },
  { href: "/tesoreria", label: "TesorerÃ­a" },
  { href: "/presupuestos", label: "Presupuestos" },
  { href: "/ctacte", label: "Cta. Cte." },
];

export default function TopNav({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const active = useMemo(() => pathname?.split("?")[0], [pathname]);

  return (
    <header className="app-nav">
      <div className="app-nav-inner">
        <Link href="/panel" className="brand">
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="Arqon ERP"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <span>Arqon ERP</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {links.map((l) => {
            const isActive = active === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-xl px-3 py-2 text-sm ${
                  isActive
                    ? "bg-[color:var(--muted)] text-[color:var(--fg)] border border-[color:var(--border)]"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {userEmail ? (
            <span className="hidden sm:block text-sm text-neutral-300">
              {userEmail}
            </span>
          ) : null}
          <Link href="/api/auth/signout" className="kbd-logout text-sm">
            Salir
          </Link>
        </div>
      </div>
    </header>
  );
}
