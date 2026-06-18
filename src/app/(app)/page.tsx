"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Cliente = { id: number; nombres: string; apellidos: string; documentonro: string };
type Plazo = {
  id: number;
  plazo: string;
  tipoid: number;
  cuotas: number;
  irregular: number;
  detalles: { cuota: number; dias: number }[];
};

const gs = (n: number) => Math.round(n).toLocaleString("es-PY");
const hoyIso = () => new Date().toISOString().slice(0, 10);
function masDias(iso: string, dias: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("es-PY");
}

export default function NuevaVenta() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [plazos, setPlazos] = useState<Plazo[]>([]);

  const [clienteid, setClienteid] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [credito, setCredito] = useState(true);
  const [plazoId, setPlazoId] = useState("");
  const [totalStr, setTotalStr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/clientes").then((r) => r.json()).then(setClientes);
    void fetch("/api/plazos").then((r) => r.json()).then(setPlazos);
  }, []);

  const plazosModo = plazos.filter((p) => p.tipoid === (credito ? 1 : 0));
  useEffect(() => {
    if (plazosModo.length && !plazosModo.some((p) => String(p.id) === plazoId)) {
      setPlazoId(String(plazosModo[0].id));
    }
  }, [credito, plazos]);

  const plazo = plazos.find((p) => String(p.id) === plazoId) || null;
  const total = Number(totalStr) || 0;

  const cuotas = useMemo(() => {
    if (!plazo || total <= 0) return [] as { n: number; importe: number; vence: string }[];
    const n = plazo.cuotas;
    const base = Math.trunc(total / n);
    const ultima = total - base * (n - 1);
    const out: { n: number; importe: number; vence: string }[] = [];
    for (let i = 1; i <= n; i++) {
      const importe = i < n ? base : ultima;
      let vence = masDias(fecha, 0);
      if (plazo.tipoid === 0) vence = masDias(fecha, 0);
      else if (plazo.irregular)
        vence = masDias(fecha, plazo.detalles.find((x) => x.cuota === i)?.dias ?? i * 30);
      else vence = masDias(fecha, i * 30);
      out.push({ n: i, importe, vence });
    }
    return out;
  }, [plazo, total, fecha]);

  const suma = cuotas.reduce((s, c) => s + c.importe, 0);
  const cuadra = cuotas.length > 0 && suma === Math.round(total);

  async function generar() {
    if (!clienteid) return setError("Elegi un cliente");
    if (!plazoId) return setError("Elegi un plazo");
    if (total <= 0) return setError("Ingresa el total de la venta");
    setBusy(true);
    setError(null);
    const r = await fetch("/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteid: Number(clienteid),
        fechafactura: fecha,
        tipodocid: credito ? 2 : 1,
        plazoid: Number(plazoId),
        total,
      }),
    });
    if (r.ok) {
      const d = await r.json();
      router.push(`/ventas/${d.id}`);
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo generar la venta");
      setBusy(false);
    }
  }

  const inputCls =
    "h-10 w-full rounded border border-outline-variant bg-transparent px-md font-body-md text-body-md text-primary outline-none focus:border-primary";

  return (
    <div>
      <div className="mx-auto grid max-w-[1200px] grid-cols-12 gap-xl">
        {/* -------- Datos de la venta -------- */}
        <div className="col-span-12 flex flex-col gap-xl lg:col-span-7">
          <section className="rounded-lg border border-outline-variant bg-surface-lowest p-lg">
            <div className="mb-lg flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              <h2 className="font-headline-sm text-headline-sm text-primary">Datos de la venta</h2>
            </div>

            <div className="space-y-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-secondary">CLIENTE</label>
                <select className={inputCls} value={clienteid} onChange={(e) => setClienteid(e.target.value)}>
                  <option value="">Elegir cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombres} {c.apellidos} ({c.documentonro})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-secondary">FECHA</label>
                  <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
                <div className="flex flex-col gap-xs text-right">
                  <label className="font-label-caps text-label-caps text-secondary">TOTAL</label>
                  <div className="relative">
                    <span className="absolute left-md top-1/2 -translate-y-1/2 font-label-caps text-label-caps text-secondary">Gs</span>
                    <input
                      className={`${inputCls} pl-9 text-right font-tabular-num text-tabular-num`}
                      inputMode="numeric"
                      placeholder="0"
                      value={totalStr ? Number(totalStr).toLocaleString("es-PY") : ""}
                      onChange={(e) => setTotalStr(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-xs pt-sm">
                <label className="font-label-caps text-label-caps text-secondary">MODALIDAD</label>
                <div className="flex w-fit rounded bg-surface-container p-xs">
                  {[
                    { v: false, t: "CONTADO" },
                    { v: true, t: "CREDITO" },
                  ].map((m) => (
                    <button
                      key={m.t}
                      onClick={() => setCredito(m.v)}
                      className={`px-xl py-xs font-label-caps text-label-caps transition-colors ${
                        credito === m.v
                          ? "rounded border border-outline-variant bg-surface-lowest font-bold text-primary shadow-sm"
                          : "text-secondary hover:text-primary"
                      }`}
                    >
                      {m.t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-caps text-label-caps text-secondary">PLAZO</label>
                <div className="relative">
                  <select
                    className={`${inputCls} appearance-none pr-9`}
                    value={plazoId}
                    onChange={(e) => setPlazoId(e.target.value)}
                  >
                    {plazosModo.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.plazo} — {p.irregular ? "irregular" : p.tipoid === 0 ? "contado" : "regular"} — {p.cuotas} cuota(s)
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-md top-1/2 -translate-y-1/2 text-secondary">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {error && <p className="mt-md font-body-sm text-body-sm text-error">{error}</p>}

            <div className="mt-xl flex justify-end gap-md border-t border-outline-variant pt-lg">
              <button
                onClick={() => { setTotalStr(""); setClienteid(""); setError(null); }}
                className="h-10 rounded border border-outline-variant px-xl font-label-caps text-label-caps text-primary transition-colors hover:bg-surface-container"
              >
                DESCARTAR
              </button>
              <button
                onClick={generar}
                disabled={busy || total <= 0}
                className="h-10 rounded bg-primary px-xl font-label-caps text-label-caps font-bold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50"
              >
                {busy ? "GENERANDO..." : "GENERAR CUOTAS"}
              </button>
            </div>
          </section>
        </div>

        {/* -------- Cuentas a cobrar -------- */}
        <div className="col-span-12 flex flex-col gap-xl lg:col-span-5">
          <section className="flex h-full flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
            <div className="flex items-center justify-between border-b border-outline-variant p-lg">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                <h2 className="font-headline-sm text-headline-sm text-primary">Cuentas a cobrar</h2>
              </div>
              <span
                className={`rounded-full px-md py-1 font-label-caps text-label-caps ${
                  credito ? "bg-secondary-container text-on-secondary-container" : "bg-green-100 text-green-800"
                }`}
              >
                {credito ? "CREDITO" : "CONTADO"}
              </span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container">
                    <th className="border-b border-outline-variant px-md py-sm font-label-caps text-label-caps text-secondary">CUOTA</th>
                    <th className="border-b border-outline-variant px-md py-sm text-right font-label-caps text-label-caps text-secondary">IMPORTE</th>
                    <th className="border-b border-outline-variant px-md py-sm text-right font-label-caps text-label-caps text-secondary">VENCE</th>
                  </tr>
                </thead>
                <tbody>
                  {cuotas.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-md py-lg font-body-sm text-body-sm text-secondary">
                        Cargá el total para ver las cuotas.
                      </td>
                    </tr>
                  ) : (
                    cuotas.map((c) => (
                      <tr key={c.n} className="transition-colors hover:bg-blue-50/30">
                        <td className="border-b border-outline-variant px-md py-md font-body-md text-body-md text-primary">
                          {String(c.n).padStart(2, "0")}/{plazo?.cuotas}
                        </td>
                        <td className="border-b border-outline-variant px-md py-md text-right font-tabular-num text-tabular-num text-primary">{gs(c.importe)}</td>
                        <td className="border-b border-outline-variant px-md py-md text-right font-tabular-num text-tabular-num text-secondary">{c.vence}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {cuotas.length > 0 && (
                  <tfoot>
                    <tr className="bg-surface-bright">
                      <td className="px-md py-md font-body-md text-body-md font-bold text-primary">Total</td>
                      <td className="px-md py-md text-right font-tabular-num text-tabular-num font-bold text-primary">{gs(suma)}</td>
                      <td className="px-md py-md" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="mt-auto p-lg">
              {cuotas.length > 0 && (
                <p className="text-center font-body-sm text-body-sm italic text-secondary">
                  {cuadra
                    ? "Cuotas calculadas por el trigger; la suma coincide con el total."
                    : `Diferencia de ${gs(Math.round(total) - suma)} Gs (redondeo).`}
                </p>
              )}
              <button
                onClick={generar}
                disabled={busy || total <= 0}
                className="mt-lg w-full rounded bg-primary py-md font-headline-sm text-headline-sm font-bold text-on-primary shadow-sm transition-all active:opacity-90 disabled:opacity-50"
              >
                CONFIRMAR VENTA
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* -------- Bento de contexto -------- */}
      <div className="mx-auto mt-xl grid max-w-[1200px] grid-cols-3 gap-xl">
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-lg">
          <div className="mb-sm flex items-center gap-xs">
            <span className="material-symbols-outlined text-base text-secondary">info</span>
            <span className="font-label-caps text-label-caps text-secondary">RESUMEN</span>
          </div>
          <div className="font-tabular-num text-headline-sm text-primary">{gs(total)} Gs</div>
          <p className="mt-sm font-body-sm text-body-sm text-secondary">
            {credito ? `${plazo?.cuotas ?? 0} cuota(s) — ${plazo?.plazo ?? ""}` : "Contado — una cuota"}
          </p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-lg">
          <div className="mb-sm flex items-center gap-xs">
            <span className="material-symbols-outlined text-base text-secondary">event</span>
            <span className="font-label-caps text-label-caps text-secondary">VENCIMIENTO FINAL</span>
          </div>
          <div className="font-tabular-num text-headline-sm text-primary">
            {cuotas.length ? cuotas[cuotas.length - 1].vence : "—"}
          </div>
          <p className="mt-sm font-body-sm text-body-sm text-secondary">Ultima cuota a cobrar.</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low p-lg text-center">
          <span className="material-symbols-outlined mb-xs text-secondary">verified</span>
          <span className="font-label-caps text-label-caps text-secondary">ESTADO</span>
          <div
            className={`mt-xs rounded-full px-md py-1 font-label-caps text-label-caps ${
              cuadra ? "bg-green-100 text-green-800" : "bg-surface-container text-secondary"
            }`}
          >
            {cuotas.length === 0 ? "SIN DATOS" : cuadra ? "CUADRA" : "REVISAR"}
          </div>
        </div>
      </div>
    </div>
  );
}
