"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "../../components/Logo";

export default function LoginPage() {
  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 -top-40 mx-auto h-72 w-[60%] rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="mb-6 flex items-center justify-center">
          <Logo />
        </div>

        <h1 className="mb-2 text-center text-xl font-semibold">Bienvenido</h1>
        <p className="mb-6 text-center text-sm text-gray-300">
          Iniciá sesión para continuar.
        </p>

        <form className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="usuario@empresa.com" />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input type="password" className="input" placeholder="••••••••" />
          </div>

        <button type="submit" className="btn-primary w-full">Ingresar</button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-300">
          <span>¿Sin cuenta? </span>
          <Link href="/" className="text-emerald-300 hover:text-emerald-200">
            Solicitar acceso
          </Link>
        </div>
      </motion.div>

      <div className="absolute bottom-6 text-xs text-gray-400">
        © {new Date().getFullYear()} Arqon ERP
      </div>
    </div>
  );
}

