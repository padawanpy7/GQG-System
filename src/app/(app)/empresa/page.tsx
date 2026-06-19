"use client";

import { useEffect, useState } from "react";

type Empresa = {
  id: number;
  empresa: string;
  direccion: string;
  telefono: string;
  mail: string;
  ruc: string;
};

const VACIA: Empresa = { id: 0, empresa: "", direccion: "", telefono: "", mail: "", ruc: "" };

export default function EmpresaPage() {
  const [f, setF] = useState<Empresa>(VACIA);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/empresa")
      .then((r) => r.json())
      .then((e) => e && setF({ ...VACIA, ...e }));
  }, []);

  function set(k: keyof Empresa, v: string) {
    setOk(false);
    setF((x) => ({ ...x, [k]: v }));
  }

  async function guardar() {
    if (!f.empresa.trim()) return setError("El nombre de la empresa es obligatorio");
    if (!f.ruc.trim()) return setError("El RUC es obligatorio");
    setBusy(true);
    setError(null);
    const r = await fetch("/api/empresa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (r.ok) {
      setOk(true);
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo guardar");
    }
    setBusy(false);
  }

  const inputCls =
    "h-10 w-full rounded border border-outline-variant bg-transparent px-md font-body-md text-body-md text-primary outline-none focus:border-primary";

  return (
    <div className="mx-auto max-w-[640px]">
      <section className="rounded-lg border border-outline-variant bg-surface-lowest p-lg">
        <div className="mb-lg flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary">storefront</span>
          <h2 className="font-headline-sm text-headline-sm text-primary">Datos de la empresa</h2>
        </div>
        <p className="mb-lg font-body-sm text-body-sm text-secondary">
          Estos datos aparecen en la cabecera de la factura.
        </p>
        <div className="space-y-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-caps text-label-caps text-secondary">NOMBRE / RAZON SOCIAL</label>
            <input className={inputCls} value={f.empresa} onChange={(e) => set("empresa", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-secondary">RUC</label>
              <input className={inputCls} value={f.ruc} onChange={(e) => set("ruc", e.target.value)} />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-secondary">TELEFONO</label>
              <input className={inputCls} value={f.telefono} onChange={(e) => set("telefono", e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-caps text-label-caps text-secondary">DIRECCION</label>
            <input className={inputCls} value={f.direccion} onChange={(e) => set("direccion", e.target.value)} />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-caps text-label-caps text-secondary">EMAIL</label>
            <input className={inputCls} value={f.mail} onChange={(e) => set("mail", e.target.value)} />
          </div>
        </div>
        {error && <p className="mt-md font-body-sm text-body-sm text-error">{error}</p>}
        {ok && <p className="mt-md font-body-sm text-body-sm text-primary">Datos guardados.</p>}
        <button
          onClick={guardar}
          disabled={busy || !f.empresa.trim() || !f.ruc.trim()}
          className="mt-lg h-10 w-full rounded bg-primary px-xl font-label-caps text-label-caps font-bold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50"
        >
          {busy ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
        </button>
      </section>
    </div>
  );
}
