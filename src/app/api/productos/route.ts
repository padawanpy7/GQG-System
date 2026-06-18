import { NextResponse } from "next/server";
import { q } from "@/lib/db";

// Productos con su codigo de barra (PRODUCTO_DETALLE) para el detalle de la venta.
export async function GET() {
  const filas = await q(
    `SELECT pd.codbarra, p.id AS productoid, p.producto, p.iva
     FROM PRODUCTOS p
     JOIN PRODUCTO_DETALLE pd ON pd.productoid = p.id
     ORDER BY p.producto`,
  );
  return NextResponse.json(filas);
}
