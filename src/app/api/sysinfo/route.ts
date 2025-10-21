// src/app/api/sysinfo/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function listDir(p: string, acc: string[] = [], base = p) {
  try {
    const items = fs.readdirSync(p, { withFileTypes: true });
    for (const it of items) {
      const abs = path.join(p, it.name);
      const rel = path.relative(base, abs).replace(/\\/g, "/");
      acc.push((it.isDirectory() ? "DIR " : "FILE") + "  " + rel);
      if (it.isDirectory()) listDir(abs, acc, base);
    }
  } catch (e) {
    acc.push("ERR  " + p + " -> " + (e as any)?.message);
  }
  return acc;
}

export async function GET() {
  const cwd = process.cwd();
  const appApi = path.join(cwd, "src", "app", "api");
  const existsApp = fs.existsSync(path.join(cwd, "src", "app"));
  const existsApi = fs.existsSync(appApi);

  const tree = existsApi ? listDir(appApi) : ["(no existe src/app/api)"];
  return NextResponse.json({
    ok: true,
    cwd,
    existsApp,
    existsApi,
    apiTree: tree,
  });
}
