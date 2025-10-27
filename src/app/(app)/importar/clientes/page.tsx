"use client";

import { useMemo, useState } from "react";

type Row = Record<string, any>;
type Cliente = {
  doc?: string;
  nombre: string;
  fantasia?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  condIva?: "RI" | "Monotributo" | "CF" | "Exento" | "No Responsable";
  bonifPct?: number;
  notas?: string;
  activo?: boolean;
};

function norm(s: any) {
  return (s ?? "").toString().trim().toLowerCase();
}
function toBool(v: any) {
  const t = (v ?? "").toString().trim().toLowerCase();
  if (["true","1","si","sÃ­","activo","activa"].includes(t)) return true;
  if (["false","0","no","inactivo","inactiva"].includes(t)) return false;
  return undefined;
}
function mapCondIva(v: any): Cliente["condIva"] {
  const t = (v ?? "").toString().trim().toLowerCase();
  if (!t) return undefined as any;
  if (["ri","responsable inscripto","responsable-inscripto","resp inscripto"].includes(t)) return "RI";
  if (["monotributo","monotributista","mono"].includes(t)) return "Monotributo";
  if (["cf","consumidor final","consumidor-final","final"].includes(t)) return "CF";
  if (["exento","ex"].includes(t)) return "Exento";
  if (["no responsable","no-responsable","noresp"].includes(t)) return "No Responsable";
  return undefined as any;
}

export default function ImportarClientesPage() {
  const [raw, setRaw] = useState<Row[]>([]);
  const [items, setItems] = useState<Cliente[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: Row[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      setRaw(json);

      // detectar columnas (tolerante)
      const cols = Object.keys(json[0] || {});
      const find = (cands: string[]) => cols.find((c) => cands.includes(norm(c)));

      const cDoc       = find(["doc","documento","dni","cuit","cuil"]);
      const cNombre    = find(["nombre","razon social","razÃ³n social","razon","razÃ³n","cliente"]);
      const cFantasia  = find(["fantasia","fantasÃ­a","comercial","nombre fantasia","nombre de fantasia"]);
      const cEmail     = find(["email","mail","correo","correo electronico","correo electrÃ³nico"]);
      const cTel       = find(["telefono","telÃ©fono","cel","celular","movil","mÃ³vil"]);
      const cDir       = find(["direccion","direcciÃ³n","domicilio","calle"]);
      const cLoc       = find(["localidad","ciudad","poblacion","poblaciÃ³n"]);
      const cProv      = find(["provincia","estado","region","regiÃ³n"]);
      const cCondIva   = find(["condiva","iva","condicion iva","condiciÃ³n iva","condiciÃ³n de iva","cond. iva"]);
      const cBonif     = find(["bonif","bonificacion","bonificaciÃ³n","bonif%","bonif_pct","descuento"]);
      const cNotas     = find(["notas","observaciones","obs"]);
      const cActivo    = find(["activo","estado","habilitado"]);

      const mapped: Cliente[] = json.map((r) => ({
        doc: cDoc ? String((r as any)[cDoc] ?? "").trim() : undefined,
        nombre: cNombre ? String((r as any)[cNombre] ?? "") : "",
        fantasia: cFantasia ? String((r as any)[cFantasia] ?? "") : "",
        email: cEmail ? String((r as any)[cEmail] ?? "") : "",
        telefono: cTel ? String((r as any)[cTel] ?? "") : "",
        direccion: cDir ? String((r as any)[cDir] ?? "") : "",
        localidad: cLoc ? String((r as any)[cLoc] ?? "") : "",
        provincia: cProv ? String((r as any)[cProv] ?? "") : "",
        condIva: cCondIva ? mapCondIva((r as any)[cCondIva]) : undefined,
        bonifPct: cBonif ? Number((r as any)[cBonif] ?? 0) : undefined,
        notas: cNotas ? String((r as any)[cNotas] ?? "") : "",
        activo: cActivo ? toBool((r as any)[cActivo]) : true,
      })).filter(i => i.nombre);

      setItems(mapped);
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message || "No se pudo leer el archivo");
    }
  }

  function setCell(i: number, key: keyof Cliente, value: string) {
    const clone = [...items];
    if (key === "bonifPct") (clone[i] as any)[key] = Number(value);
    else if (key === "activo") (clone[i] as any)[key] = value === "true";
    else (clone[i] as any)[key] = value;
    setItems(clone);
  }

  const total = useMemo(() => items.length, [items]);

  async function importar() {
    setMsg(null);
    if (!items.length) return setMsg("No hay filas para importar");
    setBusy(true);
    try {
      let inserted = 0, updated = 0, total = 0;
      for (let i = 0; i < items.length; i += 300) {
        const pack = items.slice(i, i + 300);
        const res = await fetch("/api/import/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ upsert: true, items: pack }),
        });
        const j = await res.json();
        if (!j.ok) throw new Error(j.error || "Error importando");
        inserted += j.inserted || 0;
        updated  += j.updated  || 0;
        total    += j.total    || pack.length;
      }
      setMsg(`âœ… ImportaciÃ³n OK Â· Insertados: ${inserted} Â· Actualizados: ${updated} Â· Total: ${total}`);
    } catch (e: any) {
      setMsg(`âŒ ${e.message || "Error importando"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Importar clientes</h1>
      <p className="text-sm text-neutral-300">
        Upsert por <b>Doc</b> (CUIT/CUIL/DNI) o <b>Email</b>. La bonificaciÃ³n se aplica en la venta (no aquÃ­).
      </p>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-3">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFile}
          className="block w-full"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={importar}
            disabled={!items.length || busy}
            className="rounded-md bg-emerald-600 px-4 py-2 font-medium disabled:opacity-50"
          >
            {busy ? "Importando..." : `Importar (${total} filas)`}
          </button>
          {msg && <span className="text-sm text-neutral-300">{msg}</span>}
        </div>
      </div>

      {!!items.length && (
        <div className="rounded-lg border border-neutral-800 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900/60">
              <tr>
                <th className="p-2 text-left">Doc</th>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">FantasÃ­a</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">TelÃ©fono</th>
                <th className="p-2 text-left">DirecciÃ³n</th>
                <th className="p-2 text-left">Localidad</th>
                <th className="p-2 text-left">Provincia</th>
                <th className="p-2 text-left">Cond. IVA</th>
                <th className="p-2 text-right">Bonif %</th>
                <th className="p-2 text-left">Notas</th>
                <th className="p-2 text-left">Activo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c, i) => (
                <tr key={i} className="border-t border-neutral-800">
                  <td className="p-2">
                    <input className="w-36 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={c.doc || ""} onChange={(e)=>setCell(i,"doc",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <input className="w-56 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={c.nombre} onChange={(e)=>setCell(i,"nombre",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <input className="w-48 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={c.fantasia || ""} onChange={(e)=>setCell(i,"fantasia",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <input className="w-52 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={c.email || ""} onChange={(e)=>setCell(i,"email",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <input className="w-40 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={c.telefono || ""} onChange={(e)=>setCell(i,"telefono",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <input className="w-56 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={c.direccion || ""} onChange={(e)=>setCell(i,"direccion",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <input className="w-40 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={c.localidad || ""} onChange={(e)=>setCell(i,"localidad",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <input className="w-40 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={c.provincia || ""} onChange={(e)=>setCell(i,"provincia",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <select className="w-40 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={c.condIva || ""} onChange={(e)=>setCell(i,"condIva",e.target.value)}>
                      <option value="">â€”</option>
                      <option value="RI">RI</option>
                      <option value="Monotributo">Monotributo</option>
                      <option value="CF">CF</option>
                      <option value="Exento">Exento</option>
                      <option value="No Responsable">No Responsable</option>
                    </select>
                  </td>
                  <td className="p-2 text-right">
                    <input type="number" step="0.01"
                      className="w-24 rounded-md bg-neutral-950 px-2 py-1 text-right ring-1 ring-neutral-800"
                      value={c.bonifPct ?? 0} onChange={(e)=>setCell(i,"bonifPct",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <input className="w-56 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={c.notas || ""} onChange={(e)=>setCell(i,"notas",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <select className="rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={String(c.activo ?? true)} onChange={(e)=>setCell(i,"activo",e.target.value)}>
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
