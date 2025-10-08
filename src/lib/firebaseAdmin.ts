// src/lib/firebaseAdmin.ts
import fs from "fs";
import path from "path";
import admin from "firebase-admin";

function readServiceAccountFromEnv() {
  const rel = process.env.FIREBASE_ADMIN_CREDENTIALS_PATH;
  if (!rel) throw new Error("Falta FIREBASE_ADMIN_CREDENTIALS_PATH en .env.local");
  const abs = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(abs)) throw new Error(`No se encontró el archivo de credenciales: ${abs}`);
  const json = fs.readFileSync(abs, "utf8");
  return JSON.parse(json);
}

let app: admin.app.App;

if (admin.apps.length) {
  app = admin.app();
} else {
  const serviceAccount = readServiceAccountFromEnv();
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const adminAuth = admin.auth(app);
export const adminDb   = admin.firestore(app);
