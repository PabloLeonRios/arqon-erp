// src/app/api/import/productos/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/import/productos
 * Body JSON:
 * {
 *   upsert: boolean, // true = actualiza si existe por sku, si no crea
 *   items: [
 *     { sku, nombre, precio, costo?, iva?, unidad?, categoria?, stock?, notas? }
 *   ]
 * }
 *
 * Recomendado: mandar 50-500 items por vez (hacemos batch y chunks).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const upsert = !!body?.upsert;
    let items: any[] = Array.isArray(body?.items) ? body.items : [];

    // Saneamos + normalizamos mÃ­nimos
    items = items.map((r) => ({
      sku: (r?.sku ?? "").toString().trim(),
      nombre: (r?.nombre ?? "").toString().trim(),
      precio: Number(r?.precio ?? 0),
      costo: r?.costo != null ? Number(r.costo) : undefined,
      iva: r?.iva != null ? Number(r.iva) : 21,
      unidad: r?.unidad ? String(r.unidad).trim() : undefined,
      categoria: r?.categoria ? String(r.categoria).trim() : undefined,
      stock: r?.stock != null ? Number(r.stock) : 0,
      notas: r?.notas ? String(r.notas) : "",
    })).filter((r) => r.nombre && (r.precio >= 0));

    if (!items.length) {
      return NextResponse.json({ ok: false, error: "Sin items vÃ¡lidos para importar" }, { status: 400 });
    }

    // 1) Si upsert: traemos existentes por sku con 'in' (de a 30)
    const bySku = new Map<string, any>();
    const withSku = items.filter(i => i.sku);
    const chunks: string[][] = [];
    for (let i = 0; i < withSku.length; i += 30) {
      chunks.push(withSku.slice(i, i + 30).map(i => i.sku));
    }

    const existingBySku = new Map<string, string>(); // sku -> docId
    for (const skus of chunks) {
      if (!skus.length) continue;
      const snap = await adminDb.collection("productos").where("sku", "in", skus).get();
      for (const d of snap.docs) {
        const data = d.data() || {};
        const sku = (data.sku || "").toString();
        if (sku) existingBySku.set(sku, d.id);
      }
    }

    // 2) Batches (mÃ¡x 500 writes por batch)
    const now = new Date();
    let inserted = 0, updated = 0;

    // armamos lotes de hasta 450 por seguridad
    for (let i = 0; i < items.length; i += 450) {
      const slice = items.slice(i, i + 450);
      const batch = adminDb.batch();

      for (const it of slice) {
        const baseDoc = {
          sku: it.sku || null,
          nombre: it.nombre,
          precio: Number(it.precio || 0),
          costo: it.costo != null ? Number(it.costo) : null,
          iva: it.iva != null ? Number(it.iva) : 21,
          unidad: it.unidad || null,
          categoria: it.categoria || null,
          stock: it.stock != null ? Number(it.stock) : 0,
          notas: it.notas || "",
          updatedAt: now,
        };

        if (upsert && it.sku && existingBySku.has(it.sku)) {
          // UPDATE por SKU
          const docId = existingBySku.get(it.sku)!;
          const ref = adminDb.collection("productos").doc(docId);
          batch.update(ref, baseDoc);
          updated++;
        } else {
          // CREATE
          const ref = adminDb.collection("productos").doc();
          batch.set(ref, { ...baseDoc, createdAt: now });
          inserted++;
        }
      }

      await batch.commit();
    }

    return NextResponse.json({ ok: true, inserted, updated, total: items.length }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/import/productos error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Error interno" }, { status: 500 });
  }
}
