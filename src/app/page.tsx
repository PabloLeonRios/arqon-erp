'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

/**
 * Home / Login simple
 * - Logo: /public/logo.png
 * - Carrusel: /public/{portada,factura,logistica,insights,crm}.png
 * - Layout dark, botones Tailwind puros
 */

export default function HomePage() {
  // Carrusel: auto-scroll horizontal muy suave en loop
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let frame = 0;
    const speed = 0.4; // px/frame
    const tick = () => {
      if (!rail) return;
      rail.scrollLeft += speed;
      if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1) {
        rail.scrollLeft = 0;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const slides = [
    { src: '/portada.png', alt: 'Portada' },
    { src: '/factura.png', alt: 'Facturación & Tesorería' },
    { src: '/logistica.png', alt: 'Inventario & Logística' },
    { src: '/insights.png', alt: 'Arqon Insights' },
    { src: '/crm.png', alt: 'CRM' },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          {/* IZQUIERDA: logo + título + formulario / CTAs */}
          <div className="flex flex-col gap-6">
            {/* LOGO PNG (de /public/logo.png) */}
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10">
                <Image
                  src="/logo.png"
                  alt="Arqon ERP"
                  fill
                  sizes="40px"
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-3xl font-semibold leading-tight">Arqon ERP</h1>
                <p className="text-sm text-neutral-300 -mt-1">
                  Arquitectura de tus operaciones
                </p>
              </div>
            </div>

            <p className="text-neutral-300">
              Suite integrada para Facturación & Tesorería, Inventario & Logística, CRM y
              Arqon Insights. Minimalista, rápida y lista para escalar.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 text-xs text-neutral-300">
              {['Facturación', 'Tesorería', 'Inventario', 'Logística', 'CRM', 'Insights'].map(
                (t) => (
                  <span
                    key={t}
                    className="rounded-full border border-neutral-700 px-2 py-1"
                  >
                    {t}
                  </span>
                ),
              )}
            </div>

            {/* Botones */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/panel"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              >
                Entrar al Panel
              </Link>
              <Link
                href="/productos"
                className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-neutral-800/60 focus:outline-none focus:ring-2 focus:ring-neutral-600/60"
              >
                Ver Productos
              </Link>
            </div>
          </div>

          {/* DERECHA: carrusel */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-3">
            <div
              ref={railRef}
              className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth"
            >
              {slides.map((s, i) => (
                <div
                  key={i}
                  className="relative h-64 w-[460px] flex-shrink-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-800"
                >
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    sizes="460px"
                    className="object-cover"
                    priority={i === 0}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-neutral-950/55 px-3 py-2 text-sm">
                    {s.alt}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-xs text-neutral-400">
              Tip: arrastrá con el mouse para deslizar las vistas.
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 pb-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Arqon ERP — Next.js + Firebase
      </footer>
    </main>
  );
}
