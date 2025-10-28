'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function HomePage() {
  // Auto–scroll horizontal suave del carrusel (loop simple)
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let frame: number;
    const speed = 0.7; // px por frame (podés subirlo/bajarlo)
    const tick = () => {
      if (!rail) return;
      rail.scrollLeft += speed;
      if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1) {
        rail.scrollLeft = 0; // loop
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const slides = [
    { src: '/slides/portada.png',   alt: 'Portada' },
    { src: '/slides/factura.png',   alt: 'Facturación & Tesorería' },
    { src: '/slides/logistica.png', alt: 'Inventario & Logística' },
    { src: '/slides/insights.png',  alt: 'Arqon Insights' },
    { src: '/slides/crm.png',       alt: 'CRM' },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">

          {/* IZQUIERDA: logo + textos + CTAs */}
          <div className="flex flex-col gap-6">
            {/* LOGO PNG más grande */}
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 md:h-20 md:w-20">
                <Image
                  src="/arqon/logo.png"     // <- PNG en public/arqon/logo.png
                  alt="Arqon ERP"
                  fill
                  sizes="80px"
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-4xl font-semibold leading-tight">Arqon ERP</h1>
                <p className="mt-1 text-sm text-neutral-300">Arquitectura de tus operaciones</p>
              </div>
            </div>

            <p className="text-lg text-neutral-200">
              Suite integrada para Facturación & Tesorería, Inventario & Logística, CRM y Arqon
              Insights. Minimalista, rápida y lista para escalar.
            </p>

            <div className="flex flex-wrap gap-2 text-xs text-neutral-300">
              {['Facturación', 'Tesorería', 'Inventario', 'Logística', 'CRM', 'Insights'].map(x => (
                <span key={x} className="rounded-full border border-neutral-700 px-3 py-1">
                  {x}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link href="/panel" className="btn btn-primary">Entrar al Panel</Link>
              <Link href="/productos" className="btn">Ver Productos</Link>
            </div>
          </div>

          {/* DERECHA: carrusel horizontal */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-3">
            <div
              ref={railRef}
              className="flex gap-3 overflow-x-auto scroll-smooth no-scrollbar"
            >
              {slides.map((s, i) => (
                <div
                  key={s.src}
                  className="relative h-64 w-[480px] flex-shrink-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-800"
                >
                  <Image
                    src={s.src}             // <- RUTA CORRECTA: /slides/*.png
                    alt={s.alt}
                    fill
                    sizes="480px"
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

      <div className="px-6 pb-10 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Arqon ERP — Next.js + Firebase
      </div>
    </main>
  );
}
