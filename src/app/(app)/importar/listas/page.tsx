"use client";

import { useMemo, useState } from "react";

/* Tipos locales */
type Row = Record<string, any>;
type Item = { sku: string; costo?: number; precio?: number };

function norm(v: any) {
  return (v ?? "").toString().trim().toLowerCase();
}
function toNum(x: any) {
  if (x === null || x === undefined) return undefined;
  const s = String(x).replace(",", ".").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default function ImportarListasPage() {
  const [codigo, setCodigo] = useState("BASE");
  const [nombre, setNombre] = useState("Lista Base");
  const [usarPrecioArchivo, setUsarPrecioArchivo] = useState(false);
  const [markupPct, setMarkupPct] = useState<number>(25);
  const [redondeo, setRedondeo] = useState<number>(10);
  const [actualizarProductosBase, setActualizarProductosBase] = useState(true);

  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const total = useMemo(() => items.length, [items]);

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

      const cols = Object.keys(json[0] || {});
      const find = (cands: string[]) => cols.find((c) => cands.includes(norm(c)));

      const cSku    = find(["sku","codigo","código","code","articulo","artículo"]);
      const cCosto  = find(["costo","cost","costo unit","costo_unit","costounit"]);
      const cPrecio = find(["precio","price","pvp","venta"]);

      const mapped: Item[] = json
        .map((r) => ({
          sku: cSku ? String((r as any)[cSku] ?? "").trim() : "",
          costo: cCosto ? toNum((r as any)[cCosto]) : undefined,
          precio: cPrecio ? toNum((r as any)[cPrecio]) : undefined,
        }))
        .filter((r) => r.sku);

      setItems(mapped);
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message || "No se pudo leer el archivo");
    }
  }

  function setCell(i: number, key: keyof Item, value: string) {
    const clone = [...items];
    if (key === "costo" || key === "precio") (clone[i] as any)[key] = toNum(value);
    else (clone[i] as any)[key] = value;
    setItems(clone);
  }

  function addRow() {
    setItems((prev) => [...prev, { sku: "", costo: undefined, precio: undefined }]);
  }
  function delRow(i: number) {
    const clone = [...items];
    clone.splice(i, 1);
    setItems(clone);
  }
  function clearAll() {
    setItems([]);
    setMsg(null);
  }

  async function importar() {
    setMsg(null);
    if (!items.length) return setMsg("No hay filas para importar");

    setBusy(true);
    try {
      const body = {
        lista: { codigo, nombre, activo: true },
        opciones: {
          usarPrecioArchivo,
          markupPct: Number(markupPct) || 0,
          redondeo: Number(redondeo) || 0,
          actualizarProductosBase:
            codigo.toUpperCase() === "BASE" ? !!actualizarProductosBase : false,
        },
        upsert: true,
        items,
      };

      const res = await fetch("/api/import/listas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Error importando");

      setMsg(
        `✅ Importación OK · Lista ${j.codigo} · Total: ${j.total} · (Productos actualizados: ${j.prodUpdated ?? 0})`
      );
    } catch (e: any) {
      setMsg(`❌ ${e.message || "Error importando"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Importar listas de precios</h1>
      <p className="text-sm text-neutral-300">
        Subí un XLSX/CSV con columnas <b>sku</b>, <b>costo</b> y/o <b>precio</b>. Si elegís “Usar precio del archivo”,
        se tomarán los valores de la columna <b>precio</b>. Si no, se calculará desde <b>costo</b> con <b>markup</b> y
        <b> redondeo</b> al múltiplo superior.
      </p>

      {/* Opciones */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Código de lista</label>
            <input
              className="w-full rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="BASE / MAYORISTA / ..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-neutral-400 mb-1">Nombre</label>
            <input
              className="w-full rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <input
              id="usarPrecio"
              type="checkbox"
              className="h-4 w-4"
              checked={usarPrecioArchivo}
              onChange={(e) => setUsarPrecioArchivo(e.target.checked)}
            />
            <label htmlFor="usarPrecio" className="text-sm">Usar precio del archivo</label>
          </div>
          <div className="flex items-end gap-2">
            <input
              id="actualizarBase"
              type="checkbox"
              className="h-4 w-4"
              checked={actualizarProductosBase}
              onChange={(e) => setActualizarProductosBase(e.target.checked)}
              disabled={codigo.toUpperCase() !== "BASE"}
            />
            <label htmlFor="actualizarBase" className="text-sm">
              Actualizar <b>productos.precio</b> (sólo BASE)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Markup %</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800"
              value={markupPct}
              onChange={(e) => setMarkupPct(Number(e.target.value))}
              disabled={usarPrecioArchivo}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Redondeo (múltiplo superior)</label>
            <input
              type="number"
              className="w-full rounded-md bg-neutral-950 px-3 py-2 ring-1 ring-neutral-800"
              value={redondeo}
              onChange={(e) => setRedondeo(Number(e.target.value))}
              disabled={usarPrecioArchivo}
              placeholder="10 / 100 / 5 ..."
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Archivo (XLSX/CSV)</label>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="block w-full" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={importar}
            disabled={!items.length || busy}
            className="rounded-md bg-emerald-600 px-4 py-2 font-medium disabled:opacity-50"
          >
            {busy ? "Importando..." : `Importar (${total} ítems)`}
          </button>
          <button
            onClick={addRow}
            className="rounded-md border border-neutral-700 px-3 py-2"
          >
            + Agregar fila
          </button>
          <button
            onClick={clearAll}
            className="rounded-md border border-neutral-700 px-3 py-2"
          >
            Limpiar
          </button>
          {msg && <span className="text-sm text-neutral-300">{msg}</span>}
        </div>
      </div>

      {/* Preview */}
      {!!items.length && (
        <div className="rounded-lg border border-neutral-800 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900/60">
              <tr>
                <th className="p-2 text-left">SKU</th>
                <th className="p-2 text-right">Costo</th>
                <th className="p-2 text-right">Precio (archivo)</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-t border-neutral-800">
                  <td className="p-2">
                    <input
                      className="w-48 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={it.sku}
                      onChange={(e) => setCell(i, "sku", e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      className="w-32 rounded-md bg-neutral-950 px-2 py-1 text-right ring-1 ring-neutral-800"
                      value={it.costo ?? ""}
                      onChange={(e) => setCell(i, "costo", e.target.value)}
                      disabled={usarPrecioArchivo}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      className="w-32 rounded-md bg-neutral-950 px-2 py-1 text-right ring-1 ring-neutral-800"
                      value={it.precio ?? ""}
                      onChange={(e) => setCell(i, "precio", e.target.value)}
                      disabled={!usarPrecioArchivo}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      className="text-red-400 hover:text-red-300"
                      onClick={() => delRow(i)}
                    >
                      ✕
                    </button>
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
