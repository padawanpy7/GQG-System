"use client";

import { useEffect, useState } from "react";

type Deposito = { id: number; deposito: string; direccion: string; telefono: string };

export default function DepositosPage() {
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [f, setF] = useState({ deposito: "", direccion: "", telefono: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function cargar() {
    void fetch("/api/depositos").then((r) => r.json()).then(setDepositos);
  }
  useEffect(cargar, []);

  function set(k: keyof typeof f, v: string) {
    setF((x) => ({ ...x, [k]: v }));
  }

  async function crear() {
    if (!f.deposito.trim()) return setError("El nombre es obligatorio");
    setBusy(true);
    setError(null);
    const r = await fetch("/api/depositos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (r.ok) {
      setF({ deposito: "", direccion: "", telefono: "" });
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo crear el deposito");
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
            <span className="material-symbols-outlined text-primary">warehouse</span>
            <h2 className="font-headline-sm text-headline-sm text-primary">Depositos</h2>
          </div>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container">
                <th className="px-md py-sm font-label-caps text-label-caps text-secondary">DEPOSITO</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-secondary">DIRECCION</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-secondary">TELEFONO</th>
              </tr>
            </thead>
            <tbody>
              {depositos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-md py-lg font-body-sm text-body-sm text-secondary">
                    No hay depositos todavia.
                  </td>
                </tr>
              ) : (
                depositos.map((d) => (
                  <tr key={d.id} className="border-b border-outline-variant">
                    <td className="px-md py-md font-body-md text-body-md text-primary">{d.deposito}</td>
                    <td className="px-md py-md font-body-md text-body-md text-secondary">{d.direccion || "-"}</td>
                    <td className="px-md py-md font-body-md text-body-md text-secondary">{d.telefono || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      <div className="col-span-12 lg:col-span-5">
        <section className="rounded-lg border border-outline-variant bg-surface-lowest p-lg">
          <div className="mb-lg font-headline-sm text-headline-sm text-primary">Nuevo deposito</div>
          <div className="space-y-md">
            {(
              [
                ["deposito", "NOMBRE"],
                ["direccion", "DIRECCION"],
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
            disabled={busy || !f.deposito.trim()}
            className="mt-lg h-10 w-full rounded bg-primary px-xl font-label-caps text-label-caps font-bold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50"
          >
            {busy ? "GUARDANDO..." : "CREAR DEPOSITO"}
          </button>
        </section>
      </div>
    </div>
  );
}
