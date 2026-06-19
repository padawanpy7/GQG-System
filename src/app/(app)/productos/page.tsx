"use client";

import { useEffect, useState } from "react";

type Producto = {
  codbarra: string;
  productoid: number;
  producto: string;
  iva: number;
  servicio: number;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [f, setF] = useState({ producto: "", codbarra: "", iva: "10", servicio: "0" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function cargar() {
    void fetch("/api/productos").then((r) => r.json()).then(setProductos);
  }
  useEffect(cargar, []);

  function set(k: keyof typeof f, v: string) {
    setF((x) => ({ ...x, [k]: v }));
  }

  async function crear() {
    if (!f.producto.trim()) return setError("El nombre es obligatorio");
    if (!f.codbarra.trim()) return setError("El codigo de barra es obligatorio");
    setBusy(true);
    setError(null);
    const r = await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        producto: f.producto,
        codbarra: f.codbarra,
        iva: Number(f.iva),
        servicio: Number(f.servicio),
      }),
    });
    if (r.ok) {
      setF({ producto: "", codbarra: "", iva: "10", servicio: "0" });
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo crear el producto");
    }
    setBusy(false);
  }

  const inputCls =
    "h-10 w-full rounded border border-outline-variant bg-transparent px-md font-body-md text-body-md text-primary outline-none focus:border-primary";

  return (
    <div className="mx-auto grid max-w-[1100px] grid-cols-12 gap-xl">
      <div className="col-span-12 lg:col-span-7">
        <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
          <div className="flex items-center gap-xs border-b border-outline-variant p-lg">
            <span className="material-symbols-outlined text-primary">inventory_2</span>
            <h2 className="font-headline-sm text-headline-sm text-primary">Productos</h2>
          </div>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container">
                <th className="px-md py-sm font-label-caps text-label-caps text-secondary">PRODUCTO</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-secondary">COD. BARRA</th>
                <th className="px-md py-sm text-center font-label-caps text-label-caps text-secondary">IVA</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-secondary">TIPO</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-md py-lg font-body-sm text-body-sm text-secondary">
                    No hay productos todavia.
                  </td>
                </tr>
              ) : (
                productos.map((p) => (
                  <tr key={p.codbarra} className="border-b border-outline-variant">
                    <td className="px-md py-md font-body-md text-body-md text-primary">{p.producto}</td>
                    <td className="px-md py-md font-tabular-num text-tabular-num text-secondary">{p.codbarra}</td>
                    <td className="px-md py-md text-center font-tabular-num text-tabular-num text-secondary">{p.iva}%</td>
                    <td className="px-md py-md font-body-md text-body-md text-secondary">
                      {p.servicio === 1 ? "Servicio" : "Mercaderia"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      <div className="col-span-12 lg:col-span-5">
        <section className="rounded-lg border border-outline-variant bg-surface-lowest p-lg">
          <div className="mb-lg font-headline-sm text-headline-sm text-primary">Nuevo producto</div>
          <div className="space-y-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-secondary">NOMBRE</label>
              <input className={inputCls} value={f.producto} onChange={(e) => set("producto", e.target.value)} />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-secondary">CODIGO DE BARRA</label>
              <input className={inputCls} value={f.codbarra} onChange={(e) => set("codbarra", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-secondary">IVA</label>
                <select className={inputCls} value={f.iva} onChange={(e) => set("iva", e.target.value)}>
                  <option value="10">10%</option>
                  <option value="5">5%</option>
                  <option value="0">Exento</option>
                </select>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-secondary">TIPO</label>
                <select className={inputCls} value={f.servicio} onChange={(e) => set("servicio", e.target.value)}>
                  <option value="0">Mercaderia</option>
                  <option value="1">Servicio</option>
                </select>
              </div>
            </div>
          </div>
          {error && <p className="mt-md font-body-sm text-body-sm text-error">{error}</p>}
          <button
            onClick={crear}
            disabled={busy || !f.producto.trim() || !f.codbarra.trim()}
            className="mt-lg h-10 w-full rounded bg-primary px-xl font-label-caps text-label-caps font-bold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50"
          >
            {busy ? "GUARDANDO..." : "CREAR PRODUCTO"}
          </button>
        </section>
      </div>
    </div>
  );
}
