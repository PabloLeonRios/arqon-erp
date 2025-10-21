// src/lib/orgRequest.ts
import { cookies } from "next/headers";

export function getOrgFromRequest(req: Request) {
  // 1) Primero headers (los setea el middleware)
  // 2) Fallback a cookies (por si llamás desde server-side sin pasar por middleware)
  const h = new Headers(req.headers);
  const orgId = h.get("x-org-id") || cookies().get("arqon_org_id")?.value || "";
  const orgName =
    h.get("x-org-name") || cookies().get("arqon_org_name")?.value || "";
  return { orgId, orgName };
}

export function requireOrg(req: Request) {
  const { orgId, orgName } = getOrgFromRequest(req);
  if (!orgId) throw new Error("Organización no seleccionada");
  return { orgId, orgName };
}
