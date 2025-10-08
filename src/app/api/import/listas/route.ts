// src/app/api/import/listas/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* Helpers de limpieza/conversión */
function s(v: any) {
  const t = (v ?? "").toString().trim();
  return t.length ? t : undefined;
}
function n(v: any) {
  const num = Number(v);
  return Number.isFinite(num) ? num : undefined;
}
function b(v: any) {
  if (typeof v === "boolean") return v;
  const t = (v ?? "").toString().trim().toLowerCase();
  if (["true","1","si","sí","yes"].includes(t)) return true;
  if (["false","0","no"].includes(t)) return false;
  return undefined;
}
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as T;
}
function roundUpToMultiple(value: number, mult?: number) {
  const m = Number(mult);
  if (!m || !Number.isFinite(m) || m <= 0) return value;
  return Math.ceil(value / m) * m;
}

/**
 * POST /api/import/listas
 * Body JSON:
 * {
 *   lista: { codigo: "BASE", nombre?: "Lista Base", vigenteDesde?: "2025-10-05", activo?: true },
 *   opciones: {
 *     usarPrecioArchivo: boolean,
 *     markupPct: number,         // ej: 25
 *     redondeo: number | null,   // ej: 10, 100, 5 (múltiplo superior). null/0 = sin redondeo
 *     actualizarProductosBase: boolean // si codigo === "BASE", actualizar productos.precio
 *   },
 *   items: [
 *     { sku: "DET-5L", costo?: 3500, precio?: 5000 },
 *     ...
 *   ],
 *   upsert: true                 // por defecto true: inserta/actualiza precios por SKU
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const upsert = body?.upsert !== false; // default true
    const listaIn = body?.lista || {};
    const opciones = body?.opciones || {};
    let items: any[] = Array.isArray(body?.items) ? body.items : [];

    const codigo = s(listaIn?.codigo);
    if (!codigo) {
      return NextResponse.json(
        { ok: false, error: "Falta lista.codigo" },
        { status: 400 }
      );
    }
    const nombre = s(listaIn?.nombre) || codigo;
    const vigenteDesde = s(listaIn?.vigenteDesde);
    const activo = b(listaIn?.activo);
    const usarPrecioArchivo = !!opciones?.usarPrecioArchivo;
    const markupPct = n(opciones?.markupPct) ?? 0;
    const redondeo = n(opciones?.redondeo) ?? 0;
    const actualizarProductosBase = !!opciones?.actualizarProductosBase;

    // Normalizar items (SKU + costo/precio)
    items = items
      .map((r) => ({
        sku: s(r?.sku),
        costo: n(r?.costo),
        precio: n(r?.precio),
      }))
      .filter((r) => r.sku); // SKU requerido

    if (!items.length) {
      return NextResponse.json(
        { ok: false, error: "Sin filas válidas (SKU requerido)" },
        { status: 400 }
      );
    }

    const now = Timestamp.now();

    // 1) Buscar o crear la LISTA por 'codigo'
    let listaId: string | null = null;
    {
      const snap = await adminDb
        .collection("listas")
        .where("codigo", "==", codigo)
        .limit(1)
        .get();

      if (!snap.empty) {
        const ref = snap.docs[0].ref;
        listaId = ref.id;
        const patch = stripUndefined({
          nombre,
          vigenteDesde,
          activo,
          updatedAt: now,
        });
        await ref.set(patch, { merge: true });
      } else {
        const ref = adminDb.collection("listas").doc();
        await ref.set(
          stripUndefined({
            codigo,
            nombre,
            vigenteDesde,
            activo: activo ?? true,
            createdAt: now,
            updatedAt: now,
          })
        );
        listaId = ref.id;
      }
    }

    // 2) Pre-cargar productos (si vamos a actualizar productos.precio cuando la lista es BASE)
    const isBase = codigo.toUpperCase() === "BASE";
    const wantUpdateProductos = isBase && actualizarProductosBase;

    const productosBySku = new Map<string, FirebaseFirestore.DocumentReference>();
    if (wantUpdateProductos) {
      // Cargar SKUs existentes por lotes (where in)
      const skus = Array.from(new Set(items.map((i) => i.sku!).filter(Boolean)));
      for (let i = 0; i < skus.length; i += 30) {
        const pack = skus.slice(i, i + 30);
        const snap = await adminDb
          .collection("productos")
          .where("sku", "in", pack)
          .get();
        snap.forEach((d) => {
          const v = (d.data()?.sku ?? "").toString();
          if (v) productosBySku.set(v, d.ref);
        });
      }
    }

    // 3) Importar precios (colección plana 'precios' con id compuesto "listaId__sku")
    //    Índice recomendado (después): precios(listaId ASC, sku ASC)
    let inserted = 0, updated = 0, prodUpdated = 0;

    for (let i = 0; i < items.length; i += 450) {
      const slice = items.slice(i, i + 450);
      const batch = adminDb.batch();

      for (const it of slice) {
        const sku = it.sku!;
        let precioFinal: number | undefined;

        if (usarPrecioArchivo && n(it.precio) !== undefined) {
          precioFinal = n(it.precio)!;
        } else if (n(it.costo) !== undefined) {
          const base = n(it.costo)! * (1 + (markupPct || 0) / 100);
          precioFinal = roundUpToMultiple(base, redondeo || 0);
        } else {
          // sin costo ni precio → saltear fila
          continue;
        }

        const priceDocId = `${listaId}__${sku}`;
        const ref = adminDb.collection("precios").doc(priceDocId);

        const toWrite = stripUndefined({
          listaId,
          sku,
          precio: precioFinal,
          moneda: "ARS",
          updatedAt: now,
        });

        // Para saber si es insert/update sin leer (aproximado):
        // Escribimos con set merge y luego contamos por existencia previa rápidamente:
        // En batch no se puede saber; hacemos un truco: precarga opcional (pero costoso).
        // Optamos por "asumir" update si ya habíamos visto ese documento en este run,
        // pero como es primera vez, contamos todo como 'updated or inserted'.
        // Para métricas correctas haríamos un fast read previo; acá simplificamos:
        batch.set(ref, toWrite, { merge: true });

        // Actualizar producto.precio si es BASE y existe el producto
        if (wantUpdateProductos && productosBySku.has(sku)) {
          batch.set(
            productosBySku.get(sku)!,
            { precio: precioFinal, updatedAt: now },
            { merge: true }
          );
          prodUpdated++;
        }
      }

      await batch.commit();
    }

    // Para dar métricas reales de inserted/updated necesitaríamos leer antes cada priceDoc,
    // pero para no encarecer, devolvemos total y destacamos prodUpdated si aplica.
    const total = items.length;

    return NextResponse.json(
      {
        ok: true,
        listaId,
        codigo,
        total,
        // métricas aproximadas (si querés exactas, hacemos fast-read previo en otra iteración):
        inserted,
        updated,
        prodUpdated: wantUpdateProductos ? prodUpdated : 0,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/import/listas error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}
