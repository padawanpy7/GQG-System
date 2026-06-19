"use client";

import { useEffect, useState } from "react";

type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  documentonro: string;
  direccion: string;
  email: string;
  telefono: string;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [f, setF] = useState({
    nombres: "",
    apellidos: "",
    documentonro: "",
    direccion: "",
    email: "",
    telefono: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function cargar() {
    void fetch("/api/clientes").then((r) => r.json()).then(setClientes);
  }
  useEffect(cargar, []);

  function set(k: keyof typeof f, v: string) {
    setF((x) => ({ ...x, [k]: v }));
  }

  async function crear() {
    if (!f.nombres.trim()) return setError("El nombre es obligatorio");
    setBusy(true);
    setError(null);
    const r = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (r.ok) {
      setF({ nombres: "", apellidos: "", documentonro: "", direccion: "", email: "", telefono: "" });
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo crear el cliente");
    }
    setBusy(false);
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
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-md py-lg font-body-sm text-body-sm text-secondary">
                      No hay clientes todavia.
                    </td>
                  </tr>
                ) : (
                  clientes.map((c) => (
                    <tr key={c.id} className="border-b border-outline-variant">
                      <td className="px-md py-md font-body-md text-body-md text-primary">
                        {c.nombres} {c.apellidos}
                      </td>
                      <td className="px-md py-md font-tabular-num text-tabular-num text-secondary">
                        {c.documentonro || "-"}
                      </td>
                      <td className="px-md py-md font-body-md text-body-md text-secondary">
                        {c.telefono || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>

        {/* alta */}
        <div className="col-span-12 lg:col-span-5">
          <section className="rounded-lg border border-outline-variant bg-surface-lowest p-lg">
            <div className="mb-lg font-headline-sm text-headline-sm text-primary">Nuevo cliente</div>
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
            <button
              onClick={crear}
              disabled={busy || !f.nombres.trim()}
              className="mt-lg h-10 w-full rounded bg-primary px-xl font-label-caps text-label-caps font-bold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50"
            >
              {busy ? "GUARDANDO..." : "CREAR CLIENTE"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
