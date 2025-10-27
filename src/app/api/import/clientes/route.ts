// src/app/api/import/clientes/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { CustomerSchema } from "@/types/customer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// --- utils ---
const s = (v: any) => {
  const t = (v ?? "").toString().trim();
  return t.length ? t : undefined;
};
const b = (v: any) => {
  if (typeof v === "boolean") return v;
  const t = (v ?? "").toString().trim().toLowerCase();
  if (["true", "1", "si", "sÃ­", "yes", "activo", "habilitado"].includes(t)) return true;
  if (["false", "0", "no", "not", "inactivo", "deshabilitado"].includes(t)) return false;
  return undefined;
};
const n = (v: any) => {
  const num = Number(v);
  return Number.isFinite(num) ? num : undefined;
};
function allow(raw: any) {
  return {
    doc: s(raw?.doc),
    nombre: s(raw?.nombre),
    fantasia: s(raw?.fantasia),
    email: s(raw?.email),
    telefono: s(raw?.telefono),
    direccion: s(raw?.direccion),
    localidad: s(raw?.localidad),
    provincia: s(raw?.provincia),
    condIva: s(raw?.condIva) as any, // valida Zod
    bonifPct: n(raw?.bonifPct),
    notas: s(raw?.notas),
    activo: b(raw?.activo),
  };
}
function stripUndef<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}
function uniq<T>(arr: T[]) { return Array.from(new Set(arr)); }
async function fetchExistingByIn(
  field: "doc" | "email",
  values: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const chunks: string[][] = [];
  const vals = uniq(values.filter(Boolean));
  for (let i = 0; i < vals.length; i += 30) chunks.push(vals.slice(i, i + 30));
  for (const chunk of chunks) {
    if (!chunk.length) continue;
    const snap = await adminDb.collection("clientes").where(field, "in", chunk).get();
    for (const d of snap.docs) {
      const data = d.data() || {};
      const key = (data[field] || "").toString();
      if (key) map.set(key, d.id);
    }
  }
  return map;
}

/**
 * POST /api/import/clientes
 * Body JSON:
 * {
 *   upsert: true,                 // recomendado
 *   defaultActivo?: boolean,      // opcional (por defecto true en creates)
 *   items: [
 *     { doc?, nombre?, fantasia?, email?, telefono?, direccion?, localidad?, provincia?,
 *       condIva?, bonifPct?, notas?, activo? }
 *   ]
 * }
 *
 * PolÃ­tica:
 * - Si existe doc â†’ update por doc
 * - Si NO existe doc pero existe email â†’ update por email
 * - Si no existe ninguno â†’ create (requiere nombre)
 * - Limpieza de undefined para Firestore
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const upsert = !!body?.upsert;
    const defaultActivo = typeof body?.defaultActivo === "boolean" ? body.defaultActivo : true;

    let rows: any[] = Array.isArray(body?.items) ? body.items : [];
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "Sin items" }, { status: 400 });
    }

    // Normalizamos campos permitidos
    const items = rows.map(allow);

    // Pre-fetch existentes por doc y por email (en batch con "in")
    const docs = uniq(items.map(i => i.doc).filter(Boolean) as string[]);
    const emails = uniq(items.map(i => i.email).filter(Boolean) as string[]);
    const existingDoc = docs.length ? await fetchExistingByIn("doc", docs) : new Map();
    const existingEmail = emails.length ? await fetchExistingByIn("email", emails) : new Map();

    const now = Timestamp.now();
    let inserted = 0, updated = 0, skipped = 0;

    for (let i = 0; i < items.length; i += 400) {
      const pack = items.slice(i, i + 400);
      const batch = adminDb.batch();

      for (const raw of pack) {
        const patch = stripUndef(CustomerSchema.partial().parse(raw));

        // Â¿Existe?
        let targetId: string | undefined;
        if (patch.doc && existingDoc.has(patch.doc)) targetId = existingDoc.get(patch.doc)!;
        else if (patch.email && existingEmail.has(patch.email)) targetId = existingEmail.get(patch.email)!;

        if (targetId && upsert) {
          // UPDATE (merge)
          const ref = adminDb.collection("clientes").doc(targetId);
          batch.set(ref, { ...patch, updatedAt: now }, { merge: true });
          updated++;
          continue;
        }

        // CREATE (requiere nombre)
        if (!patch.nombre) { skipped++; continue; }
        const candidate: any = {
          ...patch,
          activo: patch.activo ?? defaultActivo,
          createdAt: now,
          updatedAt: now,
        };
        // ValidaciÃ³n completa para create
        const parsedCreate = CustomerSchema.parse(candidate);
        const cleanCreate = stripUndef(parsedCreate);

        const ref = adminDb.collection("clientes").doc();
        batch.set(ref, cleanCreate);
        inserted++;
      }

      await batch.commit();
    }

    return NextResponse.json({ ok: true, inserted, updated, skipped, total: items.length }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/import/clientes error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno (import clientes)" },
      { status: 500 }
    );
  }
}
