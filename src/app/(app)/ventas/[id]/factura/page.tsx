"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type Cuota = { cuota: number; importe: number; cobrado: number; vence: string };
type Linea = { producto: string; precio: number; cantidad: number; iva: number; total: number };
type Detalle = {
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
type Empresa = {
  empresa: string;
  direccion: string;
  telefono: string;
  mail: string;
  ruc: string;
};

const gs = (n: number) => Math.round(n).toLocaleString("es-PY");
const fecha = (s: string) => new Date(s).toLocaleDateString("es-PY");

export default function FacturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<Detalle | null>(null);
  const [emp, setEmp] = useState<Empresa | null>(null);

  useEffect(() => {
    void fetch(`/api/ventas/${id}`).then((r) => r.json()).then(setD);
    void fetch("/api/empresa").then((r) => r.json()).then(setEmp);
  }, [id]);

  if (!d) return null;

  // liquidacion de IVA (precios con IVA incluido, criterio PY)
  const exentas = d.lineas.filter((l) => l.iva === 0).reduce((s, l) => s + l.total, 0);
  const grav10 = d.lineas.filter((l) => l.iva === 10).reduce((s, l) => s + l.total, 0);
  const grav5 = d.lineas.filter((l) => l.iva === 5).reduce((s, l) => s + l.total, 0);
  const iva10 = grav10 - grav10 / 1.1;
  const iva5 = grav5 - grav5 / 1.05;
  const totalIva = iva5 + iva10;

  const cred = d.tipo !== "Contado" && d.tipo !== "CO";

  return (
    <div>
      <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Link href={`/ventas/${id}`} className="btn btn-ghost" style={{ textDecoration: "none" }}>
          ← Volver
        </Link>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Imprimir
        </button>
      </div>

      {/* comprobante */}
      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid var(--color-line)",
          borderRadius: 6,
          padding: "28px 32px",
        }}
      >
        {/* cabecera */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid var(--color-ink)", paddingBottom: 14 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{emp?.empresa || "GQG System"}</div>
            <div style={{ fontSize: 12, color: "var(--color-slate)" }}>{emp?.direccion}</div>
            <div style={{ fontSize: 12, color: "var(--color-slate)" }}>
              Tel: {emp?.telefono} · {emp?.mail}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-slate)" }}>RUC: {emp?.ruc}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>FACTURA</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700 }}>
              {d.serie}-{String(d.nrofactura).padStart(7, "0")}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-slate)" }}>Timbrado: 12557031</div>
            <div style={{ fontSize: 12, color: "var(--color-slate)" }}>
              Condicion: <b>{cred ? "Credito" : "Contado"}</b>
            </div>
          </div>
        </div>

        {/* receptor */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, padding: "14px 0", borderBottom: "1px solid var(--color-line)" }}>
          <div><span style={{ color: "var(--color-slate)" }}>Cliente: </span><b>{d.cliente}</b></div>
          <div><span style={{ color: "var(--color-slate)" }}>RUC/CI: </span>{d.documentonro}</div>
          <div><span style={{ color: "var(--color-slate)" }}>Fecha: </span>{fecha(d.fechafactura)}</div>
          <div><span style={{ color: "var(--color-slate)" }}>Plazo: </span>{d.plazo}</div>
        </div>

        {/* items */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 }}>
          <thead>
            <tr style={{ background: "var(--color-surface2)", textAlign: "left" }}>
              <th style={{ padding: "8px 10px" }}>Descripcion</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Cant</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Precio</th>
              <th style={{ padding: "8px 10px", textAlign: "center" }}>IVA</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {d.lineas.map((l, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--color-line)" }}>
                <td style={{ padding: "8px 10px" }}>{l.producto}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{l.cantidad}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{gs(l.precio)}</td>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>{l.iva}%</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{gs(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* totales */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <table style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>
            <tbody>
              <tr><td style={{ padding: "3px 14px", color: "var(--color-slate)" }}>Exentas</td><td style={{ padding: "3px 0", textAlign: "right" }}>{gs(exentas)}</td></tr>
              <tr><td style={{ padding: "3px 14px", color: "var(--color-slate)" }}>Gravado 5% / 10%</td><td style={{ padding: "3px 0", textAlign: "right" }}>{gs(grav5)} / {gs(grav10)}</td></tr>
              <tr><td style={{ padding: "3px 14px", color: "var(--color-slate)" }}>IVA (5% + 10%)</td><td style={{ padding: "3px 0", textAlign: "right" }}>{gs(totalIva)}</td></tr>
              <tr style={{ borderTop: "1px solid var(--color-ink)", fontWeight: 700 }}>
                <td style={{ padding: "6px 14px" }}>TOTAL</td><td style={{ padding: "6px 0", textAlign: "right" }}>{gs(d.totalfactura)} Gs</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* plan de cuotas */}
        {cred && d.cuotas.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Cuentas a cobrar</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--color-surface2)", textAlign: "left" }}>
                  <th style={{ padding: "7px 10px" }}>Cuota</th>
                  <th style={{ padding: "7px 10px", textAlign: "right" }}>Importe</th>
                  <th style={{ padding: "7px 10px", textAlign: "right" }}>Vence</th>
                </tr>
              </thead>
              <tbody>
                {d.cuotas.map((c) => (
                  <tr key={c.cuota} style={{ borderBottom: "1px solid var(--color-line)", fontFamily: "var(--font-mono)" }}>
                    <td style={{ padding: "7px 10px" }}>{String(c.cuota).padStart(2, "0")}/{d.cuotas.length}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>{gs(c.importe)}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>{fecha(c.vence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ fontSize: 11, color: "var(--color-slate)", marginTop: 24, textAlign: "center" }}>
          Documento no fiscal — comprobante interno de GQG System.
        </p>
      </div>
    </div>
  );
}
