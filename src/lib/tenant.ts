// src/lib/tenant.ts
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export class HttpError extends Error {
  status: number;
  details?: any;
  constructor(status: number, message: string, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function getOrgIdFrom(req: Request): string | null {
  const h = req.headers.get("x-org-id")?.trim();
  if (h) return h;
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("orgId")?.trim();
    if (q) return q;
  } catch {}
  return null;
}

function getBearerFrom(req: Request): string | null {
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
}

/**
 * Verifica:
 * - Authorization: Bearer <idToken>
 * - x-org-id: <orgId>  (o ?orgId=)
 * - Membresía en orgs/{orgId}/users/{uid} y org activa
 */
export async function getAuthedContext(req: Request) {
  const orgId = getOrgIdFrom(req);
  if (!orgId) {
    throw new HttpError(400, "Falta orgId (header x-org-id o query ?orgId=)");
  }

  const tokenStr = getBearerFrom(req);
  if (!tokenStr) {
    throw new HttpError(401, "Falta Authorization: Bearer <idToken>");
  }

  // Validar token de Firebase
  let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
  try {
    decoded = await adminAuth.verifyIdToken(tokenStr);
  } catch (e) {
    throw new HttpError(401, "Token inválido o vencido");
  }

  const uid = decoded.uid;

  // Verificar organización existe
  const orgRef = adminDb.collection("orgs").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpError(404, "Organización no encontrada");
  }
  if (orgSnap.data()?.active === false) {
    throw new HttpError(403, "Organización desactivada");
  }

  // Verificar membresía activa
  const membRef = orgRef.collection("users").doc(uid);
  const memb = await membRef.get();
  if (!memb.exists || memb.data()?.active === false) {
    throw new HttpError(403, "No sos miembro activo de esta organización");
  }

  const role = (memb.data()?.role as string) || "user";

  return {
    uid,
    email: decoded.email ?? null,
    role,
    orgId,
    orgRef,
    membershipRef: membRef,
    token: decoded,
  };
}
