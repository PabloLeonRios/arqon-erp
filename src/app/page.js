export default function Home() {
  return (
    <section className="text-center">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
        Bienvenido a <span className="text-arqon-emerald">Arqon</span>
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        Plataforma ERP moderna para distribuidores de consumo masivo.
      </p>

      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#121212] p-5 border border-neutral-800 text-left">
          <div className="text-sm uppercase tracking-wide opacity-60">Estado</div>
          <div className="mt-2 text-green-400 font-medium">OK · Online</div>
        </div>
        <div className="rounded-xl bg-[#121212] p-5 border border-neutral-800 text-left">
          <div className="text-sm uppercase tracking-wide opacity-60">Entorno</div>
          <div className="mt-2">Producción (starter)</div>
        </div>
        <div className="rounded-xl bg-[#121212] p-5 border border-neutral-800 text-left">
          <div className="text-sm uppercase tracking-wide opacity-60">Próximos pasos</div>
          <div className="mt-2">Auth · Multi-empresa · Importadores</div>
        </div>
      </div>
    </section>
  );
}