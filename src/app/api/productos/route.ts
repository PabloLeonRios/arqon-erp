// src/app/api/productos/route.ts
import { NextResponse } from "next/server";
import { ProductSchema } from "@/types/product";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";           // firebase-admin requiere Node.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/productos
 * - Lista productos, ordenados por createdAt desc.
 * - Opcionales:
 *    ?limit=50
 *    ?categoria=Alimentos
 *    ?q=texto   (busca por 'nombre' o 'sku' con filtro simple en memoria)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const categoria = url.searchParams.get("categoria");
    const q = url.searchParams.get("q")?.toLowerCase().trim();

    const limit = Math.min(Number(limitParam || 25), 100);

    // Empezamos sin orderBy para poder probar fallback si falta índice
    let queryRef: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      adminDb.collection("productos");

    if (categoria) {
      queryRef = queryRef.where("categoria", "==", categoria);
    }

    let snap;
    try {
      // Intento rápido con orderBy (puede requerir índice compuesto)
      snap = await queryRef.orderBy("createdAt", "desc").limit(limit).get();
    } catch (e: any) {
      const msg = e?.message || "";
      const needsIndex = /FAILED_PRECONDITION|requires an index/i.test(msg);
      if (!needsIndex) throw e;

      // Fallback: sin orderBy; luego ordenamos en memoria
      snap = await queryRef.limit(limit).get();
    }

    let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (q) {
      // Filtro sencillo en memoria por nombre/sku (para algo más potente -> Algolia/Meilisearch)
      data = data.filter((p: any) =>
        (p.nombre?.toLowerCase() || "").includes(q) ||
        (p.sku?.toLowerCase() || "").includes(q)
      );
    }

    // Si vinimos por fallback, ordenamos en memoria por createdAt desc
    data.sort((a: any, b: any) => {
      const aT = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bT = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bT - aT;
    });

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("GET /api/productos error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/productos
 * - Crea un producto nuevo con validación Zod.
 * - Body JSON: { nombre, sku?, codigoBarras?, precio, iva?, stock?, unidad?, categoria?, activo?, notas? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ProductSchema.parse(body);

    const now = Timestamp.now();
    const docRef = await adminDb.collection("productos").add({
      ...parsed,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true, id: docRef.id }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/productos error:", err);

    if (err?.issues) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos", issues: err.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}
