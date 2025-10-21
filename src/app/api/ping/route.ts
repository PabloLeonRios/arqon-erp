import { NextResponse } from "next/server";

// Importante para Firebase Hosting + SSR
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    ok: true,
    ts: new Date().toISOString(),
    msg: "pong"
  });
}
