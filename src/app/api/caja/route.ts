// src/app/api/caja/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { CajaMovimientoSchema } from "@/types/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/caja
 *   ?limit=50
 *   ?from=2025-10-01
 *   ?to=2025-10-31
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let q = adminDb.collection("caja");

    if (from) {
      const fromTs = Timestamp.fromDate(new Date(`${from}T00:00:00`));
      q = q.where("fecha", ">=", fromTs);
    }
    if (to) {
      const toTs = Timestamp.fromDate(new Date(`${to}T23:59:59`));
      q = q.where("fecha", "<=", toTs);
    }

    // Si fallara por Ã­ndice (por where + orderBy), quitamos orderBy y ordenamos en memoria
    let snap;
    try {
      snap = await q.orderBy("fecha", "desc").limit(limit).get();
    } catch {
      snap = await q.limit(limit).get();
    }

    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => {
        const at = a?.fecha?.toMillis?.() ?? 0;
        const bt = b?.fecha?.toMillis?.() ?? 0;
        return bt - at;
      });

    // Totales rÃ¡pidos en la respuesta
    const tot = data.reduce(
      (acc: any, m: any) => {
        if (m.tipo === "ingreso") acc.ingresos += Number(m.monto || 0);
        else acc.egresos += Number(m.monto || 0);
        return acc;
      },
      { ingresos: 0, egresos: 0 }
    );
    tot.saldo = Number((tot.ingresos - tot.egresos).toFixed(2));

    return NextResponse.json({ ok: true, data, tot });
  } catch (err: any) {
    console.error("GET /api/caja error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Error" }, { status: 500 });
  }
}

/**
 * POST /api/caja
 * Body: { tipo: 'ingreso'|'egreso', monto, medio, descripcion, ref? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CajaMovimientoSchema.parse(body);
    const now = Timestamp.now();

    const ref = await adminDb.collection("caja").add({
      ...parsed,
      fecha: now,
      createdAt: now,
    });

    return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/caja error:", err);
    if (err?.issues) {
      return NextResponse.json({ ok: false, error: "Datos invÃ¡lidos", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: err?.message || "Error" }, { status: 500 });
  }
}
