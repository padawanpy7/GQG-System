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

type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  documentonro: string;
  direccion: string;
  email: string;
  telefono: string;
  activo: number;
};

const VACIO = {
  nombres: "",
  apellidos: "",
  documentonro: "",
  direccion: "",
  email: "",
  telefono: "",
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [f, setF] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  function cargar() {
    void fetch("/api/clientes?inactivos=1").then((r) => r.json()).then(setClientes);
  }
  useEffect(cargar, []);

  function set(k: keyof typeof f, v: string) {
    setF((x) => ({ ...x, [k]: v }));
  }

  function editar(c: Cliente) {
    setEditId(c.id);
    setError(null);
    setF({
      nombres: c.nombres || "",
      apellidos: c.apellidos || "",
      documentonro: c.documentonro || "",
      direccion: c.direccion || "",
      email: c.email || "",
      telefono: c.telefono || "",
    });
  }

  function cancelar() {
    setEditId(null);
    setF(VACIO);
    setError(null);
  }

  async function guardar() {
    if (!f.nombres.trim()) return setError("El nombre es obligatorio");
    setBusy(true);
    setError(null);
    const r = await fetch(editId ? `/api/clientes/${editId}` : "/api/clientes", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (r.ok) {
      cancelar();
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo guardar el cliente");
    }
    setBusy(false);
  }

  function pedirDesactivar(c: Cliente) {
    setConfirmacion({
      title: "Desactivar cliente",
      message: `${c.nombres} ${c.apellidos} no aparecera en nuevas ventas. Podes reactivarlo despues.`,
      label: "Desactivar",
      icon: "block",
      danger: true,
      run: async () => {
        const r = await fetch(`/api/clientes/${c.id}`, { method: "DELETE" });
        if (r.ok) {
          if (editId === c.id) cancelar();
          cargar();
        } else {
          const d = await r.json().catch(() => ({}));
          setError(d.error || "No se pudo desactivar el cliente");
        }
      },
    });
  }

  function pedirReactivar(c: Cliente) {
    setConfirmacion({
      title: "Reactivar cliente",
      message: `${c.nombres} ${c.apellidos} volvera a estar disponible en las ventas.`,
      label: "Reactivar",
      icon: "check_circle",
      danger: false,
      run: async () => {
        const r = await fetch(`/api/clientes/${c.id}`, { method: "PATCH" });
        if (r.ok) cargar();
        else {
          const d = await r.json().catch(() => ({}));
          setError(d.error || "No se pudo reactivar el cliente");
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
    "h-10 w-full rounded border border-outline-variant bg-transparent px-md font-body-md text-body-md text-primary outline-none focus:border-primary";

  return (
    <div>
      <div className="mx-auto grid max-w-[1100px] grid-cols-12 gap-xl">
        {/* listado */}
        <div className="col-span-12 lg:col-span-7">
          <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
            <div className="flex items-center gap-xs border-b border-outline-variant p-lg">
              <span className="material-symbols-outlined text-primary">group</span>
              <h2 className="font-headline-sm text-headline-sm text-primary">Clientes</h2>
            </div>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container">
                  <th className="px-md py-sm font-label-caps text-label-caps text-secondary">NOMBRE</th>
                  <th className="px-md py-sm font-label-caps text-label-caps text-secondary">DOCUMENTO</th>
                  <th className="px-md py-sm font-label-caps text-label-caps text-secondary">TELEFONO</th>
                  <th className="px-md py-sm text-right font-label-caps text-label-caps text-secondary">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-md py-lg font-body-sm text-body-sm text-secondary">
                      No hay clientes todavia.
                    </td>
                  </tr>
                ) : (
                  clientes.map((c) => {
                    const inactivo = c.activo === 0;
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-outline-variant ${
                          editId === c.id ? "bg-secondary-container/40" : inactivo ? "opacity-55" : ""
                        }`}
                      >
                        <td className="px-md py-md font-body-md text-body-md text-primary">
                          <span className="flex items-center gap-xs">
                            {c.nombres} {c.apellidos}
                            {inactivo && (
                              <span className="rounded bg-surface-container px-1.5 py-0.5 font-label-caps text-label-caps text-secondary">
                                INACTIVO
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-md py-md font-tabular-num text-tabular-num text-secondary">
                          {c.documentonro || "-"}
                        </td>
                        <td className="px-md py-md font-body-md text-body-md text-secondary">
                          {c.telefono || "-"}
                        </td>
                        <td className="px-md py-md">
                          <div className="flex justify-end gap-xs">
                            {inactivo ? (
                              <button
                                onClick={() => pedirReactivar(c)}
                                title="Activar"
                                className="flex items-center justify-center rounded p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-ok"
                              >
                                <span className="material-symbols-outlined text-base">check_circle</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => editar(c)}
                                  title="Editar"
                                  className="flex items-center justify-center rounded p-1 text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </button>
                                <button
                                  onClick={() => pedirDesactivar(c)}
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

        {/* alta / edicion */}
        <div className="col-span-12 lg:col-span-5">
          <section className="rounded-lg border border-outline-variant bg-surface-lowest p-lg">
            <div className="mb-lg font-headline-sm text-headline-sm text-primary">
              {editId ? "Editar cliente" : "Nuevo cliente"}
            </div>
            <div className="space-y-md">
              {(
                [
                  ["nombres", "NOMBRES"],
                  ["apellidos", "APELLIDOS"],
                  ["documentonro", "DOCUMENTO (CI / RUC)"],
                  ["direccion", "DIRECCION"],
                  ["email", "EMAIL"],
                  ["telefono", "TELEFONO"],
                ] as [keyof typeof f, string][]
              ).map(([k, label]) => (
                <div key={k} className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-secondary">{label}</label>
                  <input className={inputCls} value={f[k]} onChange={(e) => set(k, e.target.value)} />
                </div>
              ))}
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
                disabled={busy || !f.nombres.trim()}
                className="h-10 flex-1 rounded bg-primary px-xl font-label-caps text-label-caps font-bold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50"
              >
                {busy ? "GUARDANDO..." : editId ? "GUARDAR CAMBIOS" : "CREAR CLIENTE"}
              </button>
            </div>
          </section>
        </div>
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
