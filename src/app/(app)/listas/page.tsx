"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  addDoc, collection, doc, getDocs, onSnapshot, query,
  serverTimestamp, updateDoc, writeBatch, orderBy
} from "firebase/firestore";

type Lista = {
  id: string;
  nombre: string;
  total_items?: number;
  activa?: boolean;
  archivo?: string|null;
  sheet?: string|null;
  createdAt?: any;
};

export default function ListasPage(){
  const [rows, setRows] = useState<Lista[]>([]);
  const [nombre, setNombre] = useState<string>("Lista manual");
  const [renombrandoId, setRenombrandoId] = useState<string|null>(null);
  const [nuevoNombre, setNuevoNombre] = useState<string>("");

  useEffect(() => {
    const qy = query(collection(db, "listas"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(qy, snap => {
      setRows(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  async function crearLista(){
    const name = nombre.trim() || "Lista manual";
    await addDoc(collection(db, "listas"), {
      nombre: name,
      archivo: null,
      sheet: null,
      total_items: 0,
      activa: false,
      createdAt: serverTimestamp(),
    });
    setNombre("Lista manual");
  }

  function startRename(l: Lista){
    setRenombrandoId(l.id);
    setNuevoNombre(l.nombre);
  }
  async function confirmRename(){
    if (!renombrandoId) return;
    const nn = nuevoNombre.trim(); if (!nn) return;
    await updateDoc(doc(db,"listas", renombrandoId), { nombre: nn });
    setRenombrandoId(null); setNuevoNombre("");
  }

  async function activarLista(id: string){
    // Dejar solo una activa
    const snap = await getDocs(collection(db,"listas"));
    const batch = writeBatch(db);
    snap.forEach(d => {
      const isActive = (d.id === id);
      batch.update(doc(db,"listas", d.id), { activa: isActive });
    });
    await batch.commit();
  }

  return (
    <main>
      <h1 className="text-xl font-semibold mb-4">Precios (Listas)</h1>

      {/* Crear lista vacía */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la lista</label>
            <input className="border rounded-lg p-2 w-full" value={nombre} onChange={e=>setNombre(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <button onClick={crearLista} className="bg-black text-white rounded-lg px-4 py-2">Crear lista vacía</button>
            <a href="/importar/precios" className="ml-2 border rounded-lg px-4 py-2 inline-block">+ Importar desde Excel</a>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Una lista vacía te permite luego asignar productos manualmente (por ahora la edición de precios es en “Productos / Servicios”).</p>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Archivo</th>
              <th className="text-left p-2">Hoja</th>
              <th className="text-right p-2">Ítems</th>
              <th className="text-left p-2">Activa</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(l=>(
              <tr key={l.id} className="border-t">
                <td className="p-2">
                  {renombrandoId===l.id ? (
                    <div className="flex gap-2">
                      <input className="border rounded-lg p-1" value={nuevoNombre} onChange={e=>setNuevoNombre(e.target.value)} />
                      <button className="border rounded px-2" onClick={confirmRename}>OK</button>
                      <button className="text-gray-600" onClick={()=>{setRenombrandoId(null); setNuevoNombre("");}}>Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{l.nombre}</span>
                      <button className="text-gray-600 underline" onClick={()=>startRename(l)}>Renombrar</button>
                    </div>
                  )}
                </td>
                <td className="p-2">{l.archivo || "—"}</td>
                <td className="p-2">{l.sheet || "—"}</td>
                <td className="p-2 text-right">{l.total_items ?? 0}</td>
                <td className="p-2">{l.activa ? "Sí" : "No"}</td>
                <td className="p-2 text-right">
                  {!l.activa && (
                    <button className="border rounded px-2 py-1" onClick={()=>activarLista(l.id)}>Activar</button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length===0 && (
              <tr><td className="p-4 text-center text-gray-500" colSpan={6}>Sin listas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
