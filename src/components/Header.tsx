"use client";

import { usePathname, useRouter } from "next/navigation";

const TITULOS: Record<string, string> = {
  "/": "Nueva venta a credito",
  "/ventas": "Ventas",
  "/plazos": "Plazos",
};

function titulo(path: string): string {
  if (path.startsWith("/ventas/") && path.endsWith("/factura")) return "Factura";
  if (path.startsWith("/ventas/")) return "Cuentas a cobrar";
  return TITULOS[path] ?? "GQG System";
}

export default function Header({ usuario }: { usuario: string }) {
  const path = usePathname();
  const router = useRouter();

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="z-10 flex h-14 w-full items-center justify-between border-b border-outline-variant bg-surface-lowest px-margin">
      <div className="flex items-center gap-md">
        <span className="font-display text-headline-md font-extrabold tracking-tight text-primary">
          GQG System
        </span>
        <div className="mx-sm h-6 w-px bg-outline-variant" />
        <h1 className="font-headline-sm text-headline-sm text-primary">{titulo(path)}</h1>
      </div>
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-xs text-secondary">
          <span className="material-symbols-outlined text-base">account_circle</span>
          <span className="font-body-md text-body-md">{usuario}</span>
        </div>
        <button
          onClick={salir}
          className="rounded border border-outline-variant px-md py-1 font-label-caps text-label-caps text-primary transition-colors hover:bg-surface-container"
        >
          SALIR
        </button>
      </div>
    </header>
  );
}
