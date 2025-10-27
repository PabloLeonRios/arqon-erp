'use client';

import { useMemo, useState } from 'react';

type Mov = { id: string; fecha: string; comp: string; debe: number; haber: number };

export default function CtaCtePage() {
  const [items, setItems] = useState<Mov[]>([]);
  const saldo = useMemo(() => items.reduce((s, m) => s + (m.haber - m.debe), 0), [items]);

  function simular() {
    const now = new Date().toISOString();
    setItems([
      { id: crypto.randomUUID(), fecha: now, comp: 'Factura A-0001-0000123', debe: 50000, haber: 0 },
      { id: crypto.randomUUID(), fecha: now, comp: 'Recibo R-0001-0000044', debe: 0, haber: 30000 },
      { id: crypto.randomUUID(), fecha: now, comp: 'Nota de crédito', debe: 0, haber: 5000 },
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1>Cuenta Corriente</h1>
          <p className="text-[rgb(var(--muted))] mt-1">Movimientos y saldos</p>
        </div>
        <button className="btn btn-ghost" onClick={simular}>Cargar ejemplo</button>
      </div>

      <div className="card">
        <div className="card-title">Movimientos</div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Comprobante</th><th>Debe</th><th>Haber</th><th>Saldo</th></tr></thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-[rgb(var(--muted))]">Sin movimientos aún.</td></tr>
              ) : (
                items.map((m, idx) => {
                  const saldoParcial = items.slice(0, idx + 1).reduce((s, x) => s + (x.haber - x.debe), 0);
                  return (
                    <tr key={m.id}>
                      <td>{new Date(m.fecha).toLocaleDateString()}</td>
                      <td>{m.comp}</td>
                      <td>{m.debe ? `$${m.debe.toFixed(2)}` : '-'}</td>
                      <td>{m.haber ? `$${m.haber.toFixed(2)}` : '-'}</td>
                      <td>{`$${saldoParcial.toFixed(2)}`}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end pt-3">
          <div className="text-sm text-[rgb(var(--muted))] mr-3">Saldo actual</div>
          <div className="text-xl font-semibold">{`$${saldo.toFixed(2)}`}</div>
        </div>
      </div>
    </div>
  );
}
