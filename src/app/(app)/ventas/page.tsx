"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Venta = {
  id: number;
  fechafactura: string;
  serie: string;
  nrofactura: number;
  totalfactura: number;
  cliente: string;
  tipo: string;
  plazo: string;
  ncuotas: number;
};

const gs = (n: number) => Math.round(n).toLocaleString("es-PY");

export default function VentasPage() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);

  useEffect(() => {
    void fetch("/api/ventas").then((r) => r.json()).then(setVentas);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 18 }}>
        Ventas
      </h1>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 90px 1fr 100px 90px",
            fontSize: 11,
            letterSpacing: "0.05em",
            fontWeight: 600,
            color: "var(--color-slate)",
            padding: "11px 16px",
            background: "var(--color-surface2)",
          }}
        >
          <span>FACTURA</span>
          <span>CLIENTE</span>
          <span>TIPO</span>
          <span>PLAZO</span>
          <span style={{ textAlign: "right" }}>TOTAL</span>
          <span style={{ textAlign: "center" }}>CUOTAS</span>
        </div>
        {ventas.length === 0 ? (
          <p style={{ color: "var(--color-slate)", fontSize: 13, padding: 20 }}>
            No hay ventas todavia.
          </p>
        ) : (
          ventas.map((v) => (
            <div
              key={v.id}
              onClick={() => router.push(`/ventas/${v.id}`)}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 90px 1fr 100px 90px",
                alignItems: "center",
                fontSize: 13,
                padding: "11px 16px",
                borderTop: "1px solid var(--color-line)",
                cursor: "pointer",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {v.serie}-{String(v.nrofactura).padStart(7, "0")}
              </span>
              <span>{v.cliente}</span>
              <span>{v.tipo}</span>
              <span style={{ color: "var(--color-slate)" }}>{v.plazo}</span>
              <span style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{gs(v.totalfactura)}</span>
              <span style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>{v.ncuotas}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
