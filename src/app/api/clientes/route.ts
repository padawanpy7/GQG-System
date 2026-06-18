import { NextRequest, NextResponse } from "next/server";
import { q, exec } from "@/lib/db";

export async function GET() {
  const cli = await q(
    `SELECT id, nombres, apellidos, documentonro, direccion, email, telefono
     FROM CLIENTES WHERE activo = 1 ORDER BY nombres, apellidos`,
  );
  return NextResponse.json(cli);
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const nombres = String(b.nombres || "").trim();
  if (!nombres) return NextResponse.json({ error: "Nombre requerido" }, { status: 422 });
  const [{ maxid }] = await q<{ maxid: number }>("SELECT IFNULL(MAX(id),0) AS maxid FROM CLIENTES");
  const id = Number(maxid) + 1;
  await exec(
    `INSERT INTO CLIENTES (id, nombres, apellidos, documentonro, direccion, email, telefono, activo)
     VALUES (?,?,?,?,?,?,?,1)`,
    [
      id,
      nombres,
      String(b.apellidos || ""),
      String(b.documentonro || ""),
      String(b.direccion || ""),
      String(b.email || ""),
      String(b.telefono || ""),
    ],
  );
  return NextResponse.json({ id }, { status: 201 });
}
