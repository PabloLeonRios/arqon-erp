"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export default function ImportHub(){
  return (
    <main className="min-h-screen">
      <PageHeader
        title="Importar datos"
        subtitle="Subí listas de precios y clientes desde Excel/CSV"
        actions={<a href="/panel" className="btn-outline">← Panel</a>}
      />

      <section className="container mt-6 grid md:grid-cols-2 gap-4">
        <Link href="/importar/precios" className="card card-hover p-6">
          <h3 className="font-semibold">Listas de precios</h3>
          <p className="text-sm text-muted mt-1">Excel/CSV → Productos + bonificación/markup/redondeo</p>
        </Link>
        <Link href="/importar/clientes" className="card card-hover p-6">
          <h3 className="font-semibold">Clientes</h3>
          <p className="text-sm text-muted mt-1">Excel/CSV → Alta masiva con mapeo de columnas</p>
        </Link>
      </section>
    </main>
  );
}
