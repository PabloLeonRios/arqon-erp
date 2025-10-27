// src/lib/tenancy.ts
import { cookies, type RequestCookies } from "next/headers";
import { NextResponse } from "next/server";

export const ORG_COOKIE_ID = "arqon_org_id";
export const ORG_COOKIE_NAME = "arqon_org_name";

export function readOrgFromCookies(
  ck?: RequestCookies | ReturnType<typeof cookies>
) {
  const bag = ck ?? cookies();
  const orgId = bag.get(ORG_COOKIE_ID)?.value || null;
  const orgName = bag.get(ORG_COOKIE_NAME)?.value || null;
  return { orgId, orgName };
}

export function withOrgCookies(
  res: NextResponse,
  org: { orgId: string; orgName: string }
) {
  // 30 dÃ­as
  const maxAge = 60 * 60 * 24 * 30;
  res.cookies.set(ORG_COOKIE_ID, org.orgId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  res.cookies.set(ORG_COOKIE_NAME, org.orgName, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return res;
}
