'use client';

import { useMemo, useState } from 'react';

type Linea = { id: string; desc: string; cant: number; precio: number };
type Presupuesto = {
  id: string;
  cliente?: string;
  estado: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado';
  lineas: Linea[];
  total: number;
};

export default function PresupuestosPage() {
  const [cliente, setCliente] = useState('');
  const [estado, setEstado] = useState<Presupuesto['estado']>('Borrador');
  const [lineas, setLineas] = useState<Linea[]>([{ id: crypto.randomUUID(), desc: '', cant: 1, precio: 0 }]);
  const [presus, setPresus] = useState<Presupuesto[]>([]);

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
    const p: Presupuesto = {
      id: crypto.randomUUID(),
      cliente: cliente.trim() || undefined,
      estado,
      lineas: lineas.filter((l) => l.desc.trim()),
      total,
    };
    setPresus((prev) => [p, ...prev]);
    setCliente(''); setEstado('Borrador');
    setLineas([{ id: crypto.randomUUID(), desc: '', cant: 1, precio: 0 }]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1>Presupuestos</h1>
          <p className="text-[rgb(var(--muted))] mt-1">Creá, lista y convertí a factura</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Nuevo presupuesto</div>

        <div className="grid md:grid-cols-2 gap-4">
          <input className="input" placeholder="Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          <select className="input" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
            <option>Borrador</option><option>Enviado</option><option>Aprobado</option><option>Rechazado</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead><tr><th>Descripción</th><th style={{width:100}}>Cant.</th><th style={{width:160}}>Precio</th><th style={{width:60}}></th></tr></thead>
            <tbody>
              {lineas.map((l) => (
                <tr key={l.id}>
                  <td><input className="input" placeholder="Servicio o producto" value={l.desc} onChange={(e) => setLinea(l.id, { desc: e.target.value })} /></td>
                  <td><input className="input" value={l.cant} onChange={(e) => setLinea(l.id, { cant: parseFloat(e.target.value) || 0 })} /></td>
                  <td><input className="input" value={l.precio} onChange={(e) => setLinea(l.id, { precio: parseFloat(e.target.value) || 0 })} /></td>
                  <td className="text-right"><button className="btn btn-danger" onClick={() => removeLinea(l.id)}>×</button></td>
                </tr>
              ))}
              <tr>
                <td colSpan={4}><button className="btn btn-ghost" onClick={addLinea}>+ Agregar línea</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-3">
          <div className="text-[rgb(var(--muted))]">Total:</div>
          <div className="text-2xl font-semibold">${total.toFixed(2)}</div>
        </div>

        <div className="flex justify-end pt-3">
          <button className="btn btn-primary" onClick={guardar}>Guardar presupuesto</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Últimos presupuestos</div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Estado</th><th>Total</th></tr></thead>
            <tbody>
              {presus.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-[rgb(var(--muted))]">Sin presupuestos aún.</td></tr>
              ) : presus.map(p => (
                <tr key={p.id}>
                  <td>{new Date().toLocaleString()}</td>
                  <td>{p.cliente || '-'}</td>
                  <td>{p.estado}</td>
                  <td>${p.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
