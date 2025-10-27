'use client';

import Link from 'next/link';

export default function PanelPage() {
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-end justify-between">
        <div>
          <h1>Panel</h1>
          <p className="text-[rgb(var(--muted))] mt-1">Arquitectura de tus operaciones</p>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Link href="/clientes" className="card hover:opacity-90 transition">
          <div className="card-title">Clientes</div>
          <p className="text-[rgb(var(--muted))]">Altas, edición y búsqueda</p>
        </Link>

        <Link href="/productos" className="card hover:opacity-90 transition">
          <div className="card-title">Productos / Servicios</div>
          <p className="text-[rgb(var(--muted))]">Catálogo y listas de precios</p>
        </Link>

        <Link href="/facturas" className="card hover:opacity-90 transition">
          <div className="card-title">Facturas</div>
          <p className="text-[rgb(var(--muted))]">Emití y consultá</p>
        </Link>

        <Link href="/tesoreria" className="card hover:opacity-90 transition">
          <div className="card-title">Tesorería</div>
          <p className="text-[rgb(var(--muted))]">Ingresos/Egresos de caja</p>
        </Link>

        <Link href="/presupuestos" className="card hover:opacity-90 transition">
          <div className="card-title">Presupuestos</div>
          <p className="text-[rgb(var(--muted))]">Generá y convertí a factura</p>
        </Link>

        <Link href="/ctacte" className="card hover:opacity-90 transition">
          <div className="card-title">Cuenta Corriente</div>
          <p className="text-[rgb(var(--muted))]">Movimientos y saldos</p>
        </Link>
      </div>
    </div>
  );
}
