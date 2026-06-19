import { NextRequest, NextResponse } from "next/server";
import { q, exec } from "@/lib/db";

// Productos con su codigo de barra (PRODUCTO_DETALLE) para el detalle de la venta.
// Por defecto solo activos; con ?inactivos=1 devuelve todos (para el ABM).
export async function GET(req: NextRequest) {
  const todos = req.nextUrl.searchParams.get("inactivos") === "1";
  const filas = await q(
    `SELECT pd.codbarra, p.id AS productoid, p.producto, p.iva, p.servicio, p.precio, p.activo
     FROM PRODUCTOS p
     JOIN PRODUCTO_DETALLE pd ON pd.productoid = p.id
     ${todos ? "" : "WHERE p.activo = 1"}
     ORDER BY p.activo DESC, p.producto`,
  );
  return NextResponse.json(filas);
}

// Alta de producto: crea PRODUCTOS + su PRODUCTO_DETALLE (codigo de barra).
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const producto = String(b.producto || "").trim();
  const codbarra = String(b.codbarra || "").trim();
  const iva = Number(b.iva);
  const servicio = Number(b.servicio) === 1 ? 1 : 0;
  const precio = Number(b.precio) || 0;

  if (!producto) return NextResponse.json({ error: "Nombre del producto requerido" }, { status: 422 });
  if (!codbarra) return NextResponse.json({ error: "Codigo de barra requerido" }, { status: 422 });
  if (![0, 5, 10].includes(iva))
    return NextResponse.json({ error: "IVA debe ser 0, 5 o 10" }, { status: 422 });
  if (precio < 0) return NextResponse.json({ error: "El precio no puede ser negativo" }, { status: 422 });

  const [dup] = await q<{ codbarra: string }>(
    "SELECT codbarra FROM PRODUCTO_DETALLE WHERE codbarra = ?",
    [codbarra],
  );
  if (dup) return NextResponse.json({ error: "Ese codigo de barra ya existe" }, { status: 409 });

  const [{ maxid }] = await q<{ maxid: number }>("SELECT IFNULL(MAX(id),0) AS maxid FROM PRODUCTOS");
  const id = Number(maxid) + 1;
  await exec("INSERT INTO PRODUCTOS (id, producto, iva, servicio, precio) VALUES (?,?,?,?,?)", [
    id,
    producto,
    iva,
    servicio,
    precio,
  ]);
  // colorid/tamanoid/disenoid son atributos de variante; el prototipo usa 1 por defecto.
  await exec(
    `INSERT INTO PRODUCTO_DETALLE (codbarra, productoid, colorid, tamanoid, disenoid, uxb)
     VALUES (?,?,1,1,1,1)`,
    [codbarra, id],
  );
  return NextResponse.json({ id, codbarra }, { status: 201 });
}
