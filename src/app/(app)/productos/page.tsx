'use client';

import { FormEvent, useMemo, useState } from 'react';

type Producto = {
  id: string;
  sku?: string;
  descripcion: string;
  tipo: 'Producto' | 'Servicio';
  categoria?: string;
  costo: number; // base
  bonificacion?: string; // "20+10" o "%"
  markup?: number; // %
  redondeo?: 'nearest' | 'ceil' | 'floor' | undefined;
  precioFinal: number;
  notas?: string;
};

const tipos = ['Producto', 'Servicio'] as const;

function calcularPrecio(costo: number, bonif?: string, markup = 0, redondeo?: 'nearest'|'ceil'|'floor') {
  let base = costo || 0;

  // Bonificaciones en cadena: "20+10"
  if (bonif?.includes('+')) {
    for (const b of bonif.split('+')) {
      const v = parseFloat(b) || 0;
      base = base * (1 - v / 100);
    }
  } else if (bonif) {
    const v = parseFloat(bonif) || 0;
    base = base * (1 - v / 100);
  }

  let precio = base * (1 + (markup || 0) / 100);

  // Redondeo a múltiplos de 10
  if (redondeo) {
    const m = 10;
    const f = precio / m;
    if (redondeo === 'nearest') precio = Math.round(f) * m;
    if (redondeo === 'ceil') precio = Math.ceil(f) * m;
    if (redondeo === 'floor') precio = Math.floor(f) * m;
  }

  return Math.max(0, Math.round((precio + Number.EPSILON) * 100) / 100);
}

export default function ProductosPage() {
  const [items, setItems] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');

  const [sku, setSku] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<typeof tipos[number]>('Producto');
  const [categoria, setCategoria] = useState('');
  const [costo, setCosto] = useState<string>('0');
  const [bonif, setBonif] = useState('');
  const [markup, setMarkup] = useState<string>('0');
  const [redondeo, setRedondeo] = useState<'nearest'|'ceil'|'floor'|''>('');
  const [notas, setNotas] = useState('');

  function reset() {
    setSku(''); setDescripcion(''); setTipo('Producto'); setCategoria('');
    setCosto('0'); setBonif(''); setMarkup('0'); setRedondeo(''); setNotas('');
  }

  function handleCrear(e: FormEvent) {
    e.preventDefault();
    if (!descripcion.trim()) return;

    const costoNum = parseFloat(costo) || 0;
    const markupNum = parseFloat(markup) || 0;
    const precioFinal = calcularPrecio(costoNum, bonif.trim() || undefined, markupNum, redondeo || undefined);

    const nuevo: Producto = {
      id: crypto.randomUUID(),
      sku: sku.trim() || undefined,
      descripcion: descripcion.trim(),
      tipo,
      categoria: categoria.trim() || undefined,
      costo: costoNum,
      bonificacion: bonif.trim() || undefined,
      markup: markupNum || undefined,
      redondeo: redondeo || undefined,
      precioFinal,
      notas: notas.trim() || undefined,
    };

    setItems((prev) => [nuevo, ...prev]);
    reset();
  }

  function eliminar(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      [p.sku, p.descripcion, p.categoria, p.tipo].filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  }, [items, busqueda]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1>Productos / Servicios</h1>
          <p className="text-[rgb(var(--muted))] mt-1">Catálogo y listas de precios</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost">Importar</button>
          <button type="button" className="btn btn-ghost">Exportar</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Crear / actualizar</div>
        <form onSubmit={handleCrear} className="grid md:grid-cols-2 gap-4">
          <input className="input" placeholder="Código (SKU)" value={sku} onChange={(e) => setSku(e.target.value)} />
          <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
            {tipos.map(t => <option key={t}>{t}</option>)}
          </select>

          <input className="input md:col-span-2" placeholder="Descripción *" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />

          <input className="input" placeholder="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          <select className="input" value={redondeo} onChange={(e) => setRedondeo(e.target.value as any)}>
            <option value="">Sin redondeo</option>
            <option value="nearest">Al múltiplo de 10 más cercano</option>
            <option value="ceil">A múltiplo de 10 hacia arriba</option>
            <option value="floor">A múltiplo de 10 hacia abajo</option>
          </select>

          <input className="input" placeholder="Costo base *" value={costo} onChange={(e) => setCosto(e.target.value)} />
          <input className="input" placeholder="Bonificación (cadena o % único)" value={bonif} onChange={(e) => setBonif(e.target.value)} />

          <input className="input" placeholder="Markup global (%)" value={markup} onChange={(e) => setMarkup(e.target.value)} />
          <textarea className="input md:col-span-2" placeholder="Notas" value={notas} onChange={(e) => setNotas(e.target.value)} />

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={reset}>Limpiar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="card-title m-0">Listado</div>
          <input className="input w-full md:w-80" placeholder="Buscar por código, descripción, categoría…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th><th>Descripción</th><th>Tipo</th><th>Costo</th>
                <th>Bonif.</th><th>Markup</th><th>Precio final</th>
                <th className="text-right" style={{width:120}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-[rgb(var(--muted))]">Sin productos aún.</td></tr>
              ) : filtrados.map(p => (
                <tr key={p.id}>
                  <td>{p.sku || '-'}</td>
                  <td>{p.descripcion}</td>
                  <td>{p.tipo}</td>
                  <td>${p.costo.toFixed(2)}</td>
                  <td>{p.bonificacion || '-'}</td>
                  <td>{p.markup ?? 0}%</td>
                  <td><strong>${p.precioFinal.toFixed(2)}</strong></td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-ghost">Editar</button>
                      <button className="btn btn-danger" onClick={() => eliminar(p.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
