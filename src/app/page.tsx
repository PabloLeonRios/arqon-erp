'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

/**
 * Login con:
 * - Logo PNG (public/arqon/logo.png)
 * - Carrusel simple de imágenes (public/slides/*.png)
 * - CTA: Ir al Panel (/panel)
 *
 * Tailwind: usa clases estándar (no depende de nada externo).
 */

export default function HomePage() {
  // Auto–scroll horizontal suave del carrusel (loop simple)
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let frame: number;
    const speed = 0.5; // px por frame (ajustable)
    function tick() {
      if (!rail) return;
      rail.scrollLeft += speed;
      // Cuando llega al final, vuelve al inicio para loop simple
      if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1) {
        rail.scrollLeft = 0;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Columna izquierda: logo + título + botones */}
          <div className="flex flex-col gap-6">
            {/* LOGO PNG */}
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12">
                <Image
                  src="/arqon/logo.png"
                  alt="Arqon ERP"
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-semibold leading-tight">Arqon ERP</h1>
                <p className="text-sm text-neutral-300 -mt-1">Arquitectura de tus operaciones</p>
              </div>
            </div>

            <p className="text-neutral-300">
              Suite integrada para Facturación & Tesorería, Inventario & Logística, CRM y Arqon
              Insights. Minimalista, rápida y lista para escalar por cliente (multi-tenant).
            </p>

            <div className="flex flex-wrap gap-2 text-xs text-neutral-300">
              <span className="rounded-full border border-neutral-700 px-2 py-1">Facturación</span>
              <span className="rounded-full border border-neutral-700 px-2 py-1">Tesorería</span>
              <span className="rounded-full border border-neutral-700 px-2 py-1">Inventario</span>
              <span className="rounded-full border border-neutral-700 px-2 py-1">Logística</span>
              <span className="rounded-full border border-neutral-700 px-2 py-1">CRM</span>
              <span className="rounded-full border border-neutral-700 px-2 py-1">Insights</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/panel"
                className="btn btn-primary"
              >
                Entrar al Panel
              </Link>
              <Link
                href="/productos"
                className="btn"
              >
                Ver Productos
              </Link>
            </div>
          </div>

          {/* Columna derecha: carrusel */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-3">
            <div
              ref={railRef}
              className="flex gap-3 overflow-x-auto scroll-smooth no-scrollbar"
            >
              {[
                { src: '/slides/portada.png', alt: 'Portada' },
                { src: '/slides/factura.png', alt: 'Facturación' },
                { src: '/slides/logistica.png', alt: 'Logística' },
                { src: '/slides/insights.png', alt: 'Insights' },
                { src: '/slides/crm.png', alt: 'CRM' },
              ].map((s, i) => (
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
                  <div className="absolute inset-x-0 bottom-0 bg-neutral-950/50 px-3 py-2 text-sm">
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

      {/* Pequeño footer */}
      <div className="px-4 pb-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Arqon ERP — Next.js + Firebase
      </div>
    </main>
  );
}
