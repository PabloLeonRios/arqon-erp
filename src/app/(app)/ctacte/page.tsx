"use client";

import { useEffect, useMemo, useState } from "react";

type Mov = {
  id: string;
  fecha?: { seconds: number };
  movimiento: "debe" | "haber";
  monto: number;
  descripcion?: string;
  facturaId?: string | null;
  reciboId?: string | null;
  clienteId: string;
  clienteNombre: string;
};

export default function CtactePage() {
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [rows, setRows] = useState<Mov[]>([]);
  const [saldo, setSaldo] = useState<number>(0);
  const [msg, setMsg] = useState<string | null>(null);

  // pago
  const [pagoMonto, setPagoMonto] = useState<number>(0);
  const [pagoMedio, setPagoMedio] = useState("efectivo");
  const [pagoDesc, setPagoDesc] = useState("");
  const [pagoFacturaId, setPagoFacturaId] = useState("");

  async function buscar() {
    setMsg(null);
    if (!clienteId) {
      setMsg("Ingresá un Cliente ID (por ahora simple)");
      return;
    }
    try {
      const res = await fetch(`/api/ctacte?clienteId=${encodeURIComponent(clienteId)}&limit=200`, { cache: "no-store" });
      const j = await res.json();
      if (j.ok) {
        setRows(j.data || []);
        setSaldo(j.saldo || 0);
        if (!clienteNombre) {
          // si no viene nombre, tratamos de deducirlo del primer movimiento
          const nm = (j.data?.[0]?.clienteNombre as string) || "";
          setClienteNombre(nm);
        }
      } else setMsg(j.error || "Error consultando cta cte");
    } catch (e: any) {
      setMsg(e.message || "Error de red");
    }
  }

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!clienteId || !clienteNombre || !pagoMonto) {
      setMsg("Completá cliente, nombre y monto");
      return;
    }
    const body = {
      clienteId,
      clienteNombre,
      monto: pagoMonto,
      medio: pagoMedio,
      descripcion: pagoDesc || "Pago en cuenta corriente",
      facturaId: pagoFacturaId || undefined,
    };
    try {
      const res = await fetch("/api/ctacte/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (j.ok) {
        setPagoMonto(0);
        setPagoDesc("");
        setPagoFacturaId("");
        await buscar();
        setMsg(`✅ Pago registrado (Recibo ${j.reciboId})`);
      } else setMsg(j.error || "No se pudo registrar el pago");
    } catch (e: any) {
      setMsg(e.message || "Error de red");
    }
  }

  const saldoText = useMemo(() => `Saldo actual: $${saldo.toFixed(2)}`, [saldo]);

  return (
    <main className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cuenta Corriente</h1>
          <p className="text-neutral-400 text-sm">{saldoText}</p>
        </div>
      </div>

      {/* Filtros simples */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 grid sm:grid-cols-3 gap-3">
        <input value={clienteId} onChange={(e) => setClienteId(e.target.value)} placeholder="Cliente ID (ej: CLI002)" className="rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800" />
        <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Cliente Nombre (solo visual)" className="rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800" />
        <button onClick={buscar} className="rounded-md bg-emerald-600 px-4 py-2 font-medium">Buscar</button>
      </div>

      {/* Pago */}
      <form onSubmit={pagar} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 grid sm:grid-cols-5 gap-3">
        <input value={pagoMonto || ""} onChange={(e) => setPagoMonto(Number(e.target.value))} type="number" step="0.01" placeholder="Monto" className="rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800" />
        <input value={pagoMedio} onChange={(e) => setPagoMedio(e.target.value)} placeholder="Medio" className="rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800" />
        <input value={pagoDesc} onChange={(e) => setPagoDesc(e.target.value)} placeholder="Descripción (opcional)" className="rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800" />
        <input value={pagoFacturaId} onChange={(e) => setPagoFacturaId(e.target.value)} placeholder="Factura ID (opcional)" className="rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800" />
        <button className="rounded-md bg-emerald-600 px-4 py-2 font-medium">Registrar pago</button>
      </form>

      {msg && <p className="text-sm text-neutral-300">{msg}</p>}

      {/* Listado */}
      <div className="rounded-lg border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900/60">
            <tr>
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Mov.</th>
              <th className="text-right p-2">Monto</th>
              <th className="text-left p-2">Factura</th>
              <th className="text-left p-2">Recibo</th>
              <th className="text-left p-2">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-800">
                <td className="p-2">{r.fecha?.seconds ? new Date(r.fecha.seconds * 1000).toLocaleString() : "-"}</td>
                <td className="p-2">{r.movimiento}</td>
                <td className="p-2 text-right">${Number(r.monto || 0).toFixed(2)}</td>
                <td className="p-2">{r.facturaId || ""}</td>
                <td className="p-2">{r.reciboId || ""}</td>
                <td className="p-2">{r.descripcion || ""}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-3 text-neutral-500" colSpan={6}>Sin movimientos para este cliente.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
