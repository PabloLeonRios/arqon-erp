// src/app/api/facturas/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { InvoiceSchema } from "@/types/invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/facturas
 *   ?limit=50
 *   ?clienteId=abc
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const clienteId = url.searchParams.get("clienteId");
    const limit = Math.min(Number(limitParam || 25), 100);

    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      adminDb.collection("facturas");

    if (clienteId) {
      q = q.where("clienteId", "==", clienteId);
    }

    let snap;
    try {
      // Intento rÃ¡pido con orderBy (puede requerir Ã­ndice compuesto)
      snap = await q.orderBy("fecha", "desc").limit(limit).get();
    } catch (e: any) {
      const msg = e?.message || "";
      const needsIndex = /FAILED_PRECONDITION|requires an index/i.test(msg);
      if (!needsIndex) throw e;

      // Fallback: sin orderBy; luego ordenamos en memoria
      snap = await q.limit(limit).get();
    }

    let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Orden de seguridad por fecha desc
    data.sort((a: any, b: any) => {
      const at =
        a?.fecha?.toMillis?.() ??
        (typeof a?.fecha === "number" ? a.fecha : 0);
      const bt =
        b?.fecha?.toMillis?.() ??
        (typeof b?.fecha === "number" ? b.fecha : 0);
      return bt - at;
    });

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("GET /api/facturas error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/facturas
 * Body JSON:
 * {
 *   clienteId, clienteNombre, formaPago: "contado" | "cta_cte",
 *   items: [{ desc, qty, price, bonifPct?, productoId? }],
 *   notas?, restarStock?
 * }
 *
 * Efectos:
 *  - Crea factura (tipo: "FI", estado: "cerrada")
 *  - Si formaPago=contado => agrega movimiento en "caja" (ingreso)
 *  - Si formaPago=cta_cte => agrega movimiento en "ctacte" (debe)
 *  - (Opcional) restarStock=true => descuenta stock por productoId
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = InvoiceSchema.parse(body);

    // calcular totales en servidor
    let subtotal = 0;
    const itemsCalc = parsed.items.map((it) => {
      const base = Number(it.qty) * Number(it.price);
      const bonif = base * (Number(it.bonifPct || 0) / 100);
      const importe = base - bonif;
      subtotal += importe;
      return { ...it, importe };
    });
    const total = Number(subtotal.toFixed(2));

    // Iniciamos batch para escribir todo atÃ³mico
    const batch = adminDb.batch();

    // 1) Factura
    const facturaRef = adminDb.collection("facturas").doc();
    const now = Timestamp.now();

    batch.set(facturaRef, {
      tipo: "FI",
      estado: "cerrada",
      fecha: now,                     // <- MUY IMPORTANTE para el orderBy
      clienteId: parsed.clienteId,
      clienteNombre: parsed.clienteNombre,
      formaPago: parsed.formaPago,    // contado | cta_cte
      items: itemsCalc,
      subtotal,
      total,
      notas: parsed.notas || "",
      createdAt: now,
      updatedAt: now,
    });

    // 2) Impacto en caja o cta cte
    if (parsed.formaPago === "contado") {
      const cajaRef = adminDb.collection("caja").doc();
      batch.set(cajaRef, {
        fecha: now,
        tipo: "ingreso",
        origen: "factura",
        facturaId: facturaRef.id,
        descripcion: `Cobro FI ${facturaRef.id} - ${parsed.clienteNombre}`,
        monto: total,
        medio: "efectivo",
        createdAt: now,
      });
    } else {
      const ctacteRef = adminDb.collection("ctacte").doc();
      batch.set(ctacteRef, {
        fecha: now,
        clienteId: parsed.clienteId,
        clienteNombre: parsed.clienteNombre,
        facturaId: facturaRef.id,
        movimiento: "debe",
        monto: total,
        saldo: total,
        descripcion: `FI a crÃ©dito ${facturaRef.id}`,
        createdAt: now,
      });
    }

    // 3) (Opcional) Restar stock si viene pedido y hay productoId
    if (parsed.restarStock) {
      for (const it of parsed.items) {
        if (!it.productoId) continue;
        const pRef = adminDb.collection("productos").doc(it.productoId);
        batch.update(pRef, {
          stock: FieldValue.increment(-Number(it.qty || 0)),
          updatedAt: now,
        });
      }
    }

    await batch.commit();

    return NextResponse.json({ ok: true, id: facturaRef.id, total }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/facturas error:", err);

    if (err?.issues) {
      return NextResponse.json(
        { ok: false, error: "Datos invÃ¡lidos", issues: err.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}
