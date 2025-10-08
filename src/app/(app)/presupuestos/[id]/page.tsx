"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Presupuesto = {
  clienteNombre: string;
  items: { desc: string; qty: number; price: number }[];
  total: number;
  estado: string;
  fecha?: any;
};

export default function PresupuestoPrint() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [p, setP] = useState<Presupuesto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!id) return;
        const snap = await getDoc(doc(db, "presupuestos", id));
        if (snap.exists()) setP(snap.data() as Presupuesto);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function goBack() {
    // Si se abrió en nueva pestaña y hay opener → cerramos
    // Si hay historial → back
    // Si no, navegamos a /presupuestos
    if (typeof window !== "undefined") {
      if (window.opener) {
        window.close();
        return;
      }
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      window.location.href = "/presupuestos";
    }
  }

  if (loading) return <main className="p-6">Cargando…</main>;
  if (!p) return <main className="p-6">No encontrado.</main>;

  return (
    <main className="min-h-screen p-6 bg-white">
      {/* Acciones (ocultas al imprimir) */}
      <div className="print:hidden mb-4 flex gap-2">
        <button onClick={goBack} className="rounded-lg border px-3 py-1">← Volver</button>
        <button onClick={() => window.print()} className="rounded-lg border px-3 py-1">Imprimir</button>
      </div>

      {/* Encabezado */}
      <section className="flex items-start justify-between gap-6 border-b pb-4">
        <div className="flex items-center gap-4">
          <img src="/logo-helpers.png" alt="Helpers" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-xl font-semibold">Helpers</h1>
            <p className="text-sm text-gray-700">
              Argentina · Tel: +54 341 5062114 · www.helpers.com.ar · pr.higieneyseguridad@gmail.com
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm">Documento: <b>Presupuesto</b></p>
          <p className="text-sm">Estado: <b>{p.estado}</b></p>
        </div>
      </section>

      {/* Datos del cliente */}
      <section className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="border rounded-lg p-3">
          <p className="text-sm text-gray-500">Cliente</p>
          <p className="font-medium">{p.clienteNombre}</p>
        </div>
        <div className="border rounded-lg p-3">
          <p className="text-sm text-gray-500">Condiciones</p>
          <p className="font-medium">—</p>
        </div>
      </section>

      {/* Detalle */}
      <section className="mt-6">
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Descripción</th>
              <th className="text-right p-2 w-24">Cant.</th>
              <th className="text-right p-2 w-32">Precio</th>
              <th className="text-right p-2 w-32">Importe</th>
            </tr>
          </thead>
          <tbody>
            {p.items?.map((it, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{it.desc}</td>
                <td className="p-2 text-right">{Number(it.qty).toFixed(2)}</td>
                <td className="p-2 text-right">${Number(it.price).toFixed(2)}</td>
                <td className="p-2 text-right">
                  ${(Number(it.qty) * Number(it.price)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td className="p-2" colSpan={3} />
              <td className="p-2 text-right font-semibold">Total ${Number(p.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-6">
        <p className="text-xs text-gray-600">
          * Documento interno (no fiscal). La factura se emite al confirmar el trabajo.
        </p>
      </section>
    </main>
  );
}
