import { NextRequest, NextResponse } from "next/server";
import { q, db } from "@/lib/db";

export async function GET() {
  const filas = await q(
    `SELECT v.id, v.fechafactura, v.serie, v.nrofactura, v.totalfactura,
            CONCAT(c.nombres, ' ', c.apellidos) AS cliente,
            td.abreviatura AS tipo, p.plazo,
            (SELECT COUNT(*) FROM CUENTAS_COBRAR cc
              WHERE cc.tabla = 'VENTAS' AND cc.tablaid = v.id) AS ncuotas
     FROM VENTAS v
     JOIN CLIENTES c        ON c.id = v.clienteid
     JOIN TIPOS_DOCUMENTO td ON td.id = v.tipodocid
     JOIN PLAZOS p          ON p.id = v.plazoid
     ORDER BY v.id DESC`,
  );
  return NextResponse.json(filas);
}

type Linea = { codbarra: string; precio: number; cantidad: number; iva?: number };

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const clienteid = Number(b.clienteid);
  const fechafactura = String(b.fechafactura || "").slice(0, 10);
  const tipodocid = Number(b.tipodocid);
  const plazoid = Number(b.plazoid);
  let lineas: Linea[] = Array.isArray(b.lineas) ? b.lineas : [];

  if (!clienteid) return NextResponse.json({ error: "Cliente requerido" }, { status: 422 });
  if (!fechafactura) return NextResponse.json({ error: "Fecha requerida" }, { status: 422 });
  if (!tipodocid || !plazoid)
    return NextResponse.json({ error: "Tipo de documento y plazo requeridos" }, { status: 422 });

  // Si no se mandan items (la pantalla usa un Total directo), se arma una
  // linea generica con el primer producto del catalogo.
  if (lineas.length === 0) {
    const totalDirecto = Number(b.total || 0);
    if (totalDirecto <= 0)
      return NextResponse.json({ error: "Ingresa el total de la venta" }, { status: 422 });
    const [prod] = await q<{ codbarra: string; iva: number }>(
      "SELECT pd.codbarra, p.iva FROM PRODUCTO_DETALLE pd JOIN PRODUCTOS p ON p.id = pd.productoid LIMIT 1",
    );
    if (!prod)
      return NextResponse.json({ error: "No hay productos cargados" }, { status: 409 });
    lineas = [{ codbarra: prod.codbarra, precio: totalDirecto, cantidad: 1, iva: prod.iva }];
  }

  // Agrupa por codbarra (la PK de VENTA_DETALLES es (ventaid, codbarra)):
  // si un producto se repite, se suman las cantidades en una sola fila.
  const porCod = new Map<string, Linea>();
  for (const l of lineas) {
    if (!l.codbarra || Number(l.cantidad) <= 0) continue;
    const prev = porCod.get(l.codbarra);
    if (prev) prev.cantidad = Number(prev.cantidad) + Number(l.cantidad);
    else porCod.set(l.codbarra, { ...l, cantidad: Number(l.cantidad) });
  }
  lineas = [...porCod.values()];
  if (lineas.length === 0)
    return NextResponse.json({ error: "Agrega al menos un producto" }, { status: 422 });

  const total = lineas.reduce(
    (s, l) => s + Number(l.precio || 0) * Number(l.cantidad || 0),
    0,
  );
  if (total <= 0)
    return NextResponse.json({ error: "El total debe ser mayor a cero" }, { status: 422 });

  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();
    const [[{ maxid }]] = (await conn.query(
      "SELECT IFNULL(MAX(id),0) AS maxid FROM VENTAS",
    )) as [{ maxid: number }[], unknown];
    const [[{ maxnro }]] = (await conn.query(
      "SELECT IFNULL(MAX(nrofactura),0) AS maxnro FROM VENTAS",
    )) as [{ maxnro: number }[], unknown];
    const id = Number(maxid) + 1;
    const nro = Number(maxnro) + 1;

    // El AFTER INSERT (trigger ins_ventas) genera las cuotas aca.
    await conn.query(
      `INSERT INTO VENTAS
        (id, fechaproceso, fechafactura, clienteid, serie, nrofactura,
         timbrado, timbrado_vence, totalexento, totalimpuesto, totalbase,
         totalfactura, depositoid, monedaid, tipodocid, plazoid)
       VALUES (?, NOW(), ?, ?, '001-001', ?, '12557031', '2025-12-31',
               0, 0, ?, ?, 1, 1, ?, ?)`,
      [id, fechafactura, clienteid, nro, total, total, tipodocid, plazoid],
    );

    for (const l of lineas) {
      const t = Number(l.precio || 0) * Number(l.cantidad || 0);
      await conn.query(
        `INSERT INTO VENTA_DETALLES
          (ventaid, codbarra, precio, cantidad, iva, impuesto5, impuesto10, total)
         VALUES (?,?,?,?,?,0,0,?)`,
        [id, l.codbarra, Number(l.precio), Number(l.cantidad), Number(l.iva || 0), t],
      );
    }

    await conn.commit();
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    await conn.rollback();
    // los SIGNAL del trigger (tipo/plazo no coinciden, etc.) llegan aca
    const msg = e instanceof Error ? e.message.replace(/^.*?: /, "") : "No se pudo crear la venta";
    return NextResponse.json({ error: msg }, { status: 422 });
  } finally {
    conn.release();
  }
}
