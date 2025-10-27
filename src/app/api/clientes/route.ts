// src/app/api/clientes/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { CustomerSchema } from "@/types/customer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* Utils */
function s(v: any) {
  const t = (v ?? "").toString().trim();
  return t.length ? t : undefined;
}
function b(v: any) {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return undefined;
}
function n(v: any) {
  const num = Number(v);
  return Number.isFinite(num) ? num : undefined;
}
function allowFields(raw: any) {
  return {
    doc: s(raw?.doc),
    nombre: s(raw?.nombre),
    fantasia: s(raw?.fantasia),
    email: s(raw?.email),
    telefono: s(raw?.telefono),
    direccion: s(raw?.direccion),
    localidad: s(raw?.localidad),
    provincia: s(raw?.provincia),
    condIva: s(raw?.condIva),
    bonifPct: n(raw?.bonifPct),
    notas: s(raw?.notas),
    activo: b(raw?.activo),
  };
}
// ðŸ”§ clave: limpiar undefined para Firestore
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as T;
}

/* ---------------- GET ---------------- */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
    const q = (url.searchParams.get("q") || "").toLowerCase().trim();
    const doc = s(url.searchParams.get("doc"));
    const email = s(url.searchParams.get("email"));
    const activoParam = url.searchParams.get("activo");

    let ref: FirebaseFirestore.Query = adminDb.collection("clientes");
    if (doc) ref = ref.where("doc", "==", doc);
    else if (email) ref = ref.where("email", "==", email);
    if (activoParam === "true") ref = ref.where("activo", "==", true);
    if (activoParam === "false") ref = ref.where("activo", "==", false);

    let snap;
    try {
      snap = await ref.orderBy("createdAt", "desc").limit(limit).get();
    } catch {
      snap = await ref.limit(limit).get();
    }

    let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (q) {
      data = data.filter((c: any) => {
        const nombre = (c?.nombre || "").toLowerCase();
        const fantasia = (c?.fantasia || "").toLowerCase();
        const mail = (c?.email || "").toLowerCase();
        const ddoc = (c?.doc || "").toLowerCase();
        return (
          nombre.includes(q) ||
          fantasia.includes(q) ||
          mail.includes(q) ||
          ddoc.includes(q)
        );
      });
    }
    data.sort((a: any, b: any) => {
      const at =
        a?.createdAt?.toMillis?.() ??
        (typeof a?.createdAt === "number" ? a.createdAt : 0);
      const bt =
        b?.createdAt?.toMillis?.() ??
        (typeof b?.createdAt === "number" ? b.createdAt : 0);
      return bt - at;
    });

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("GET /api/clientes error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno (GET clientes)" },
      { status: 500 }
    );
  }
}

/* ---------------- POST ---------------- */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const doUpsert = url.searchParams.get("upsert") === "true";
    const raw = await req.json();
    const now = Timestamp.now();

    // Update directo por id (patch)
    const id = s(raw?.id);
    if (id) {
      const patch = allowFields(raw);
      const parsed = CustomerSchema.partial().parse(patch);
      const clean = stripUndefined(parsed);
      const ref = adminDb.collection("clientes").doc(id);
      await ref.set({ ...clean, updatedAt: now }, { merge: true });
      return NextResponse.json({ ok: true, id }, { status: 200 });
    }

    // Upsert por doc/email
    let existingId: string | null = null;
    const doc = s(raw?.doc);
    const email = s(raw?.email);

    if (doUpsert && (doc || email)) {
      if (doc && !existingId) {
        const s1 = await adminDb
          .collection("clientes")
          .where("doc", "==", doc)
          .limit(1)
          .get();
        if (!s1.empty) existingId = s1.docs[0].id;
      }
      if (email && !existingId) {
        const s2 = await adminDb
          .collection("clientes")
          .where("email", "==", email)
          .limit(1)
          .get();
        if (!s2.empty) existingId = s2.docs[0].id;
      }

      if (existingId) {
        const patch = allowFields(raw);
        const parsed = CustomerSchema.partial().parse(patch);
        const clean = stripUndefined(parsed);
        const ref = adminDb.collection("clientes").doc(existingId);
        await ref.set({ ...clean, updatedAt: now }, { merge: true });
        return NextResponse.json(
          { ok: true, id: existingId, upsert: "updated" },
          { status: 200 }
        );
      }
      // si no existe, cae a creaciÃ³n
    }

    // CreaciÃ³n (validaciÃ³n completa)
    const candidate = allowFields(raw);
    if (candidate.activo === undefined) candidate.activo = true;
    const parsedCreate = CustomerSchema.parse(candidate);
    const cleanCreate = stripUndefined(parsedCreate);

    const ref = adminDb.collection("clientes").doc();
    await ref.set({ ...cleanCreate, createdAt: now, updatedAt: now });
    return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/clientes error:", err);
    if (err?.issues) {
      return NextResponse.json(
        { ok: false, error: "Datos invÃ¡lidos", issues: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno (POST clientes)" },
      { status: 500 }
    );
  }
}
