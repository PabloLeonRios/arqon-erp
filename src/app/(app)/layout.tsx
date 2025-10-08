"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
      if (!u) {
        // Si no hay sesión, siempre volvemos al login
        if (pathname !== "/") router.replace("/");
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-950 text-neutral-200">
        <div className="animate-pulse">Cargando…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-800/60 backdrop-blur bg-neutral-950/70">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/panel" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Arqon ERP" width={120} height={32} priority />
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm text-neutral-300">
              <Link className="hover:text-white" href="/panel">Panel</Link>
              <Link className="hover:text-white" href="/clientes">Clientes</Link>
              <Link className="hover:text-white" href="/productos">Productos</Link>
              <Link className="hover:text-white" href="/facturas">Facturas</Link>
              <Link className="hover:text-white" href="/tesoreria">Tesorería</Link>
              <Link className="hover:text-white" href="/presupuestos">Presupuestos</Link>
              <Link className="hover:text-white" href="/ctacte">Cta. Cte.</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-neutral-400">
              {user.email}
            </span>
            <button
              className="rounded-md bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-sm"
              onClick={async () => {
                await signOut(auth);
                router.replace("/");
              }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* contenido */}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
