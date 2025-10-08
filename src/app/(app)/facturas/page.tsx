"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

type Cliente = { id: string; nombre: string };

type Item = {
  desc: string;
  qty: number;
  price: number;
};

export default function FacturasPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [items, setItems] = useState<Item[]>([{ desc: "", qty: 1, price: 0 }]);
  const [forma, setForma] = useState<"contado" | "cta_cte">("contado");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Traer clientes para el selector
  useEffect(() => {
    const q = query(collection(db, "clientes"), orderBy("nombre", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setClientes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  // Total calculado
  const total = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0), 0),
    [items]
  );

  function setItem(i: number, key: keyof Item, value: string) {
    const clone = [...items];
    if (key === "qty" || key === "price") {
      (clone[i] as any)[key] = Number(value);
    } else {
      (clone[i] as any)[key] = value;
    }
    setItems(clone);
  }

  function addLinea() {
    setItems([...items, { desc: "", qty: 1, price: 0 }]);
  }
  function delLinea(i: number) {
    const clone = [...items];
    clone.splice(i, 1);
    setItems(clone.length ? clone : [{ desc: "", qty: 1, price: 0 }]);
  }

  async function guardarFactura(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId) {
      setMsg("❌ Elegí un cliente");
      return;
    }
    if (total <= 0) {
      setMsg("❌ El total debe ser mayor a 0");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const cliente = clientes.find((c) => c.id === clienteId);
      // 1) Guardamos la factura
      const facturaRef = await addDoc(collection(db, "facturas"), {
        tipo: "FI", // Factura Interna (no fiscal)
        fecha: serverTimestamp(),
        clienteId,
        clienteNombre: cliente?.nombre ?? "",
        items,
        total,
        formaPago: forma,
        estado: "cerrada",
      });

      // 2) Impacto en Tesorería (Caja) si es contado
      if (forma === "contado") {
        await addDoc(collection(db, "caja"), {
          fecha: serverTimestamp(),
          tipo: "ingreso",
          origen: "factura",
          facturaId: facturaRef.id,
          descripcion: `Cobro FI ${facturaRef.id} - ${cliente?.nombre ?? ""}`,
          monto: total,
          medio: "efectivo",
        });
      }

      // 3) Impacto en Cuenta Corriente si es a crédito
      if (forma === "cta_cte") {
        await addDoc(collection(db, "ctacte"), {
          fecha: serverTimestamp(),
          clienteId,
          clienteNombre: cliente?.nombre ?? "",
          facturaId: facturaRef.id,
          movimiento: "debe",
          monto: total,
          saldo: total, // saldo pendiente
          descripcion: `FI a crédito ${facturaRef.id}`,
        });
      }

      setMsg("✅ Factura guardada correctamente");
      // reset
      setItems([{ desc: "", qty: 1, price: 0 }]);
      setForma("contado");
    } catch (err: any) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Facturación</h1>

        <form onSubmit={guardarFactura} className="bg-white p-4 rounded-xl shadow space-y-4">
          {/* Cliente + forma de pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              className="border rounded-lg p-3"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
            >
              <option value="">— Seleccionar cliente —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            <select
              className="border rounded-lg p-3"
              value={forma}
              onChange={(e) => setForma(e.target.value as any)}
            >
              <option value="contado">Contado (impacta en Caja)</option>
              <option value="cta_cte">Cuenta corriente</option>
            </select>
          </div>

          {/* Detalle de ítems */}
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Descripción</th>
                  <th className="text-right p-2 w-24">Cant.</th>
                  <th className="text-right p-2 w-32">Precio</th>
                  <th className="text-right p-2 w-32">Importe</th>
                  <th className="p-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">
                      <input
                        className="w-full border rounded-lg p-2"
                        placeholder="Servicio o producto"
                        value={it.desc}
                        onChange={(e) => setItem(i, "desc", e.target.value)}
                        required
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        min={0}
                        className="w-full border rounded-lg p-2 text-right"
                        value={it.qty}
                        onChange={(e) => setItem(i, "qty", e.target.value)}
                        required
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        className="w-full border rounded-lg p-2 text-right"
                        value={it.price}
                        onChange={(e) => setItem(i, "price", e.target.value)}
                        required
                      />
                    </td>
                    <td className="p-2 text-right">
                      {(Number(it.qty) * Number(it.price)).toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button type="button" className="text-red-600" onClick={() => delLinea(i)}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-2">
              <button type="button" className="rounded-lg border px-3 py-2" onClick={addLinea}>
                + Agregar línea
              </button>
            </div>
          </div>

          {/* Total + Guardar */}
          <div className="flex items-center justify-between">
            <div className="text-lg">
              <b>Total:</b> ${total.toFixed(2)}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black text-white py-2 px-4 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar factura"}
            </button>
          </div>

          {msg && <p className="text-sm text-gray-700">{msg}</p>}
        </form>

        {/* Últimas facturas (opcional rápido para demo) */}
        <UltimasFacturas />
      </div>
    </main>
  );
}

function UltimasFacturas() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, "facturas"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-medium mb-2">Últimas facturas</h2>
      <ul className="divide-y">
        {rows.slice(0, 5).map((f) => (
          <li key={f.id} className="py-2 text-sm flex justify-between">
            <span>{f.clienteNombre} — {f.formaPago === "contado" ? "Contado" : "Cta Cte"}</span>
            <b>${Number(f.total).toFixed(2)}</b>
          </li>
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-500">Sin facturas todavía.</p>}
      </ul>
    </div>
  );
}
