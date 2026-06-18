"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type Cuota = { cuota: number; importe: number; cobrado: number; vence: string };
type Linea = { producto: string; precio: number; cantidad: number; total: number };
type Detalle = {
  id: number;
  serie: string;
  nrofactura: number;
  fechafactura: string;
  totalfactura: number;
  cliente: string;
  documentonro: string;
  tipo: string;
  plazo: string;
  cuotas: Cuota[];
  lineas: Linea[];
};

const gs = (n: number) => Math.round(n).toLocaleString("es-PY");

export default function CuentasCobrar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<Detalle | null>(null);

  useEffect(() => {
    void fetch(`/api/ventas/${id}`).then((r) => r.json()).then(setD);
  }, [id]);

  if (!d) return null;

  return (
    <div>
      <Link href="/ventas" style={{ fontSize: 13, color: "var(--color-slate)", textDecoration: "none" }}>
        ← Ventas
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 18px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>
          Factura {d.serie}-{String(d.nrofactura).padStart(7, "0")}
        </h1>
        <Link href={`/ventas/${d.id}/factura`} className="btn btn-ghost" style={{ textDecoration: "none" }}>
          Imprimir factura
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 18 }}>
        {/* cabecera + items */}
        <section className="card">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
            <Dato k="Cliente" v={d.cliente} />
            <Dato k="Documento" v={d.documentonro} />
            <Dato k="Fecha" v={new Date(d.fechafactura).toLocaleDateString("es-PY")} />
            <Dato k="Tipo / Plazo" v={`${d.tipo} · ${d.plazo}`} />
            <Dato k="Total" v={`${gs(d.totalfactura)} Gs`} mono />
          </div>

          <div style={{ fontWeight: 600, fontSize: 14, margin: "18px 0 8px" }}>Items</div>
          {d.lineas.map((l, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--color-line)" }}>
              <span>{l.producto} × {l.cantidad}</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{gs(l.total)}</span>
            </div>
          ))}
        </section>

        {/* cuentas a cobrar */}
        <section className="card">
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Cuentas a cobrar</div>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr", fontSize: 11, letterSpacing: "0.05em", fontWeight: 600, color: "var(--color-slate)", padding: "9px 12px", background: "var(--color-surface2)", borderRadius: 4 }}>
            <span>CUOTA</span>
            <span style={{ textAlign: "right" }}>IMPORTE</span>
            <span style={{ textAlign: "right" }}>VENCE</span>
            <span style={{ textAlign: "right" }}>COBRADO</span>
          </div>
          {d.cuotas.map((c) => (
            <div key={c.cuota} style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr", fontFamily: "var(--font-mono)", fontSize: 13, padding: "10px 12px", borderBottom: "1px solid var(--color-line)" }}>
              <span>{String(c.cuota).padStart(2, "0")}/{d.cuotas.length}</span>
              <span style={{ textAlign: "right" }}>{gs(c.importe)}</span>
              <span style={{ textAlign: "right" }}>{new Date(c.vence).toLocaleDateString("es-PY")}</span>
              <span style={{ textAlign: "right" }}>{gs(c.cobrado)}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function Dato({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <div className="lbl" style={{ marginBottom: 2 }}>{k}</div>
      <div style={{ fontFamily: mono ? "var(--font-mono)" : "inherit", fontWeight: 600, wordBreak: "break-all" }}>{v}</div>
    </div>
  );
}
