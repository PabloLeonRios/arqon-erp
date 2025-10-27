import React from "react";

export function Card({ title, subtitle, right, children }:{
  title?: string; subtitle?: string; right?: React.ReactNode; children?: React.ReactNode;
}){
  return (
    <section className="card p-5">
      {(title || subtitle || right) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="section-title">{title}</h3>}
            {subtitle && <p className="subtle">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, children, className="" }:{
  label?: string; children: React.ReactNode; className?: string;
}){
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      {label && <span className="text-sm text-text-muted">{label}</span>}
      {children}
    </label>
  );
}

export function Button({ children, variant="solid", className="", ...props }:{
  children: React.ReactNode; variant?: "solid"|"outline"| "ghost"; className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>){
  const base = "btn";
  const cls =
    variant==="outline" ? `${base} outline` :
    variant==="ghost"   ? `${base} ghost`   :
    base;
  return <button className={`${cls} ${className}`} {...props}>{children}</button>
}
