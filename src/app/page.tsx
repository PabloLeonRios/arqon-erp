"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  // UI state
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  // Mostrar si ya hay sesión (no redirigimos automáticamente para que siempre se vea el login como “carta de presentación”)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setSessionEmail(u?.email ?? null);
    });
    return () => unsub();
  }, []);

  // Slides (deben existir en: /public/slides/)
  const slides = [
    "/slides/portada.png",
    "/slides/factura.png",
    "/slides/logistica.png",
    "/slides/insights.png",
    "/slides/crm.png",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email || !pass) {
      setErr("Completá email y contraseña.");
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, pass);
      router.push("/panel");
    } catch (error: any) {
      // Mensajes amigables
      const code = String(error?.code || "");
      if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
        setErr("Usuario o contraseña inválidos.");
      } else if (code.includes("auth/user-not-found")) {
        setErr("El usuario no existe.");
      } else if (code.includes("auth/too-many-requests")) {
        setErr("Demasiados intentos. Probá en unos minutos.");
      } else {
        setErr("No se pudo iniciar sesión. Revisá los datos.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen h-screen bg-neutral-950 text-neutral-50">
      <div className="h-full grid grid-cols-1 md:grid-cols-2">

        {/* Columna IZQ: Login */}
        <section className="h-full flex flex-col justify-center px-6 sm:px-10 lg:px-16">
          {/* Logo + claim */}
          <div className="flex flex-col items-center mb-8">
            <NextImage
              src="/logo.png"
              alt="Arqon ERP"
              width={220}
              height={80}
              priority
            />
            <p className="mt-2 text-sm tracking-wide text-neutral-400">
              Arquitectura de tus operaciones
            </p>
          </div>

          {/* Si ya hay sesión, mostramos acceso directo */}
          {sessionEmail && (
            <div className="mb-4 rounded-lg border border-emerald-700/30 bg-emerald-900/10 p-3 text-sm">
              Ya estás autenticado como <b>{sessionEmail}</b>.
              <button
                className="ml-2 rounded bg-emerald-600 px-3 py-1 text-sm"
                onClick={() => router.push("/panel")}
              >
                Entrar al panel
              </button>
            </div>
          )}

          <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-4">
            <div>
              <label className="text-sm text-neutral-300">Email</label>
              <input
                className="mt-1 w-full rounded-md bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-emerald-600"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-300">Contraseña</label>
              <input
                className="mt-1 w-full rounded-md bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-emerald-600"
                type="password"
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {err && <p className="text-sm text-red-400">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-emerald-600 py-2 font-medium disabled:opacity-50"
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-500">
            © {new Date().getFullYear()} Arqon ERP
          </p>
        </section>

        {/* Columna DER: Carrusel (sin flechas, sin barras, autoplay) */}
        <section className="relative hidden md:block">
          {/* Imagen activa ocupa todo, sin textos encima */}
          <div className="absolute inset-0">
            <NextImage
              key={idx}
              src={slides[idx]}
              alt="Slide"
              fill
              sizes="50vw"
              className="object-cover"
              priority
            />
          </div>
          {/* Degradado sutil para transición/perfiles muy claros */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </section>
      </div>
    </main>
  );
}
