"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, limit
} from "firebase/firestore";

type RoundMode = "none"|"nearest10"|"ceil10"|"floor10";
type Tipo = "producto" | "servicio";

type Prod = {
  id: string;
  codigo?: string;
  descripcion: string;
  categoria?: string;
  tipo?: Tipo;
  precio?: number;          // final (redondeado)
  precio_base?: number;     // fuente (costo o venta)
  costo_neto?: number|null; // costo tras bonif
  bonifs?: number[];
  markup?: number;
  roundMode?: RoundMode;
  listaNombre?: string | null;
  updatedAt?: any;
};

// ===== Helpers numéricos (robustos para AR/US) =====
function parseNumberLike(v: any){
  if (v === null || v === undefined) return NaN;
  let s = String(v).trim();
  if (!s) return NaN;
  s = s.replace(/\s+/g,"").replace(/[^\d.,-]/g,"");
  const hasDot = s.includes("."), hasComma = s.includes(",");
  if (hasDot && hasComma){
    const lastDot = s.lastIndexOf("."), lastComma = s.lastIndexOf(",");
    if (lastComma > lastDot){ s = s.replace(/\./g,""); s = s.replace(/,/g,"."); }
    else { s = s.replace(/,/g,""); const last = s.lastIndexOf("."); s = s.slice(0,last).replace(/\./g,"") + "." + s.slice(last+1); }
  } else if (hasComma){
    const parts = s.split(","); if (parts.length===2 && parts[1].length<=3){ s = parts[0].replace(/\./g,"") + "." + parts[1]; }
    else { s = s.replace(/,/g,""); }
  } else if (hasDot){
    const last = s.lastIndexOf("."); s = s.slice(0,last).replace(/\./g,"") + "." + s.slice(last+1);
  }
  s = s.replace(/[^0-9.-]/g,"");
  const n = Number(s);
  return isNaN(n) ? NaN : n;
}
function parseBonifChain(input: string): number[] {
  if (!input) return [];
  return input.split("+").map(s => parseNumberLike(s)).filter(n => isFinite(n) && n>0);
}
function applyBonifs(base: number, bonifs: number[]): number {
  return bonifs.reduce((acc, b) => acc * (1 - b/100), base);
}
function round10(x: number, mode: RoundMode): number {
  if (!isFinite(x)) return x;
  switch (mode){
    case "nearest10": return Math.round(x / 10) * 10;
    case "ceil10":    return Math.ceil(x / 10) * 10;
    case "floor10":   return Math.floor(x / 10) * 10;
    default:          return x;
  }
}
function fmt(n?: number|null){ if (n===null||n===undefined||!isFinite(Number(n))) return "—"; return `$${Number(n).toFixed(2)}`; }

// ===== Página =====
export default function ProductosPage(){
  // listado
  const [rows, setRows] = useState<Prod[]>([]);
  const [qtext, setQtext] = useState("");

  // form
  const [editId, setEditId] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState<Tipo>("producto");

  const [precioFuenteTipo, setPrecioFuenteTipo] = useState<"costo"|"venta">("costo");
  const [precioBase, setPrecioBase] = useState<string>(""); // string para permitir comas
  const [bonifStr, setBonifStr] = useState<string>("");     // "20+10" o "15"
  const [markup, setMarkup] = useState<string>("0");
  const [roundMode, setRoundMode] = useState<RoundMode>("nearest10");

  const bonifs = useMemo(()=> parseBonifChain(bonifStr), [bonifStr]);
  const calc = useMemo(()=>{
    const base = parseNumberLike(precioBase);
    const mu   = parseNumberLike(markup) || 0;
    if (!isFinite(base) || base<=0) return { costo_neto:null, precio:null };
    if (precioFuenteTipo === "costo"){
      const neto = applyBonifs(base, bonifs);
      const venta = round10(neto * (1 + mu/100), roundMode);
      return { costo_neto: Math.round(neto*100)/100, precio: Math.round(venta*100)/100 };
    } else {
      const venta = round10(base, roundMode);
      return { costo_neto: null, precio: Math.round(venta*100)/100 };
    }
  }, [precioBase, bonifs, markup, roundMode, precioFuenteTipo]);

  useEffect(() => {
    const qy = query(collection(db, "productos"), orderBy("updatedAt","desc"), limit(300));
    const unsub = onSnapshot(qy, snap => {
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

  function resetForm(){
    setEditId(null);
    setCodigo(""); setDescripcion(""); setCategoria(""); setTipo("producto");
    setPrecioFuenteTipo("costo"); setPrecioBase(""); setBonifStr(""); setMarkup("0"); setRoundMode("nearest10");
  }

  async function saveProduct(e: React.FormEvent){
    e.preventDefault();
    const base = parseNumberLike(precioBase);
    const mu   = parseNumberLike(markup) || 0;
    if (!descripcion.trim()) return alert("Completá la descripción");
    if (!isFinite(base) || base<=0) return alert("Precio base inválido");

    const data = {
      codigo: codigo || null,
      descripcion: descripcion.trim(),
      categoria: categoria || null,
      tipo,
      precio_base: base,
      costo_neto: calc.costo_neto,
      bonifs,
      markup: mu,
      roundMode,
      precio: calc.precio,
      listaId: null,
      listaNombre: null,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editId){
        await updateDoc(doc(db, "productos", editId), data as any);
      } else {
        if (codigo){
          await setDoc(doc(db, "productos", codigo), data as any, { merge: true });
        } else {
          await addDoc(collection(db, "productos"), data as any);
        }
      }
      resetForm();
    } catch (e:any){
      alert(e.message);
    }
  }

  function onEdit(p: Prod){
    setEditId(p.id || null);
    setCodigo(p.codigo || "");
    setDescripcion(p.descripcion || "");
    setCategoria(p.categoria || "");
    setTipo((p.tipo as Tipo) || "producto");
    setPrecioFuenteTipo(p.costo_neto !== null && p.costo_neto !== undefined ? "costo" : "venta");
    setPrecioBase(String(p.precio_base ?? ""));
    setBonifStr((p.bonifs && p.bonifs.length) ? p.bonifs.join("+") : "");
    setMarkup(String(p.markup ?? "0"));
    setRoundMode(p.roundMode || "nearest10");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onDelete(id: string){
    if (!confirm("¿Eliminar producto?")) return;
    await deleteDoc(doc(db, "productos", id));
    if (editId === id) resetForm();
  }

  return (
    <main>
      <h1 className="text-xl font-semibold mb-4">Productos / Servicios</h1>

      {/* Form alta/edición */}
      <form onSubmit={saveProduct} className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Código</label>
            <input className="border rounded-lg p-2 w-full" value={codigo} onChange={e=>setCodigo(e.target.value)} placeholder="Opcional, ej: PROD-001" />
            <p className="text-xs text-gray-500 mt-1">Si completás código, el ID será ese (útil para actualizar).</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select className="border rounded-lg p-2 w-full" value={tipo} onChange={e=>setTipo(e.target.value as Tipo)}>
              <option value="producto">Producto</option>
              <option value="servicio">Servicio</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Descripción *</label>
            <input className="border rounded-lg p-2 w-full" value={descripcion} onChange={e=>setDescripcion(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <input className="border rounded-lg p-2 w-full" value={categoria} onChange={e=>setCategoria(e.target.value)} placeholder="Opcional" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Interpretación del precio</label>
            <select className="border rounded-lg p-2 w-full" value={precioFuenteTipo} onChange={e=>setPrecioFuenteTipo(e.target.value as any)}>
              <option value="costo">Costo del proveedor</option>
              <option value="venta">Precio de venta (final)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {precioFuenteTipo==="costo" ? "Costo base" : "Precio de venta (final)"} *
            </label>
            <input className="border rounded-lg p-2 w-full" value={precioBase} onChange={e=>setPrecioBase(e.target.value)} placeholder="Ej: 12.345,67" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bonificación (cadena o % único)</label>
            <input className="border rounded-lg p-2 w-full" value={bonifStr} onChange={e=>setBonifStr(e.target.value)} placeholder="Ej: 20+10 o 15" />
            <p className="text-xs text-gray-500 mt-1">Se aplica sobre el costo. Dejá vacío si no corresponde.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Markup global (%)</label>
            <input className="border rounded-lg p-2 w-full" value={markup} onChange={e=>setMarkup(e.target.value)} placeholder="Ej: 18" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Redondeo</label>
            <select className="border rounded-lg p-2 w-full" value={roundMode} onChange={e=>setRoundMode(e.target.value as RoundMode)}>
              <option value="none">Sin redondeo</option>
              <option value="nearest10">Al múltiplo de 10 más cercano</option>
              <option value="ceil10">Hacia arriba (múltiplo de 10)</option>
              <option value="floor10">Hacia abajo (múltiplo de 10)</option>
            </select>
          </div>

          <div className="md:col-span-2 grid sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm">Costo neto (post-bonif): <b>{fmt(calc.costo_neto)}</b></div>
              <div className="text-sm">Precio final (c/ redondeo): <b>{fmt(calc.precio)}</b></div>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="bg-black text-white rounded-lg px-4 py-2">
                {editId ? "Guardar cambios" : "Crear producto/servicio"}
              </button>
              {editId && (
                <button type="button" onClick={resetForm} className="border rounded-lg px-4 py-2">
                  Cancelar edición
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Buscador y tabla */}
      <div className="bg-white rounded-xl shadow p-4 mb-3">
        <input
          className="border rounded-lg p-2 w-full"
          placeholder="Buscar por descripción, código o categoría…"
          value={qtext}
          onChange={(e)=>setQtext(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Descripción</th>
              <th className="text-left p-2">Código</th>
              <th className="text-left p-2">Categoría</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-right p-2">Precio fuente</th>
              <th className="text-right p-2">Bonif</th>
              <th className="text-right p-2">Costo neto</th>
              <th className="text-right p-2">Markup</th>
              <th className="text-right p-2">Precio final</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p=>(
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.descripcion}</td>
                <td className="p-2">{p.codigo || "—"}</td>
                <td className="p-2">{p.categoria || "—"}</td>
                <td className="p-2">{p.tipo || "—"}</td>
                <td className="p-2 text-right">{fmt(p.precio_base)}</td>
                <td className="p-2 text-right">{(p.bonifs && p.bonifs.length) ? p.bonifs.join("+")+"%" : "—"}</td>
                <td className="p-2 text-right">{fmt(p.costo_neto)}</td>
                <td className="p-2 text-right">{typeof p.markup === "number" ? `${p.markup.toFixed(2)}%` : "—"}</td>
                <td className="p-2 text-right">{fmt(p.precio)}</td>
                <td className="p-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <button className="border rounded px-2 py-1" onClick={()=>onEdit(p)}>Editar</button>
                    <button className="text-red-600" onClick={()=>onDelete(p.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td className="p-4 text-center text-gray-500" colSpan={10}>Sin productos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
