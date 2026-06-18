import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const vid = Number(id);

  const [v] = await q(
    `SELECT v.id, v.fechafactura, v.serie, v.nrofactura, v.totalfactura,
            v.clienteid, v.tipodocid, v.plazoid,
            CONCAT(c.nombres, ' ', c.apellidos) AS cliente, c.documentonro,
            td.tipo, td.abreviatura, p.plazo, p.irregular
     FROM VENTAS v
     JOIN CLIENTES c        ON c.id = v.clienteid
     JOIN TIPOS_DOCUMENTO td ON td.id = v.tipodocid
     JOIN PLAZOS p          ON p.id = v.plazoid
     WHERE v.id = ?`,
    [vid],
  );
  if (!v) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

  const cuotas = await q(
    `SELECT cuota, importe, cobrado, vence
     FROM CUENTAS_COBRAR
     WHERE tabla = 'VENTAS' AND tablaid = ?
     ORDER BY cuota`,
    [vid],
  );
  const lineas = await q(
    `SELECT vd.codbarra, pr.producto, vd.precio, vd.cantidad, vd.iva, vd.total
     FROM VENTA_DETALLES vd
     JOIN PRODUCTO_DETALLE pd ON pd.codbarra = vd.codbarra
     JOIN PRODUCTOS pr        ON pr.id = pd.productoid
     WHERE vd.ventaid = ?`,
    [vid],
  );
  return NextResponse.json({ ...v, cuotas, lineas });
}
