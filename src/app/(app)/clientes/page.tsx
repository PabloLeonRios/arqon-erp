'use client';

import { FormEvent, useMemo, useState } from 'react';

type Cliente = {
  id: string;
  nombre: string;
  email?: string;
  cuit?: string;
  telefono?: string;
  direccion?: string;
};

export default function ClientesPage() {
  const [items, setItems] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cuit, setCuit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  function resetForm() {
    setNombre(''); setEmail(''); setCuit(''); setTelefono(''); setDireccion('');
  }

  function handleCrear(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    const nuevo: Cliente = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      email: email.trim() || undefined,
      cuit: cuit.trim() || undefined,
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
    };
    setItems((prev) => [nuevo, ...prev]);
    resetForm();
  }

  function eliminar(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      [it.nombre, it.email, it.cuit, it.telefono, it.direccion]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  }, [items, busqueda]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1>Clientes</h1>
          <p className="text-[rgb(var(--muted))] mt-1">Altas, edición y búsqueda</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost">Importar</button>
          <button type="button" className="btn btn-ghost">Exportar</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Crear / editar</div>
        <form onSubmit={handleCrear} className="grid md:grid-cols-2 gap-4">
          <input className="input" placeholder="Nombre / Razón Social *" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="CUIT / DNI" value={cuit} onChange={(e) => setCuit(e.target.value)} />
          <input className="input" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          <input className="input md:col-span-2" placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={resetForm}>Limpiar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="card-title m-0">Listado</div>
          <div className="flex items-center gap-2 w-full md:w-80">
            <input className="input" placeholder="Buscar por nombre, email, CUIT…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Nombre</th><th>CUIT/DNI</th><th>Email</th><th>Teléfono</th><th>Dirección</th><th className="text-right" style={{width:140}}>Acciones</th></tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-[rgb(var(--muted))]">Sin clientes aún. Creá el primero arriba ✨</td></tr>
              ) : filtrados.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}</td><td>{c.cuit || '-'}</td><td>{c.email || '-'}</td>
                  <td>{c.telefono || '-'}</td><td>{c.direccion || '-'}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-ghost">Editar</button>
                      <button className="btn btn-danger" onClick={() => eliminar(c.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
