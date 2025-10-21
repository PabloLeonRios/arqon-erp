// src/app/api/productos/route.ts
import { NextResponse } from "next/server";
import { ProductSchema } from "@/types/product";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { requireOrg } from "@/lib/orgRequest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/productos?limit=&categoria=&q=
 * Filtra SIEMPRE por orgId (multi-tenant seguro).
 */
export async function GET(req: Request) {
  try {
    const { orgId } = requireOrg(req);
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const categoria = url.searchParams.get("categoria");
    const q = url.searchParams.get("q")?.toLowerCase().trim();

    const limit = Math.min(Number(limitParam || 25), 100);

    // Colección filtrada por org
    let ref = adminDb
      .collection("productos")
      .where("orgId", "==", orgId)
      .orderBy("createdAt", "desc");

    if (categoria) {
      ref = ref.where("categoria", "==", categoria);
    }

    const snap = await ref.limit(limit).get();
    let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (q) {
      data = data.filter((p: any) =>
        (p.nombre?.toLowerCase() || "").includes(q) ||
        (p.sku?.toLowerCase() || "").includes(q)
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("GET /api/productos error:", err);
    const msg =
      err?.message === "Organización no seleccionada"
        ? "Seleccioná una organización"
        : err?.message || "Error interno";
    const code = msg.includes("organización") ? 400 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}

/**
 * POST /api/productos
 * Crea con orgId + timestamps.
 */
export async function POST(req: Request) {
  try {
    const { orgId } = requireOrg(req);
    const body = await req.json();
    const parsed = ProductSchema.parse(body);

    const now = Timestamp.now();
    const docRef = await adminDb.collection("productos").add({
      ...parsed,
      orgId,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true, id: docRef.id }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/productos error:", err);

    // Zod
    if (err?.issues) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos", issues: err.issues },
        { status: 400 }
      );
    }

    const msg =
      err?.message === "Organización no seleccionada"
        ? "Seleccioná una organización"
        : err?.message || "Error interno";

    const code = msg.includes("organización") ? 400 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}
