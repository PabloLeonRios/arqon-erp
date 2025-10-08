"use client";

import { useEffect, useMemo, useState } from "react";

type Mov = {
  id: string;
  fecha?: { seconds: number };
  tipo: "ingreso" | "egreso";
  monto: number;
  medio: string;
  descripcion: string;
};

export default function TesoreriaPage() {
  const [rows, setRows] = useState<Mov[]>([]);
  const [tot, setTot] = useState<{ ingresos: number; egresos: number; saldo: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // alta rápida
  const [tipo, setTipo] = useState<"ingreso" | "egreso">("ingreso");
  const [monto, setMonto] = useState<number>(0);
  const [medio, setMedio] = useState("efectivo");
  const [desc, setDesc] = useState("");

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/caja?limit=50`, { cache: "no-store" });
      const j = await res.json();
      if (j.ok) {
        setRows(j.data || []);
        setTot(j.tot || null);
      } else {
        setMsg(j.error || "Error al consultar");
      }
    } catch (e: any) {
      setMsg(e.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function crearMovimiento(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!desc || !monto) {
      setMsg("Completá descripción y monto.");
      return;
    }
    const body = { tipo, monto, medio, descripcion: desc };
    try {
      const res = await fetch("/api/caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (j.ok) {
        setDesc("");
        setMonto(0);
        await fetchData();
        setMsg("✅ Movimiento registrado");
      } else setMsg(j.error || "No se pudo guardar");
    } catch (e: any) {
      setMsg(e.message || "Error de red");
    }
  }

  const saldoText = useMemo(() => {
    if (!tot) return "";
    return `Ingresos $${tot.ingresos.toFixed(2)} · Egresos $${tot.egresos.toFixed(2)} · Saldo $${tot.saldo.toFixed(2)}`;
  }, [tot]);

  return (
    <main className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tesorería</h1>
          <p className="text-neutral-400 text-sm">{saldoText}</p>
        </div>
      </div>

      {/* Alta rápida */}
      <form onSubmit={crearMovimiento} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 grid sm:grid-cols-5 gap-3">
        <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800">
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
        <input value={monto || ""} onChange={(e) => setMonto(Number(e.target.value))} type="number" step="0.01" placeholder="Monto" className="rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800" />
        <input value={medio} onChange={(e) => setMedio(e.target.value)} placeholder="Medio (efectivo, transferencia...)" className="rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción" className="rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800 sm:col-span-2" />
        <button className="rounded-md bg-emerald-600 px-4 py-2 font-medium">Guardar</button>
      </form>

      {msg && <p className="text-sm text-neutral-300">{msg}</p>}

      {/* Listado */}
      <div className="rounded-lg border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900/60">
            <tr>
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-right p-2">Monto</th>
              <th className="text-left p-2">Medio</th>
              <th className="text-left p-2">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-800">
                <td className="p-2">{r.fecha?.seconds ? new Date(r.fecha.seconds * 1000).toLocaleString() : "-"}</td>
                <td className="p-2">{r.tipo}</td>
                <td className="p-2 text-right">${Number(r.monto || 0).toFixed(2)}</td>
                <td className="p-2">{r.medio}</td>
                <td className="p-2">{r.descripcion}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-3 text-neutral-500" colSpan={5}>Sin movimientos aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
