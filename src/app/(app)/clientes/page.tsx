"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, limit
} from "firebase/firestore";

type Cliente = {
  id: string;
  nombre: string;
  cuit?: string|null;
  email?: string|null;
  telefono?: string|null;
  direccion?: string|null;
  ciudad?: string|null;
  provincia?: string|null;
};

export default function ClientesPage(){
  const [rows, setRows] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");

  // form
  const [editId, setEditId] = useState<string|null>(null);
  const [nombre, setNombre] = useState("");
  const [cuit, setCuit] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [provincia, setProvincia] = useState("");

  useEffect(() => {
    const qy = query(collection(db, "clientes"), orderBy("updatedAt","desc"), limit(300));
    const unsub = onSnapshot(qy, snap => {
      setRows(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(()=>{
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(r =>
      (r.nombre || "").toLowerCase().includes(t) ||
      (r.cuit || "").toLowerCase().includes(t) ||
      (r.email || "").toLowerCase().includes(t)
    );
  }, [rows, q]);

  function reset(){
    setEditId(null);
    setNombre(""); setCuit(""); setEmail(""); setTelefono(""); setDireccion(""); setCiudad(""); setProvincia("");
  }

  async function save(e: React.FormEvent){
    e.preventDefault();
    if (!nombre.trim()) return alert("Completá el nombre");
    const data = {
      nombre: nombre.trim(),
      cuit: cuit.trim() || null,
      email: email.trim() || null,
      telefono: telefono.trim() || null,
      direccion: direccion.trim() || null,
      ciudad: ciudad.trim() || null,
      provincia: provincia.trim() || null,
      updatedAt: serverTimestamp(),
    };
    try {
      if (editId){
        await updateDoc(doc(db, "clientes", editId), data as any);
      } else if (cuit.trim()){
        await setDoc(doc(db, "clientes", cuit.replace(/[^\d]/g,"")), data as any, { merge: true });
      } else {
        await addDoc(collection(db, "clientes"), data as any);
      }
      reset();
    } catch (e:any){
      alert(e.message);
    }
  }

  function onEdit(c: Cliente){
    setEditId(c.id);
    setNombre(c.nombre || "");
    setCuit(c.cuit || "");
    setEmail(c.email || "");
    setTelefono(c.telefono || "");
    setDireccion(c.direccion || "");
    setCiudad(c.ciudad || "");
    setProvincia(c.provincia || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onDelete(id: string){
    if (!confirm("¿Eliminar cliente?")) return;
    await deleteDoc(doc(db, "clientes", id));
    if (editId === id) reset();
  }

  return (
    <main>
      <h1 className="text-xl font-semibold mb-4">Clientes</h1>

      <form onSubmit={save} className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Nombre / Razón Social *</label>
            <input className="border rounded-lg p-2 w-full" value={nombre} onChange={e=>setNombre(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CUIT / DNI</label>
            <input className="border rounded-lg p-2 w-full" value={cuit} onChange={e=>setCuit(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="border rounded-lg p-2 w-full" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input className="border rounded-lg p-2 w-full" value={telefono} onChange={e=>setTelefono(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <input className="border rounded-lg p-2 w-full" value={direccion} onChange={e=>setDireccion(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ciudad</label>
            <input className="border rounded-lg p-2 w-full" value={ciudad} onChange={e=>setCiudad(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Provincia</label>
            <input className="border rounded-lg p-2 w-full" value={provincia} onChange={e=>setProvincia(e.target.value)} />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <button type="submit" className="bg-black text-white rounded-lg px-4 py-2">
              {editId ? "Guardar cambios" : "Crear cliente"}
            </button>
            {editId && (
              <button type="button" onClick={reset} className="border rounded-lg px-4 py-2">
                Cancelar edición
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow p-4 mb-3">
        <input className="border rounded-lg p-2 w-full" placeholder="Buscar nombre, CUIT o email…" value={q} onChange={e=>setQ(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">CUIT</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Teléfono</th>
              <th className="text-left p-2">Ciudad</th>
              <th className="text-left p-2">Provincia</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c=>(
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.nombre}</td>
                <td className="p-2">{c.cuit || "—"}</td>
                <td className="p-2">{c.email || "—"}</td>
                <td className="p-2">{c.telefono || "—"}</td>
                <td className="p-2">{c.ciudad || "—"}</td>
                <td className="p-2">{c.provincia || "—"}</td>
                <td className="p-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <button className="border rounded px-2 py-1" onClick={()=>onEdit(c)}>Editar</button>
                    <button className="text-red-600" onClick={()=>onDelete(c.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td className="p-4 text-center text-gray-500" colSpan={7}>Sin clientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
