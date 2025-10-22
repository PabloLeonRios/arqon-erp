import type { ServiceAccount } from "firebase-admin";
import admin from "firebase-admin";

/**
 * Obtiene credenciales del Admin SDK:
 * - Producción (Vercel): env FIREBASE_ADMIN_CREDENTIALS_JSON (JSON en una línea)
 * - Desarrollo local: archivo secrets/firebase-admin.json (si existe)
 */
function getServiceAccount(): ServiceAccount | null {
  // 1) Producción: variable de entorno
  const envJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
  if (envJson) {
    try {
      const parsed = JSON.parse(envJson);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        // Restaurar saltos de línea si vinieron escapados
        privateKey: String(parsed.private_key).replace(/\\n/g, "\n"),
      } as ServiceAccount;
    } catch (e) {
      console.error("FIREBASE_ADMIN_CREDENTIALS_JSON inválida:", e);
    }
  }

  // 2) Desarrollo local: leer secrets/firebase-admin.json si existe
  if (process.env.NODE_ENV !== "production") {
    try {
      // require dinámico para que no se ejecute en build
      const fs = require("fs") as typeof import("fs");
      const path = require("path") as typeof import("path");
      const p = path.join(process.cwd(), "secrets", "firebase-admin.json");
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf8");
        const parsed = JSON.parse(raw);
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key,
        } as ServiceAccount;
      }
    } catch (e) {
      console.warn("No se pudo leer secrets/firebase-admin.json:", e);
    }
  }

  return null;
}

let app: admin.app.App;
if (admin.apps.length) {
  app = admin.app();
} else {
  const sa = getServiceAccount();
  if (!sa) {
    throw new Error(
      "Credenciales de Firebase Admin no configuradas. " +
        "Definí FIREBASE_ADMIN_CREDENTIALS_JSON en Vercel o el archivo secrets/firebase-admin.json en local."
    );
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: process.env.FIREBASE_PROJECT_ID || sa.projectId,
  });
}

export const adminApp = app;
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
