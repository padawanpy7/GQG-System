"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

type Confirmacion = {
  title: string;
  message: string;
  label: string;
  icon: string;
  danger: boolean;
  run: () => Promise<void>;
};

type Producto = {
  codbarra: string;
  productoid: number;
  producto: string;
  iva: number;
  servicio: number;
  precio: number;
  activo: number;
};

const gs = (n: number) => Math.round(n).toLocaleString("es-PY");
const VACIO = { producto: "", codbarra: "", iva: "10", servicio: "0", precio: "" };

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [f, setF] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  function cargar() {
    void fetch("/api/productos?inactivos=1").then((r) => r.json()).then(setProductos);
  }
  useEffect(cargar, []);

  function set(k: keyof typeof f, v: string) {
    setF((x) => ({ ...x, [k]: v }));
  }

  function editar(p: Producto) {
    setEditId(p.productoid);
    setError(null);
    setF({
      producto: p.producto,
      codbarra: p.codbarra,
      iva: String(p.iva),
      servicio: String(p.servicio),
      precio: p.precio ? String(Math.round(p.precio)) : "",
    });
  }

  function cancelar() {
    setEditId(null);
    setF(VACIO);
    setError(null);
  }

  async function guardar() {
    if (!f.producto.trim()) return setError("El nombre es obligatorio");
    if (!editId && !f.codbarra.trim()) return setError("El codigo de barra es obligatorio");
    setBusy(true);
    setError(null);
    const r = await fetch(editId ? `/api/productos/${editId}` : "/api/productos", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        producto: f.producto,
        codbarra: f.codbarra,
        iva: Number(f.iva),
        servicio: Number(f.servicio),
        precio: Number(f.precio) || 0,
      }),
    });
    if (r.ok) {
      cancelar();
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo guardar el producto");
    }
    setBusy(false);
  }

  function pedirDesactivar(p: Producto) {
    setConfirmacion({
      title: "Desactivar producto",
      message: `"${p.producto}" no aparecera en nuevas ventas. Podes reactivarlo despues.`,
      label: "Desactivar",
      icon: "block",
      danger: true,
      run: async () => {
        const r = await fetch(`/api/productos/${p.productoid}`, { method: "DELETE" });
        if (r.ok) {
          if (editId === p.productoid) cancelar();
          cargar();
        } else {
          const d = await r.json().catch(() => ({}));
          setError(d.error || "No se pudo desactivar el producto");
        }
      },
    });
  }

  function pedirReactivar(p: Producto) {
    setConfirmacion({
      title: "Reactivar producto",
      message: `"${p.producto}" volvera a estar disponible en las ventas.`,
      label: "Reactivar",
      icon: "check_circle",
      danger: false,
      run: async () => {
        const r = await fetch(`/api/productos/${p.productoid}`, { method: "PATCH" });
        if (r.ok) cargar();
        else {
          const d = await r.json().catch(() => ({}));
          setError(d.error || "No se pudo reactivar el producto");
        }
      },
    });
  }

  async function ejecutarConfirmacion() {
    if (!confirmacion) return;
    setConfirmBusy(true);
    await confirmacion.run();
    setConfirmBusy(false);
    setConfirmacion(null);
  }

  const inputCls =
    "h-10 w-full rounded border border-outline-variant bg-transparent px-md font-body-md text-body-md text-primary outline-none focus:border-primary disabled:opacity-60";

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
                <th className="px-md py-sm text-right font-label-caps text-label-caps text-secondary">PRECIO</th>
                <th className="px-md py-sm text-center font-label-caps text-label-caps text-secondary">IVA</th>
                <th className="px-md py-sm text-right font-label-caps text-label-caps text-secondary">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-md py-lg font-body-sm text-body-sm text-secondary">
                    No hay productos todavia.
                  </td>
                </tr>
              ) : (
                productos.map((p) => {
                  const inactivo = p.activo === 0;
                  return (
                    <tr
                      key={p.codbarra}
                      className={`border-b border-outline-variant ${
                        editId === p.productoid ? "bg-secondary-container/40" : inactivo ? "opacity-55" : ""
                      }`}
                    >
                      <td className="px-md py-md font-body-md text-body-md text-primary">
                        <span className="flex items-center gap-xs">
                          {p.producto}
                          {inactivo && (
                            <span className="rounded bg-surface-container px-1.5 py-0.5 font-label-caps text-label-caps text-secondary">
                              INACTIVO
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-md py-md font-tabular-num text-tabular-num text-secondary">{p.codbarra}</td>
                      <td className="px-md py-md text-right font-tabular-num text-tabular-num text-primary">{gs(p.precio)}</td>
                      <td className="px-md py-md text-center font-tabular-num text-tabular-num text-secondary">{p.iva}%</td>
                      <td className="px-md py-md">
                        <div className="flex justify-end gap-xs">
                          {inactivo ? (
                            <button
                              onClick={() => pedirReactivar(p)}
                              title="Activar"
                              className="flex items-center justify-center rounded p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-ok"
                            >
                              <span className="material-symbols-outlined text-base">check_circle</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => editar(p)}
                                title="Editar"
                                className="flex items-center justify-center rounded p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button
                                onClick={() => pedirDesactivar(p)}
                                title="Desactivar"
                                className="flex items-center justify-center rounded p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-error"
                              >
                                <span className="material-symbols-outlined text-base">block</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>

      <div className="col-span-12 lg:col-span-5">
        <section className="rounded-lg border border-outline-variant bg-surface-lowest p-lg">
          <div className="mb-lg font-headline-sm text-headline-sm text-primary">
            {editId ? "Editar producto" : "Nuevo producto"}
          </div>
          <div className="space-y-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-secondary">NOMBRE</label>
              <input className={inputCls} value={f.producto} onChange={(e) => set("producto", e.target.value)} />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-secondary">
                CODIGO DE BARRA{editId ? " (no editable)" : ""}
              </label>
              <input
                className={inputCls}
                value={f.codbarra}
                disabled={editId !== null}
                onChange={(e) => set("codbarra", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-secondary">PRECIO (Gs)</label>
              <input
                className={`${inputCls} text-right font-tabular-num text-tabular-num`}
                inputMode="numeric"
                placeholder="0"
                value={f.precio ? Number(f.precio).toLocaleString("es-PY") : ""}
                onChange={(e) => set("precio", e.target.value.replace(/\D/g, ""))}
              />
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
          <div className="mt-lg flex gap-md">
            {editId && (
              <button
                onClick={cancelar}
                className="h-10 rounded border border-outline-variant px-xl font-label-caps text-label-caps text-primary transition-colors hover:bg-surface-container"
              >
                CANCELAR
              </button>
            )}
            <button
              onClick={guardar}
              disabled={busy || !f.producto.trim() || (!editId && !f.codbarra.trim())}
              className="h-10 flex-1 rounded bg-primary px-xl font-label-caps text-label-caps font-bold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50"
            >
              {busy ? "GUARDANDO..." : editId ? "GUARDAR CAMBIOS" : "CREAR PRODUCTO"}
            </button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmacion !== null}
        title={confirmacion?.title ?? ""}
        message={confirmacion?.message}
        icon={confirmacion?.icon}
        confirmLabel={confirmacion?.label}
        danger={confirmacion?.danger}
        busy={confirmBusy}
        onConfirm={ejecutarConfirmacion}
        onClose={() => setConfirmacion(null)}
      />
    </div>
  );
}
