// src/app/api/ctacte/pagos/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { PagoCtacteSchema } from "@/types/ctacte";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/ctacte/pagos
 * Body: { clienteId, clienteNombre, monto, medio, descripcion?, facturaId? }
 * Efecto: crea recibo, ctacte (haber), y caja (ingreso)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = PagoCtacteSchema.parse(body);

    const now = Timestamp.now();

    // usaremos una transacciÃ³n para crear los 3 documentos coherentes
    const result = await adminDb.runTransaction(async (tx) => {
      const reciboRef = adminDb.collection("recibos").doc();
      const ctacteRef = adminDb.collection("ctacte").doc();
      const cajaRef   = adminDb.collection("caja").doc();

      // 1) recibo
      tx.set(reciboRef, {
        fecha: now,
        clienteId: parsed.clienteId,
        clienteNombre: parsed.clienteNombre,
        monto: parsed.monto,
        medio: parsed.medio,
        descripcion: parsed.descripcion || "Pago en cuenta corriente",
        facturaId: parsed.facturaId || null,
        createdAt: now,
      });

      // 2) ctacte (haber)
      tx.set(ctacteRef, {
        fecha: now,
        clienteId: parsed.clienteId,
        clienteNombre: parsed.clienteNombre,
        movimiento: "haber",
        monto: parsed.monto,
        descripcion: parsed.descripcion || `Pago ${reciboRef.id}`,
        reciboId: reciboRef.id,
        facturaId: parsed.facturaId || null,
        createdAt: now,
      });

      // 3) caja (ingreso)
      tx.set(cajaRef, {
        fecha: now,
        tipo: "ingreso",
        origen: "recibo",
        reciboId: reciboRef.id,
        descripcion: `Pago ${reciboRef.id} - ${parsed.clienteNombre}`,
        monto: parsed.monto,
        medio: parsed.medio,
        createdAt: now,
      });

      return { reciboId: reciboRef.id };
    });

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/ctacte/pagos error:", err);
    if (err?.issues) {
      return NextResponse.json({ ok: false, error: "Datos invÃ¡lidos", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: err?.message || "Error" }, { status: 500 });
  }
}
