"use client";

import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";

export default function Panel() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel</h1>
        <p className="text-neutral-400 mt-1">
          Usuario: <b className="text-neutral-200">{user?.email}</b>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link href="/clientes" className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700">
          Clientes
        </Link>
        <Link href="/productos" className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700">
          Productos
        </Link>
        <Link href="/facturas" className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700">
          Facturas
        </Link>
        <Link href="/tesoreria" className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700">
          Tesorería
        </Link>
        <Link href="/presupuestos" className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700">
          Presupuestos
        </Link>
        <Link href="/ctacte" className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700">
          Cuenta Corriente
        </Link>
      </div>
    </div>
  );
}
