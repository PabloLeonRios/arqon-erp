"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import PageHeader from "@/components/PageHeader";
import { Save } from "lucide-react";

type RoundMode = "none"|"nearest10"|"ceil10"|"floor10";
type RowP = {
  id: string;
  descripcion: string;
  codigo?: string|null;
  categoria?: string|null;
  precio_base?: number;
  bonifChain?: string;
  bonifs?: number[];
  costo_neto?: number|null;
  markup?: number;
  roundMode?: RoundMode;
  precio?: number;
};

function parseNumberLike(v: any){
  if (v === null || v === undefined) return NaN;
  let s = String(v).trim();
  if (!s) return NaN;
  s = s.replace(/\s+/g,"").replace(/[^\d.,-]/g,"");
  const hasDot = s.includes("."), hasComma = s.includes(",");
  if (hasDot && hasComma){
    const lastDot = s.lastIndexOf("."), lastComma = s.lastIndexOf(",");
    if (lastComma > lastDot){ s = s.replace(/\./g,"").replace(/,/g,"."); }
    else { s = s.replace(/,/g,""); const last = s.lastIndexOf("."); s = s.slice(0,last).replace(/\./g,"") + "." + s.slice(last+1); }
  } else if (hasComma){
    const parts = s.split(","); if (parts.length===2 && parts[1].length<=3){ s = parts[0].replace(/\./g,"")+"."+parts[1]; } else { s = s.replace(/,/g,""); }
  } else if (hasDot){
    const last = s.lastIndexOf("."); s = s.slice(0,last).replace(/\./g,"")+"."+s.slice(last+1);
  }
  s = s.replace(/[^0-9.-]/g,"");
  const n = Number(s); return isNaN(n) ? NaN : n;
}
function parseBonifChain(input: string): number[] { if (!input) return []; return input.split("+").map(x=>parseNumberLike(x)).filter(n=>isFinite(n)&&n>0); }
function applyBonifs(base: number, bonifs: number[]) { return bonifs.reduce((acc,b)=>acc*(1-b/100), base); }
function round10(x: number, mode: RoundMode) {
  if (!isFinite(x)) return x;
  if (mode==="nearest10") return Math.round(x/10)*10;
  if (mode==="ceil10")    return Math.ceil(x/10)*10;
  if (mode==="floor10")   return Math.floor(x/10)*10;
  return x;
}
function fmt(n?: number|null){ if (n===null || n===undefined || !isFinite(Number(n))) return "—"; return `$${Number(n).toFixed(2)}`; }

export default function PreciosPage(){
  const [qtext, setQtext] = useState("");
  const [rows, setRows] = useState<RowP[]>([]);
  const [editing, setEditing] = useState<Record<string, any>>({});

  useEffect(() => {
    const qy = query(collection(db, "productos"), orderBy("updatedAt","desc"), limit(300));
    const unsub = onSnapshot(qy, (snap)=>{
      setRows(snap.docs.map(d => {
        const data = d.data() as any;
        const chain = data.bonifChain || ((data.bonifs && data.bonifs.length) ? data.bonifs.join("+") : "");
        return { id: d.id, bonifChain: chain, ...data };
      }));
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

  function startEdit(r: RowP){
    setEditing(prev => ({
      ...prev,
      [r.id]: {
        precio_base: r.precio_base ?? 0,
        bonifChain: r.bonifChain || "",
        markup: r.markup ?? 0,
        roundMode: r.roundMode ?? "nearest10",
      }
    }));
  }

  function preview(ed: any){
    const base = parseNumberLike(ed.precio_base);
    const bon = parseBonifChain(ed.bonifChain || "");
    const mu  = parseNumberLike(ed.markup) || 0;
    if (!isFinite(base) || base<=0) return { costo_neto: null, precio: null };
    const neto = applyBonifs(base, bon);
    const venta = round10(neto*(1+mu/100), (ed.roundMode || "nearest10") as RoundMode);
    return { costo_neto: Math.round(neto*100)/100, precio: Math.round(venta*100)/100 };
  }

  async function save(id: string){
    const ed = editing[id]; if (!ed) return;
    const pv = preview(ed);
    await updateDoc(doc(db, "productos", id), {
      precio_base: isFinite(parseNumberLike(ed.precio_base)) ? parseNumberLike(ed.precio_base) : null,
      bonifs: parseBonifChain(ed.bonifChain || ""),
      bonifChain: ed.bonifChain || null,
      markup: isFinite(parseNumberLike(ed.markup)) ? parseNumberLike(ed.markup) : 0,
      roundMode: (ed.roundMode || "nearest10") as RoundMode,
      costo_neto: pv.costo_neto ?? null,
      precio: pv.precio ?? null,
      updatedAt: serverTimestamp(),
    });
    setEditing(prev => { const c={...prev}; delete c[id]; return c; });
  }

  return (
    <main>
      <PageHeader
        title="Precios"
        subtitle="Editar manualmente precio, bonificación, markup y redondeo"
        actions={<a href="/importar/precios" className="btn-outline">↗ Importar precios</a>}
      />

      <div className="container mt-6">
        <div className="card p-4 mb-4">
          <input className="border rounded-lg p-2 w-full" placeholder="Buscar por descripción, código o categoría…" value={qtext} onChange={(e)=>setQtext(e.target.value)} />
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
                <th style={{width:140}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r=>{
                const ed = editing[r.id];
                if (!ed){
                  return (
                    <tr key={r.id}>
                      <td>{r.descripcion}</td>
                      <td>{r.codigo || "—"}</td>
                      <td>{r.categoria || "—"}</td>
                      <td className="text-right">{fmt(r.precio_base)}</td>
                      <td className="text-right">{r.bonifChain ? `${r.bonifChain}%` : (r.bonifs && r.bonifs.length ? r.bonifs.join("+")+"%" : "—")}</td>
                      <td className="text-right">{fmt(r.costo_neto)}</td>
                      <td className="text-right">{typeof r.markup === "number" ? `${r.markup.toFixed(2)}%` : "—"}</td>
                      <td className="text-right">{fmt(r.precio)}</td>
                      <td>{r.roundMode || "—"}</td>
                      <td className="flex gap-2">
                        <button className="btn-outline" onClick={()=>startEdit(r)}>Editar</button>
                      </td>
                    </tr>
                  );
                }
                const pv = preview(ed);
                return (
                  <tr key={r.id} className="bg-amber-50">
                    <td>{r.descripcion}</td>
                    <td>{r.codigo || "—"}</td>
                    <td>{r.categoria || "—"}</td>
                    <td className="text-right"><input className="border rounded-lg p-1 w-28 text-right" value={ed.precio_base} onChange={(e)=>setEditing(prev=>({...prev, [r.id]:{...prev[r.id], precio_base:e.target.value}}))}/></td>
                    <td className="text-right"><input className="border rounded-lg p-1 w-24 text-right" value={ed.bonifChain} placeholder="20+10" onChange={(e)=>setEditing(prev=>({...prev, [r.id]:{...prev[r.id], bonifChain:e.target.value}}))}/></td>
                    <td className="text-right">{fmt(pv.costo_neto)}</td>
                    <td className="text-right"><input className="border rounded-lg p-1 w-20 text-right" value={ed.markup} onChange={(e)=>setEditing(prev=>({...prev, [r.id]:{...prev[r.id], markup:e.target.value}}))}/></td>
                    <td className="text-right"><b>{fmt(pv.precio)}</b></td>
                    <td>
                      <select className="border rounded-lg p-1" value={ed.roundMode} onChange={(e)=>setEditing(prev=>({...prev, [r.id]:{...prev[r.id], roundMode:e.target.value as RoundMode}}))}>
                        <option value="none">none</option>
                        <option value="nearest10">nearest10</option>
                        <option value="ceil10">ceil10</option>
                        <option value="floor10">floor10</option>
                      </select>
                    </td>
                    <td className="flex gap-2">
                      <button className="btn-primary" onClick={()=>save(r.id)}><Save size={16}/> Guardar</button>
                      <button className="btn-outline" onClick={()=>setEditing(prev=>{const c={...prev}; delete c[r.id]; return c;})}>Cancelar</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length===0 && (
                <tr>
                  <td colSpan={10}>
                    <div className="empty">
                      <h3>Sin resultados</h3>
                      <p>Buscá por descripción, código o categoría.</p>
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
