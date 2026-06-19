"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", icon: "payments", label: "Nueva venta", desc: "Cargar venta y generar cuotas" },
  { href: "/ventas", icon: "receipt_long", label: "Ventas", desc: "Facturas emitidas y sus cuotas" },
  { href: "/clientes", icon: "group", label: "Clientes", desc: "Alta y datos de clientes" },
  { href: "/productos", icon: "inventory_2", label: "Productos", desc: "Catalogo y precios de venta" },
  { href: "/plazos", icon: "calendar_month", label: "Plazos", desc: "Condiciones de pago en cuotas" },
  { href: "/depositos", icon: "warehouse", label: "Depositos", desc: "Sucursales y almacenes" },
  { href: "/empresa", icon: "storefront", label: "Empresa", desc: "Datos del emisor de la factura" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="flex h-full w-16 flex-col gap-xs overflow-y-auto border-r border-outline-variant bg-surface-bright px-xs py-lg lg:w-64 lg:px-sm">
      <span className="hidden px-sm pb-xs font-label-caps text-label-caps text-secondary lg:block">
        MENU
      </span>
      {ITEMS.map((it) => {
        const activo = it.href === "/" ? path === "/" : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            title={it.label}
            className={`flex items-center justify-center gap-sm rounded-lg p-sm transition-colors lg:justify-start ${
              activo
                ? "bg-primary-fixed text-on-primary-fixed"
                : "text-secondary hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined shrink-0">{it.icon}</span>
            <span className="hidden min-w-0 flex-col lg:flex">
              <span
                className={`font-body-md text-body-md font-semibold leading-tight ${
                  activo ? "text-on-primary-fixed" : "text-primary"
                }`}
              >
                {it.label}
              </span>
              <span
                className={`truncate font-body-sm text-body-sm leading-tight ${
                  activo ? "text-on-primary-fixed/70" : "text-secondary"
                }`}
              >
                {it.desc}
              </span>
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
