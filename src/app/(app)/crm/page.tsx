"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

type Lead = {
  id: string;
  nombre: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  nota?: string;
  etapa: "nuevo" | "contactado" | "propuesta" | "ganado" | "perdido";
  createdAt?: any;
};

const ETAPAS: Lead["etapa"][] = ["nuevo", "contactado", "propuesta", "ganado", "perdido"];

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [form, setForm] = useState<{ [k: string]: string }>({ nombre: "", empresa: "", email: "", telefono: "", nota: "" });

  useEffect(() => {
    const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Lead[]);
    });
    return () => unsub();
  }, []);

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    await addDoc(collection(db, "leads"), {
      ...form,
      etapa: "nuevo",
      createdAt: serverTimestamp(),
    });
    setForm({ nombre: "", empresa: "", email: "", telefono: "", nota: "" });
  }

  async function setEtapa(id: string, etapa: Lead["etapa"]) {
    await updateDoc(doc(db, "leads", id), { etapa });
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <a href="/panel" className="rounded-lg border px-3 py-1">â† Panel</a>
      </header>

      <div className="max-w-6xl mx-auto grid gap-6">
        <h1 className="text-2xl font-semibold">CRM</h1>

        <section className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-medium mb-3">Nuevo lead</h2>
          <form onSubmit={addLead} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <input className="border rounded-lg p-2 lg:col-span-2" placeholder="Nombre *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            <input className="border rounded-lg p-2" placeholder="Empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
            <input className="border rounded-lg p-2" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="border rounded-lg p-2" placeholder="TelÃ©fono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            <input className="border rounded-lg p-2 lg:col-span-2" placeholder="Nota" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
            <button className="rounded-lg bg-black text-white px-4">Guardar</button>
          </form>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {ETAPAS.map((etapa) => (
            <div key={etapa} className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-medium capitalize mb-2">{etapa}</h3>
              <ul className="space-y-2">
                {leads.filter((l) => l.etapa === etapa).map((l) => (
                  <li key={l.id} className="border rounded-lg p-2">
                    <p className="font-medium">{l.nombre}</p>
                    <p className="text-xs text-gray-600">{[l.empresa, l.email, l.telefono].filter(Boolean).join(" Â· ")}</p>
                    <p className="text-xs text-gray-600">{l.nota}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ETAPAS.filter((e) => e !== etapa).map((e) => (
                        <button key={e} className="rounded border px-2 text-xs capitalize" onClick={() => setEtapa(l.id, e)}>
                          â†’ {e}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
                {leads.filter((l) => l.etapa === etapa).length === 0 && (
                  <p className="text-sm text-gray-500">Sin leads.</p>
                )}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
