"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Boxes, Building2, Receipt, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Navbar from "./components/Navbar";
import Logo from "./components/Logo";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-6 pt-32 pb-20">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial="initial"
          animate="animate"
          variants={fade}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Tecnología de punta
          </div>

          <h1 className="mb-6 text-balance text-4xl font-semibold leading-tight md:text-6xl">
            <span className="text-white">Arquitectura de tus operaciones</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-pretty text-gray-300">
            ERP moderno para empresas que buscan precisión, velocidad y una experiencia internacional.
            Facturación, Tesorería, Inventario, CRM e Insights en una plataforma unificada.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/(auth)/login" className="btn-primary group">
              Comenzar ahora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a href="#modulos" className="btn-ghost">
              Ver módulos
            </a>
          </div>
        </motion.div>

        {/* Decoración 3D simple */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-16 top-24 h-40 w-40 rotate-12 rounded-3xl bg-emerald-500/10 blur-xl" />
          <div className="absolute -right-10 top-40 h-64 w-64 -rotate-6 rounded-3xl bg-emerald-500/10 blur-xl" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Feature
            icon={<ShieldCheck className="h-5 w-5 text-emerald-300" />}
            title="Seguro & Escalable"
            desc="Arquitectura cloud, despliegues en Vercel y datos listos para crecer sin fricción."
          />
          <Feature
            icon={<BarChart3 className="h-5 w-5 text-emerald-300" />}
            title="Insights accionables"
            desc="Tableros claros para tomar decisiones en tiempo real."
          />
          <Feature
            icon={<Boxes className="h-5 w-5 text-emerald-300" />}
            title="UX internacional"
            desc="Interfaz pulida, rápida y consistente para equipos exigentes."
          />
        </div>
      </section>

      {/* MÓDULOS */}
      <section id="modulos" className="mx-auto max-w-7xl px-6 pb-28">
        <h2 className="mb-6 text-2xl font-semibold md:text-3xl">Módulos principales</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Module
            icon={<Receipt className="h-5 w-5 text-emerald-300" />}
            title="Facturación"
            desc="Emisión ágil, comprobantes electrónicos y control de estados."
          />
          <Module
            icon={<Building2 className="h-5 w-5 text-emerald-300" />}
            title="Tesorería"
            desc="Caja, bancos y conciliaciones con visión unificada."
          />
          <Module
            icon={<BarChart3 className="h-5 w-5 text-emerald-300" />}
            title="Arqon Insights"
            desc="Tableros personalizables y métricas clave."
          />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a href="/(auth)/login" className="btn-primary">
            Probar demo
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#contacto" className="btn-ghost">
            Hablar con nosotros
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span>© {new Date().getFullYear()} Arqon ERP</span>
          </div>
          <div className="flex items-center gap-6">
            <a className="hover:text-white" href="#">Privacidad</a>
            <a className="hover:text-white" href="#">Términos</a>
          </div>
        </div>
      </footer>
    </>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
          {icon}
        </div>
        <h3 className="text-white">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-gray-300">{desc}</p>
    </motion.div>
  );
}

function Module({ icon, title, desc }) {
  return (
    <motion.div
      className="card card-hover"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
          {icon}
        </div>
        <h3 className="text-white">{title}</h3>
      </div>
      <p className="mb-5 text-sm leading-relaxed text-gray-300">{desc}</p>
      <button className="btn-ghost text-sm">Ver más</button>
    </motion.div>
  );
}
