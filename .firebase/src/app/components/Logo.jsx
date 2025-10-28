export default function Logo({ size = "md" }) {
  const cls = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  return (
    <div className="flex items-center gap-2">
      <img src="/logo.png" alt="Arqon" className={cls} />
      <span className="text-white">Arqon ERP</span>
    </div>
  );
}

