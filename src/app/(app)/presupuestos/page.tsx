"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, updateDoc, doc,
} from "firebase/firestore";
import PageHeader from "@/components/PageHeader";
import { Printer } from "lucide-react";

type Cliente = { id: string; nombre: string };
type Item = { desc: string; qty: number; price: number };

export default function PresupuestosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [items, setItems] = useState<Item[]>([{ desc: "", qty: 1, price: 0 }]);
  const [estado, setEstado] = useState<"borrador" | "enviado">("borrador");
  const [msg, setMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const qc = query(collection(db, "clientes"), orderBy("nombre", "asc"));
    const unsubC = onSnapshot(qc, (snap) => setClientes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))));
    const qp = query(collection(db, "presupuestos"), orderBy("fecha", "desc"));
    const unsubP = onSnapshot(qp, (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))));
    return () => { unsubC(); unsubP(); };
  }, []);

  const total = useMemo(
    () => items.reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.price) || 0), 0),
    [items]
  );

  function setItem(i: number, key: keyof Item, value: string) {
    const clone = [...items];
    if (key === "qty" || key === "price") (clone[i] as any)[key] = Number(value);
    else (clone[i] as any)[key] = value;
    setItems(clone);
  }
  function addLinea(){ setItems([...items, { desc: "", qty: 1, price: 0 }]); }
  function delLinea(i:number){
    const clone = [...items]; clone.splice(i,1);
    setItems(clone.length ? clone : [{ desc: "", qty: 1, price: 0 }]);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (!clienteId) return setMsg("❌ Elegí un cliente");
    if (total <= 0) return setMsg("❌ El total debe ser mayor a 0");
    const cliente = clientes.find((c) => c.id === clienteId);
    try {
      await addDoc(collection(db, "presupuestos"), {
        fecha: serverTimestamp(),
        clienteId, clienteNombre: cliente?.nombre ?? "",
        items, total, estado,
      });
      setItems([{ desc: "", qty: 1, price: 0 }]); setEstado("borrador");
      setMsg("✅ Presupuesto guardado");
    } catch (err: any) { setMsg(`❌ ${err.message}`); }
  }

  async function convertirAFactura(p:any, forma:"contado"|"cta_cte"){
    setMsg(null);
    try {
      const facturaRef = await addDoc(collection(db, "facturas"), {
        tipo:"FI", fecha: serverTimestamp(),
        clienteId: p.clienteId, clienteNombre: p.clienteNombre,
        items: p.items, total: p.total, formaPago: forma, estado:"cerrada",
        desdePresupuesto: p.id,
      });
      if (forma==="contado"){
        await addDoc(collection(db,"caja"), {
          fecha: serverTimestamp(), tipo:"ingreso", origen:"factura",
          facturaId: facturaRef.id, descripcion:`Cobro FI ${facturaRef.id} - ${p.clienteNombre}`,
          monto:p.total, medio:"efectivo"
        });
      } else {
        await addDoc(collection(db,"ctacte"), {
          fecha: serverTimestamp(), clienteId:p.clienteId, clienteNombre:p.clienteNombre,
          facturaId: facturaRef.id, movimiento:"debe", monto:p.total, saldo:p.total,
          descripcion:`FI a crédito ${facturaRef.id}`,
        });
      }
      await updateDoc(doc(db,"presupuestos", p.id), { estado:"aprobado", facturaId: facturaRef.id });
      setMsg("✅ Convertido a factura correctamente");
    } catch (err:any){ setMsg(`❌ ${err.message}`); }
  }

  return (
    <main className="min-h-screen">
      <PageHeader
        title="Presupuestos"
        subtitle="Creá, lista y convertí a factura"
        actions={<a className="btn-outline" href="/panel">← Volver</a>}
      />

      {/* Alta */}
      <form onSubmit={guardar} className="card p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select className="border rounded-lg p-3" value={clienteId} onChange={(e)=>setClienteId(e.target.value)} required>
            <option value="">— Seleccionar cliente —</option>
            {clientes.map((c)=> <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>

          <select className="border rounded-lg p-3" value={estado} onChange={(e)=>setEstado(e.target.value as any)}>
            <option value="borrador">Borrador</option>
            <option value="enviado">Enviado</option>
          </select>

          <div className="flex items-center justify-end">
            <div className="text-lg"><b>Total:</b> ${total.toFixed(2)}</div>
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Descripción</th>
                <th className="text-right w-24">Cant.</th>
                <th className="text-right w-32">Precio</th>
                <th className="text-right w-32">Importe</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i)=>(
                <tr key={i}>
                  <td>
                    <input className="w-full border rounded-lg p-2"
                      placeholder="Servicio o producto"
                      value={it.desc} onChange={(e)=>setItem(i,"desc", e.target.value)} required />
                  </td>
                  <td className="text-right">
                    <input type="number" min={0} className="w-full border rounded-lg p-2 text-right"
                      value={it.qty} onChange={(e)=>setItem(i,"qty", e.target.value)} required />
                  </td>
                    <td className="text-right">
                      <input type="number" step="0.01" min={0} className="w-full border rounded-lg p-2 text-right"
                        value={it.price} onChange={(e)=>setItem(i,"price", e.target.value)} required />
                    </td>
                    <td className="text-right">{(Number(it.qty)*Number(it.price)).toFixed(2)}</td>
                    <td className="text-center">
                      <button type="button" className="btn-danger" onClick={()=>delLinea(i)}>✕</button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2">
            <button type="button" className="btn-outline" onClick={addLinea}>+ Agregar línea</button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button type="submit" className="btn-primary">Guardar presupuesto</button>
        </div>

        {msg && <p className="text-sm text-muted">{msg}</p>}
      </form>

      {/* Listado */}
      <div className="card p-4">
        <h2 className="text-lg font-medium mb-3">Últimos presupuestos</h2>
        <ul className="divide-y">
          {rows.map((p)=>(
            <li key={p.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{p.clienteNombre}</p>
                <p className="text-sm text-muted">
                  Estado:{" "}
                  <span className={
                    p.estado==="aprobado" ? "badge-success" :
                    p.estado==="enviado"  ? "badge-info"    :
                    "badge-muted"
                  }>{p.estado}</span>
                  {" · "}Total ${Number(p.total).toFixed(2)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <a className="btn-outline" href={`/presupuestos/${p.id}`} target="_blank">
                  <Printer size={16}/> Imprimir
                </a>
                <button className="btn-outline" onClick={()=>convertirAFactura(p,"contado")}>Facturar contado</button>
                <button className="btn-outline" onClick={()=>convertirAFactura(p,"cta_cte")}>Facturar cta cte</button>
              </div>
            </li>
          ))}
          {rows.length===0 && (
            <div className="empty">
              <h3>Sin presupuestos aún</h3>
              <p>Creá el primero arriba y empezá a vender ✨</p>
            </div>
          )}
        </ul>
      </div>
    </main>
  );
}
