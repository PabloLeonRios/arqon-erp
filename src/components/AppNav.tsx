"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/panel", label: "Panel" },
  { href: "/presupuestos", label: "Presupuestos" },
  { href: "/facturas", label: "FacturaciÃ³n" },
  { href: "/tesoreria", label: "TesorerÃ­a" },
  { href: "/ctacte", label: "Cta. Corriente" },
  { href: "/clientes", label: "Clientes" },
  { href: "/productos", label: "Productos" },
  { href: "/listas", label: "Listas de Precios" },
  { href: "/precios", label: "Precios" },
  { href: "/crm", label: "CRM" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="container-max flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold">
            H
          </div>
          <span className="font-semibold">Helpers ERP</span>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          {items.map((it) => {
            const active =
              pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {/* franja de marca */}
      <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />
    </header>
  );
}
