// src/lib/firebaseAdmin.ts
import { readFileSync } from "fs";
import path from "path";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const credPath =
    process.env.FIREBASE_ADMIN_CREDENTIALS_PATH ||
    path.join(process.cwd(), "secrets", "firebase-admin.json");
  const serviceAccount = JSON.parse(readFileSync(credPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
