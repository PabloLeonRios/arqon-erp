'use client';

import { useState } from 'react';

type Mov = {
  id: string;
  tipo: 'Ingreso' | 'Egreso';
  medio: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro';
  monto: number;
  descripcion?: string;
  fecha: string;
};

export default function TesoreriaPage() {
  const [tipo, setTipo] = useState<Mov['tipo']>('Ingreso');
  const [medio, setMedio] = useState<Mov['medio']>('Efectivo');
  const [monto, setMonto] = useState<string>('');
  const [descripcion, setDescripcion] = useState('');
  const [items, setItems] = useState<Mov[]>([]);

  function guardar() {
    const mov: Mov = {
      id: crypto.randomUUID(),
      tipo,
      medio,
      monto: parseFloat(monto) || 0,
      descripcion: descripcion.trim() || undefined,
      fecha: new Date().toISOString(),
    };
    setItems((p) => [mov, ...p]);
    setMonto(''); setDescripcion('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1>Tesorería</h1>
          <p className="text-[rgb(var(--muted))] mt-1">Ingresos/Egresos de caja</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Movimiento</div>
        <div className="grid md:grid-cols-2 gap-4">
          <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
            <option>Ingreso</option><option>Egreso</option>
          </select>
          <input className="input" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} />
          <select className="input" value={medio} onChange={(e) => setMedio(e.target.value as any)}>
            <option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option>
          </select>
          <input className="input" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        <div className="flex justify-end pt-3">
          <button className="btn btn-primary" onClick={guardar}>Guardar</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Movimientos</div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Medio</th><th>Descripción</th></tr></thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-[rgb(var(--muted))]">Sin movimientos aún.</td></tr>
              ) : items.map(m => (
                <tr key={m.id}>
                  <td>{new Date(m.fecha).toLocaleString()}</td>
                  <td>{m.tipo}</td>
                  <td>{m.tipo === 'Ingreso' ? '+' : '-'}${m.monto.toFixed(2)}</td>
                  <td>{m.medio}</td>
                  <td>{m.descripcion || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
