"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", icon: "payments", label: "Nueva venta" },
  { href: "/ventas", icon: "receipt_long", label: "Ventas" },
  { href: "/clientes", icon: "group", label: "Clientes" },
  { href: "/plazos", icon: "calendar_month", label: "Plazos" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="flex h-full w-16 flex-col items-center gap-lg border-r border-outline-variant bg-surface-bright py-lg">
      {ITEMS.map((it) => {
        const activo = it.href === "/" ? path === "/" : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            title={it.label}
            className={`rounded-lg p-base transition-colors ${
              activo
                ? "bg-primary-fixed text-on-primary-fixed"
                : "text-secondary hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined">{it.icon}</span>
          </Link>
        );
      })}
    </aside>
  );
}
