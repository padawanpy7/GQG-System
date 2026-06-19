import { NextRequest, NextResponse } from "next/server";
import { q, exec } from "@/lib/db";

// Por defecto solo activos; con ?inactivos=1 devuelve todos (para el ABM).
export async function GET(req: NextRequest) {
  const todos = req.nextUrl.searchParams.get("inactivos") === "1";
  const cli = await q(
    `SELECT id, nombres, apellidos, documentonro, direccion, email, telefono, activo
     FROM CLIENTES ${todos ? "" : "WHERE activo = 1"}
     ORDER BY activo DESC, nombres, apellidos`,
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
