"use client";

import { useMemo, useState } from "react";

/**
 * Reglas que pediste:
 * - Markup global (%)
 * - Bonificación libre se aplica en la venta (no acá)
 * - Redondeo a múltiplos de 10 (método: nearest/up/down)
 * - Permitir cargar/modificar manual antes de importar
 * - XLSX/CSV desde el navegador (sin servidor)
 */

type RowRaw = Record<string, any>;
type Item = {
  sku?: string;
  nombre: string;
  costo?: number;
  precio?: number;
  iva?: number;
  unidad?: string;
  categoria?: string;
  stock?: number;
  notas?: string;
};

function norm(s: any) {
  return (s ?? "").toString().trim().toLowerCase();
}

function roundToMultiple(value: number, multiple: number, mode: "nearest"|"up"|"down") {
  if (!multiple || multiple <= 0) return value;
  const r = value / multiple;
  if (mode === "up") return Math.ceil(r) * multiple;
  if (mode === "down") return Math.floor(r) * multiple;
  return Math.round(r) * multiple;
}

export default function ImportarPreciosPage() {
  const [rows, setRows] = useState<RowRaw[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Parámetros
  const [usarPrecioArchivo, setUsarPrecioArchivo] = useState(false);
  const [markup, setMarkup] = useState<number>(30);
  const [redondear, setRedondear] = useState(true);
  const [multiple, setMultiple] = useState<number>(10);
  const [mode, setMode] = useState<"nearest"|"up"|"down">("nearest");
  const [iva, setIva] = useState<number>(21);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: RowRaw[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      setRows(json);

      // detección básica de columnas
      const colNames = Object.keys(json[0] || {}).map((k) => k.toString());
      const findCol = (cands: string[]) =>
        colNames.find((c) => cands.includes(norm(c)));

      const colSku   = findCol(["sku","código","codigo","código de barras","codigo de barras","barcode"]);
      const colNombre= findCol(["nombre","descripcion","descripción","detalle","producto"]);
      const colCosto = findCol(["costo","coste"]);
      const colPrecio= findCol(["precio","precio venta","precio_venta","price"]);

      // mapear
      const mapped: Item[] = json.map((r) => {
        const sku   = colSku ? (r as any)[colSku] : undefined;
        const nombre= colNombre ? String((r as any)[colNombre] ?? "") : "";
        const costoV= colCosto ? Number((r as any)[colCosto] ?? 0) : undefined;
        const precV = colPrecio ? Number((r as any)[colPrecio] ?? 0) : undefined;
        return {
          sku: sku ? String(sku) : undefined,
          nombre,
          costo: isFinite(Number(costoV)) ? Number(costoV) : undefined,
          precio: isFinite(Number(precV)) ? Number(precV) : undefined,
          iva,
          stock: 0,
        };
      }).filter(i => i.nombre);

      setItems(mapped);
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message || "No se pudo leer el archivo");
    }
  }

  const itemsCalculados = useMemo(() => {
    // Calcula precio final según reglas
    return items.map((it) => {
      const base = usarPrecioArchivo && isFinite(Number(it.precio))
        ? Number(it.precio)
        : isFinite(Number(it.costo)) ? Number(it.costo) : 0;

      let precio = base;
      if (!usarPrecioArchivo) {
        precio = base * (1 + (Number(markup) || 0)/100);
      }
      if (redondear) {
        precio = roundToMultiple(precio, Number(multiple) || 10, mode);
      }

      return { ...it, precio: Number(precio.toFixed(2)), iva: Number(iva) || 21 };
    });
  }, [items, usarPrecioArchivo, markup, redondear, multiple, mode, iva]);

  function setCell(i: number, key: keyof Item, value: string) {
    const clone = [...items];
    if (key === "precio" || key === "costo" || key === "iva" || key === "stock") {
      (clone[i] as any)[key] = Number(value);
    } else {
      (clone[i] as any)[key] = value;
    }
    setItems(clone);
  }

  async function importar() {
    setMsg(null);
    if (!itemsCalculados.length) {
      setMsg("No hay filas a importar");
      return;
    }
    setBusy(true);
    try {
      // chunk en 300 por seguridad
      let inserted = 0, updated = 0, total = 0;
      for (let i = 0; i < itemsCalculados.length; i += 300) {
        const pack = itemsCalculados.slice(i, i + 300);
        const res = await fetch("/api/import/productos", {
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
      setMsg(`✅ Importación OK · Insertados: ${inserted} · Actualizados: ${updated} · Total: ${total}`);
    } catch (e: any) {
      setMsg(`❌ ${e.message || "Error importando"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Importar precios</h1>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-3">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFile}
          className="block w-full"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={usarPrecioArchivo}
              onChange={(e) => setUsarPrecioArchivo(e.target.checked)}
            />
            Usar precio del archivo (sin markup)
          </label>

          {!usarPrecioArchivo && (
            <>
              <div className="flex items-center gap-2">
                <span>Markup %</span>
                <input
                  type="number"
                  value={markup}
                  onChange={(e) => setMarkup(Number(e.target.value))}
                  className="w-24 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>Redondear</span>
                <select value={redondear ? "si" : "no"} onChange={(e) => setRedondear(e.target.value === "si")} className="rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800">
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              {redondear && (
                <>
                  <div className="flex items-center gap-2">
                    <span>Múltiplo</span>
                    <input
                      type="number"
                      value={multiple}
                      onChange={(e) => setMultiple(Number(e.target.value))}
                      className="w-24 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Método</span>
                    <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800">
                      <option value="nearest">Al más cercano</option>
                      <option value="up">Hacia arriba</option>
                      <option value="down">Hacia abajo</option>
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex items-center gap-2">
            <span>IVA %</span>
            <input
              type="number"
              value={iva}
              onChange={(e) => setIva(Number(e.target.value))}
              className="w-24 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={importar}
            disabled={!items.length || busy}
            className="rounded-md bg-emerald-600 px-4 py-2 font-medium disabled:opacity-50"
          >
            {busy ? "Importando..." : "Importar (upsert por SKU)"}
          </button>
          {msg && <p className="text-sm text-neutral-300">{msg}</p>}
        </div>
      </div>

      {/* PREVIEW + EDICIÓN RÁPIDA */}
      {!!items.length && (
        <div className="rounded-lg border border-neutral-800 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900/60">
              <tr>
                <th className="text-left p-2">SKU</th>
                <th className="text-left p-2">Nombre</th>
                <th className="text-right p-2">Costo</th>
                <th className="text-right p-2">Precio</th>
                <th className="text-right p-2">IVA %</th>
                <th className="text-left p-2">Unidad</th>
                <th className="text-left p-2">Categoría</th>
                <th className="text-right p-2">Stock</th>
                <th className="text-left p-2">Notas</th>
              </tr>
            </thead>
            <tbody>
              {itemsCalculados.map((it, i) => (
                <tr key={i} className="border-t border-neutral-800">
                  <td className="p-2">
                    <input
                      className="w-32 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={items[i].sku || ""}
                      onChange={(e) => setCell(i, "sku", e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-64 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={items[i].nombre}
                      onChange={(e) => setCell(i, "nombre", e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      className="w-28 rounded-md bg-neutral-950 px-2 py-1 text-right ring-1 ring-neutral-800"
                      value={items[i].costo ?? ""}
                      onChange={(e) => setCell(i, "costo", e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      className="w-28 rounded-md bg-neutral-950 px-2 py-1 text-right ring-1 ring-neutral-800"
                      value={it.precio ?? ""}
                      onChange={(e) => setCell(i, "precio", e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="w-20 rounded-md bg-neutral-950 px-2 py-1 text-right ring-1 ring-neutral-800"
                      value={it.iva ?? 21}
                      onChange={(e) => setCell(i, "iva", e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-28 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={items[i].unidad ?? ""}
                      onChange={(e) => setCell(i, "unidad", e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-36 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={items[i].categoria ?? ""}
                      onChange={(e) => setCell(i, "categoria", e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="w-20 rounded-md bg-neutral-950 px-2 py-1 text-right ring-1 ring-neutral-800"
                      value={items[i].stock ?? 0}
                      onChange={(e) => setCell(i, "stock", e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-60 rounded-md bg-neutral-950 px-2 py-1 ring-1 ring-neutral-800"
                      value={items[i].notas ?? ""}
                      onChange={(e) => setCell(i, "notas", e.target.value)}
                    />
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
