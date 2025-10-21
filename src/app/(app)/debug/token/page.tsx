"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useOrg } from "@/contexts/org";

export default function DebugTokenPage() {
  const { orgId, orgName } = useOrg();
  const [token, setToken] = useState<string>("");
  const [result, setResult] = useState<string>("");

  async function refreshToken() {
    const u = auth.currentUser;
    if (!u) {
      setToken("No hay usuario logueado");
      return;
    }
    const t = await u.getIdToken(true);
    setToken(t);
  }

  async function probarEndpoint() {
    setResult("Llamando…");
    try {
      const res = await fetch(`/api/_debug/tenant?orgId=${encodeURIComponent(orgId || "")}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-org-id": orgId || "",
        },
      });
      const j = await res.json();
      setResult(JSON.stringify(j, null, 2));
    } catch (e: any) {
      setResult(e.message || "Error llamando al endpoint");
    }
  }

  useEffect(() => {
    refreshToken();
  }, []);

  return (
    <main className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Debug · Token & Tenancy</h1>

      <div className="text-sm text-neutral-300">
        <div>Org actual: <b>{orgName || "(sin org)"}</b> · <code>{orgId || "—"}</code></div>
      </div>

      <div className="space-y-2">
        <button
          className="rounded-md border border-neutral-700 px-3 py-2"
          onClick={refreshToken}
        >
          Refrescar token
        </button>
        <textarea
          className="w-full h-40 rounded-md bg-neutral-950 p-3 text-xs"
          value={token}
          readOnly
        />
      </div>

      <div className="space-y-2">
        <button
          className="rounded-md bg-emerald-600 px-4 py-2"
          onClick={probarEndpoint}
          disabled={!token || !orgId}
        >
          Probar /api/_debug/tenant
        </button>
        <pre className="w-full rounded-md bg-neutral-950 p-3 text-xs overflow-auto">
{result || "Sin resultados…"}
        </pre>
      </div>
    </main>
  );
}
