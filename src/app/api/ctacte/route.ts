// src/app/api/ctacte/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/ctacte
 *   ?clienteId=ABC   (recomendado)
 *   ?limit=100
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clienteId = url.searchParams.get("clienteId");
    const limit = Math.min(Number(url.searchParams.get("limit") || 100), 300);

    let q = adminDb.collection("ctacte");
    if (clienteId) q = q.where("clienteId", "==", clienteId);

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

    // Saldo actual (debe - haber)
    const saldo = data.reduce((acc: number, m: any) => {
      if (m.movimiento === "debe") return acc + Number(m.monto || 0);
      if (m.movimiento === "haber") return acc - Number(m.monto || 0);
      return acc;
    }, 0);

    return NextResponse.json({ ok: true, data, saldo: Number(saldo.toFixed(2)) });
  } catch (err: any) {
    console.error("GET /api/ctacte error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Error" }, { status: 500 });
  }
}
