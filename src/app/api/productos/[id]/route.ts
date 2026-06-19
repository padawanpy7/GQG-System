import { NextRequest, NextResponse } from "next/server";
import { exec } from "@/lib/db";

// Editar producto (los datos de PRODUCTOS; el codbarra/PRODUCTO_DETALLE no se toca
// porque es la PK referenciada por VENTA_DETALLES).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pid = Number(id);
  const b = await req.json().catch(() => ({}));
  const producto = String(b.producto || "").trim();
  const iva = Number(b.iva);
  const servicio = Number(b.servicio) === 1 ? 1 : 0;
  const precio = Number(b.precio) || 0;

  if (!producto) return NextResponse.json({ error: "Nombre del producto requerido" }, { status: 422 });
  if (![0, 5, 10].includes(iva))
    return NextResponse.json({ error: "IVA debe ser 0, 5 o 10" }, { status: 422 });
  if (precio < 0) return NextResponse.json({ error: "El precio no puede ser negativo" }, { status: 422 });

  const res = await exec(
    "UPDATE PRODUCTOS SET producto=?, iva=?, servicio=?, precio=? WHERE id=? AND activo=1",
    [producto, iva, servicio, precio, pid],
  );
  if (!res.affectedRows)
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  return NextResponse.json({ id: pid });
}

// Reactivar producto (vuelve a aparecer en los listados y selectores).
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pid = Number(id);
  const res = await exec("UPDATE PRODUCTOS SET activo=1 WHERE id=?", [pid]);
  if (!res.affectedRows)
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  return NextResponse.json({ id: pid });
}

// Desactivar producto (baja logica: no se borra, se oculta de los listados).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pid = Number(id);
  const res = await exec("UPDATE PRODUCTOS SET activo=0 WHERE id=?", [pid]);
  if (!res.affectedRows)
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  return NextResponse.json({ id: pid });
}
