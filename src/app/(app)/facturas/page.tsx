'use client';

import { useMemo, useState } from 'react';

type Linea = { id: string; desc: string; cant: number; precio: number };
type Factura = {
  id: string;
  cliente?: string;
  condicion: 'Contado (impacta en Caja)' | 'Cta Cte (no impacta en Caja)';
  lineas: Linea[];
  total: number;
};

export default function FacturasPage() {
  const [cliente, setCliente] = useState('');
  const [condicion, setCondicion] = useState<Factura['condicion']>('Contado (impacta en Caja)');
  const [lineas, setLineas] = useState<Linea[]>([{ id: crypto.randomUUID(), desc: '', cant: 1, precio: 0 }]);
  const [facturas, setFacturas] = useState<Factura[]>([]);

  const total = useMemo(() => lineas.reduce((s, l) => s + (l.cant || 0) * (l.precio || 0), 0), [lineas]);

  function setLinea(id: string, patch: Partial<Linea>) {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addLinea() {
    setLineas((prev) => [...prev, { id: crypto.randomUUID(), desc: '', cant: 1, precio: 0 }]);
  }
  function removeLinea(id: string) {
    setLineas((prev) => prev.filter((l) => l.id !== id));
  }

  function guardar() {
    const f: Factura = {
      id: crypto.randomUUID(),
      cliente: cliente.trim() || undefined,
      condicion,
      lineas: lineas.filter((l) => l.desc.trim()),
      total,
    };
    setFacturas((prev) => [f, ...prev]);
    // reset
    setCliente(''); setCondicion('Contado (impacta en Caja)');
    setLineas([{ id: crypto.randomUUID(), desc: '', cant: 1, precio: 0 }]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1>Facturas</h1>
          <p className="text-[rgb(var(--muted))] mt-1">Emití y consultá</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Facturación</div>

        <div className="grid md:grid-cols-2 gap-4">
          <input className="input" placeholder="Cliente (texto libre o selector)" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          <select className="input" value={condicion} onChange={(e) => setCondicion(e.target.value as any)}>
            <option>Contado (impacta en Caja)</option>
            <option>Cta Cte (no impacta en Caja)</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Descripción</th><th style={{width:100}}>Cant</th><th style={{width:160}}>Precio</th><th style={{width:60}}></th></tr>
            </thead>
            <tbody>
              {lineas.map((l) => (
                <tr key={l.id}>
                  <td>
                    <input className="input" placeholder="Servicio o producto" value={l.desc} onChange={(e) => setLinea(l.id, { desc: e.target.value })} />
                  </td>
                  <td>
                    <input className="input" value={l.cant} onChange={(e) => setLinea(l.id, { cant: parseFloat(e.target.value) || 0 })} />
                  </td>
                  <td>
                    <input className="input" value={l.precio} onChange={(e) => setLinea(l.id, { precio: parseFloat(e.target.value) || 0 })} />
                  </td>
                  <td className="text-right">
                    <button className="btn btn-danger" onClick={() => removeLinea(l.id)}>×</button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4}>
                  <button className="btn btn-ghost" onClick={addLinea}>+ Agregar línea</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-3">
          <div className="text-[rgb(var(--muted))]">Total:</div>
          <div className="text-2xl font-semibold">${total.toFixed(2)}</div>
        </div>

        <div className="flex justify-end pt-3">
          <button className="btn btn-primary" onClick={guardar}>Guardar factura</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Últimas facturas</div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Condición</th><th>Total</th></tr></thead>
            <tbody>
              {facturas.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-[rgb(var(--muted))]">Sin facturas todavía.</td></tr>
              ) : facturas.map(f => (
                <tr key={f.id}>
                  <td>{new Date().toLocaleString()}</td>
                  <td>{f.cliente || '-'}</td>
                  <td>{f.condicion}</td>
                  <td>${f.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
