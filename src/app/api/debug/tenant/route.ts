// src/app/api/debug/tenant/route.ts
import { NextResponse } from "next/server";
import { readOrgFromCookies, withOrgCookies } from "@/lib/tenancy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Lee lo que haya en cookies
export async function GET() {
  const { orgId, orgName } = readOrgFromCookies();
  return NextResponse.json({ ok: true, orgId, orgName });
}

// Setea orgId/orgName en cookies (desde el body)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const orgId = String(body?.orgId || "").trim();
  const orgName = String(body?.orgName || "").trim();

  if (!orgId || !orgName) {
    return NextResponse.json(
      { ok: false, error: "orgId y orgName requeridos" },
      { status: 400 }
    );
  }

  const res = NextResponse.json({ ok: true, set: { orgId, orgName } });
  withOrgCookies(res, { orgId, orgName });
  return res;
}
