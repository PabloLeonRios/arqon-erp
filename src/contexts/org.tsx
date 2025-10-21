"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type OrgCtx = {
  orgId: string | null;
  orgName: string | null;
  setOrg: (id: string, name: string) => void;
  clearOrg: () => void;
  ready: boolean;
};

const Ctx = createContext<OrgCtx>({
  orgId: null,
  orgName: null,
  setOrg: () => {},
  clearOrg: () => {},
  ready: false,
});

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const id = localStorage.getItem("arqon.orgId");
      const name = localStorage.getItem("arqon.orgName");
      if (id) setOrgId(id);
      if (name) setOrgName(name);
    } catch {}
    setReady(true);
  }, []);

  const setOrg = (id: string, name: string) => {
    setOrgId(id);
    setOrgName(name);
    try {
      localStorage.setItem("arqon.orgId", id);
      localStorage.setItem("arqon.orgName", name);
    } catch {}
  };

  const clearOrg = () => {
    setOrgId(null);
    setOrgName(null);
    try {
      localStorage.removeItem("arqon.orgId");
      localStorage.removeItem("arqon.orgName");
    } catch {}
  };

  const value = useMemo(() => ({ orgId, orgName, setOrg, clearOrg, ready }), [orgId, orgName, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrg() {
  return useContext(Ctx);
}
