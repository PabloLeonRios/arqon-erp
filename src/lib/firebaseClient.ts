import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config de tu proyecto NUEVO arqon-erp (pegada de la consola web)
const firebaseConfig = {
  apiKey: "AIzaSyBn_tEKXbH1MODTU-ZX6wI7H6gcrIib0RM",
  authDomain: "arqon-erp.firebaseapp.com",
  projectId: "arqon-erp",
  storageBucket: "arqon-erp.appspot.com", // <-- importante
  messagingSenderId: "100563303537",
  appId: "1:100563303537:web:361ed1c0989e4868c16fd0"
  // measurementId: "G-XXXXXXXXXX" // si la consola te dio uno, podés sumarlo
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
