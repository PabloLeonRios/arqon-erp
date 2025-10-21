// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { ORG_COOKIE_ID, ORG_COOKIE_NAME } from "@/lib/tenancy";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Leer cookies y propagar a headers para las APIs
  const orgId = req.cookies.get(ORG_COOKIE_ID)?.value ?? "";
  const orgName = req.cookies.get(ORG_COOKIE_NAME)?.value ?? "";

  if (orgId) {
    res.headers.set("x-org-id", orgId);
    res.headers.set("x-org-name", orgName);
  }
  return res;
}

// Aplica a todo menos estáticos
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|slides|logo|public).*)",
  ],
};
