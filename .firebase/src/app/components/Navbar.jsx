"use client";

import Link from "next/link";
import Logo from "./Logo";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden text-sm text-gray-300 sm:block">
            Arquitectura de tus operaciones
          </span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#modulos" className="nav-link">Módulos</a>
          <a href="#contacto" className="nav-link">Contacto</a>
          <Link href="/(auth)/login" className="btn-ghost">Login</Link>
          <Link href="/(auth)/login" className="btn-primary">Probar demo</Link>
        </nav>

        <Link href="/(auth)/login" className="md:hidden btn-primary">
          Demo
        </Link>
      </div>
    </header>
  );
}

