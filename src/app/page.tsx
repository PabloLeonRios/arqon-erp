import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="w-full max-w-6xl mx-4 md:mx-8 flex flex-col md:flex-row gap-0 md:gap-8">
        {/* COLUMNA IZQUIERDA: HERO CON IMAGEN */}
        <div className="relative w-full md:w-3/5 h-[360px] md:h-[440px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-900">
          <Image
            src="/Slide2.png" // Inventario & Logística
            alt="Inventario & Logística"
            fill
            priority
            className="object-cover"
          />

          {/* Degradado para hacer legible el texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />

          {/* Logo y marca arriba a la izquierda */}
          <div className="absolute top-5 left-6 flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-2xl bg-slate-950/80 ring-2 ring-cyan-400/80 overflow-hidden flex items-center justify-center">
              <Image
                src="/logo-arqon.png"
                alt="Arqon ERP"
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-cyan-100">
                Arqon ERP
              </p>
              <p className="text-[11px] text-cyan-100/80">
                Arquitectura de tus operaciones
              </p>
            </div>
          </div>

          {/* Texto del módulo + puntitos abajo */}
          <div className="absolute bottom-8 left-6 right-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300 mb-2">
              Inventario & Logística
            </p>
            <p className="text-sm md:text-base text-slate-50 drop-shadow">
              Stock visible, entregas a tiempo.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 bg-slate-500/80 rounded-full" />
              <span className="h-2 w-6 bg-cyan-400 rounded-full" />
              <span className="h-2 w-2 bg-slate-500/80 rounded-full" />
              <span className="h-2 w-2 bg-slate-500/80 rounded-full" />
              <span className="h-2 w-2 bg-slate-500/80 rounded-full" />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: LOGIN */}
        <div className="w-full md:w-2/5 mt-6 md:mt-0">
          <div className="h-full rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-7 py-8 shadow-[0_0_40px_rgba(8,47,73,0.7)] flex flex-col">
            {/* Logo con glow arriba */}
            <div className="flex justify-center mb-6">
              <div className="relative h-14 w-14 rounded-2xl bg-slate-950 ring-2 ring-cyan-400 shadow-[0_0_35px_rgba(34,211,238,0.75)] overflow-hidden flex items-center justify-center">
                <Image
                  src="/logo-arqon.png"
                  alt="Arqon ERP"
                  fill
                  className="object-contain p-1"
                />
              </div>
            </div>

            <header className="mb-6 text-center">
              <p className="text-[11px] font-semibold tracking-[0.25em] text-cyan-300 mb-2">
                PANEL ARQON
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-1">
                Iniciar sesión
              </h1>
              <p className="text-sm text-slate-400">
                Accedé a tu cuenta para continuar con tus operaciones.
              </p>
            </header>

            <form className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                  placeholder="tu@empresa.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  className="w-full rounded-xl bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                  placeholder="••••••••"
                />
              </div>

              {/* Mantener sesión + Olvidaste tu contraseña */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-600 bg-slate-900 text-cyan-400"
                  />
                  <span>Mantener sesión iniciada</span>
                </label>
                <button
                  type="button"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300 transition"
              >
                Entrar al ERP
              </button>
            </form>

            <p className="mt-4 text-[11px] text-slate-500 text-center">
              Soporte 24/7 · Infraestructura segura · Optimizado para LatAm
            </p>

            <p className="mt-2 text-[11px] text-slate-500 text-center">
              Demo interna. Mientras tanto, podés acceder directamente a{" "}
              <Link href="/venta" className="text-cyan-300 underline">
                Venta mostrador
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
