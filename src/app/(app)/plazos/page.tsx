"use client";

import { useEffect, useState } from "react";

type Plazo = {
  id: number;
  plazo: string;
  tipoid: number;
  cuotas: number;
  irregular: number;
  detalles: { cuota: number; dias: number }[];
};

export default function PlazosPage() {
  const [plazos, setPlazos] = useState<Plazo[]>([]);
  const [nombre, setNombre] = useState("");
  const [credito, setCredito] = useState(true);
  const [cuotas, setCuotas] = useState("3");
  const [irregular, setIrregular] = useState(false);
  const [dias, setDias] = useState<string[]>(["30", "60", "90"]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function cargar() {
    void fetch("/api/plazos").then((r) => r.json()).then(setPlazos);
  }
  useEffect(cargar, []);

  // ajustar la cantidad de inputs de dias segun cuotas
  const n = Number(cuotas) || 0;
  useEffect(() => {
    setDias((d) => {
      const out = [...d];
      while (out.length < n) out.push(String((out.length + 1) * 30));
      return out.slice(0, n);
    });
  }, [n]);

  async function crear() {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/plazos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plazo: nombre,
        tipoid: credito ? 1 : 0,
        cuotas: n,
        irregular: credito && irregular,
        detalles: credito && irregular ? dias.map((d, i) => ({ cuota: i + 1, dias: Number(d) })) : [],
      }),
    });
    if (r.ok) {
      setNombre("");
      cargar();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo crear el plazo");
    }
    setBusy(false);
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 18 }}>
        Plazos
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
        {/* listado */}
        <div className="card" style={{ padding: 0, overflow: "hidden", height: "fit-content" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 1fr", fontSize: 11, letterSpacing: "0.05em", fontWeight: 600, color: "var(--color-slate)", padding: "11px 16px", background: "var(--color-surface2)" }}>
            <span>PLAZO</span>
            <span>MODO</span>
            <span style={{ textAlign: "center" }}>CUOTAS</span>
            <span>DIAS</span>
          </div>
          {plazos.map((p) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 1fr", alignItems: "center", fontSize: 13, padding: "11px 16px", borderTop: "1px solid var(--color-line)" }}>
              <span>{p.plazo}</span>
              <span style={{ color: "var(--color-slate)" }}>
                {p.tipoid === 0 ? "contado" : p.irregular ? "irregular" : "regular"}
              </span>
              <span style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>{p.cuotas}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-slate)" }}>
                {p.tipoid === 0
                  ? "-"
                  : p.irregular
                    ? p.detalles.map((d) => d.dias).join(" / ")
                    : Array.from({ length: p.cuotas }, (_, i) => (i + 1) * 30).join(" / ")}
              </span>
            </div>
          ))}
        </div>

        {/* alta */}
        <div className="card" style={{ height: "fit-content" }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 14 }}>Nuevo plazo</div>

          <label className="lbl">Nombre</label>
          <input className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="CR-30/45/60 dias" style={{ marginBottom: 14 }} />

          <label className="lbl">Tipo</label>
          <div style={{ display: "flex", gap: 4, background: "var(--color-surface2)", borderRadius: 5, padding: 3, marginBottom: 14 }}>
            {[
              { v: false, t: "CONTADO" },
              { v: true, t: "CREDITO" },
            ].map((m) => (
              <button key={m.t} onClick={() => setCredito(m.v)} style={{ flex: 1, border: "none", borderRadius: 3, padding: "8px 0", fontSize: 11, fontWeight: 600, cursor: "pointer", background: credito === m.v ? "var(--color-surface)" : "transparent", color: credito === m.v ? "var(--color-ink)" : "var(--color-slate)" }}>
                {m.t}
              </button>
            ))}
          </div>

          <label className="lbl">Cantidad de cuotas</label>
          <input className="field" value={cuotas} onChange={(e) => setCuotas(e.target.value.replace(/\D/g, ""))} style={{ marginBottom: 14 }} />

          {credito && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={irregular} onChange={(e) => setIrregular(e.target.checked)} />
              Vencimiento irregular (definir dias de cada cuota)
            </label>
          )}

          {credito && irregular && (
            <div style={{ marginBottom: 14 }}>
              <label className="lbl">Dias de cada cuota (desde la fecha factura)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {dias.map((d, i) => (
                  <input key={i} className="field" style={{ width: 70 }} value={d} onChange={(e) => setDias((arr) => arr.map((x, j) => (j === i ? e.target.value.replace(/\D/g, "") : x)))} />
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ color: "var(--color-alert)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary" onClick={crear} disabled={busy || !nombre} style={{ width: "100%" }}>
            {busy ? "Guardando..." : "Crear plazo"}
          </button>
        </div>
      </div>
    </div>
  );
}
