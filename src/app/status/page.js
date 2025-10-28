export const dynamic = "force-static";

export default function StatusPage() {
  const items = [
    { key: "App", value: "Online ✅" },
    { key: "API", value: "OK" },
    { key: "Base de datos", value: "Config pendiente" },
    { key: "Build", value: process.env.VERCEL ? "Vercel" : "Local" },
  ];

  return (
    <section className="max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-semibold">Status</h1>
      <p className="mt-2 text-[var(--muted)]">Estado del sistema</p>
      <div className="mt-6 space-y-2 text-left">
        {items.map(({ key, value }) => (
          <div key={key} className="flex items-center justify-between border border-neutral-800 rounded-lg px-4 py-3 bg-[#111111]">
            <span className="opacity-80">{key}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}