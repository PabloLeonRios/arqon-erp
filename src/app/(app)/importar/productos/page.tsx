"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import PageHeader from "@/components/PageHeader";

type Prod = {
  id: string;
  descripcion: string;
  codigo?: string;
  categoria?: string;
  precio?: number;          // final (redondeado)
  precio_base?: number;     // fuente (costo o venta)
  costo_neto?: number|null; // costo tras bonif
  markup?: number;
  bonifs?: number[];
  roundMode?: "none"|"nearest10"|"ceil10"|"floor10";
  listaNombre?: string;
};

function fmt(n?: number|null){
  if (n === null || n === undefined || !isFinite(Number(n))) return "—";
  return `$${Number(n).toFixed(2)}`;
}

export default function ProductosPage(){
  const [qtext, setQtext] = useState("");
  const [rows, setRows] = useState<Prod[]>([]);

  useEffect(() => {
    const qy = query(collection(db, "productos"), orderBy("updatedAt","desc"), limit(300));
    const unsub = onSnapshot(qy, (snap)=>{
      setRows(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(()=>{
    const t = qtext.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(r =>
      (r.descripcion || "").toLowerCase().includes(t) ||
      (r.codigo || "").toLowerCase().includes(t) ||
      (r.categoria || "").toLowerCase().includes(t)
    );
  }, [rows, qtext]);

  return (
    <main>
      <PageHeader
        title="Productos"
        subtitle="Precio fuente → bonif → costo neto → markup → redondeo"
        actions={<a href="/importar/precios" className="btn-outline">+ Importar precios</a>}
      />

      <div className="container mt-6">
        <div className="card p-4 mb-4">
          <input
            className="border rounded-lg p-2 w-full"
            placeholder="Buscar por descripción, código o categoría…"
            value={qtext}
            onChange={(e)=>setQtext(e.target.value)}
          />
        </div>

        <div className="card p-4 overflow-x-auto">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Código</th>
                <th>Categoría</th>
                <th className="text-right">Precio fuente</th>
                <th className="text-right">Bonif</th>
                <th className="text-right">Costo neto</th>
                <th className="text-right">Markup</th>
                <th className="text-right">Precio final</th>
                <th>Redondeo</th>
                <th>Lista</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id}>
                  <td>{p.descripcion}</td>
                  <td>{p.codigo || "—"}</td>
                  <td>{p.categoria || "—"}</td>
                  <td className="text-right">{fmt(p.precio_base)}</td>
                  <td className="text-right">{(p.bonifs && p.bonifs.length) ? p.bonifs.join("+")+"%" : "—"}</td>
                  <td className="text-right">{fmt(p.costo_neto)}</td>
                  <td className="text-right">{typeof p.markup === "number" ? `${p.markup.toFixed(2)}%` : "—"}</td>
                  <td className="text-right">{fmt(p.precio)}</td>
                  <td>{p.roundMode || "—"}</td>
                  <td>{p.listaNombre || "—"}</td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr>
                  <td colSpan={10}>
                    <div className="empty">
                      <h3>Sin productos</h3>
                      <p>Importá una lista para ver resultados.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
