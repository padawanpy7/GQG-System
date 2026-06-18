import { NextRequest, NextResponse } from "next/server";
import { q, exec } from "@/lib/db";

export async function GET() {
  const filas = await q(
    "SELECT id, deposito, direccion, telefono FROM DEPOSITOS ORDER BY deposito",
  );
  return NextResponse.json(filas);
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const deposito = String(b.deposito || "").trim();
  if (!deposito) return NextResponse.json({ error: "Nombre del deposito requerido" }, { status: 422 });

  const [{ maxid }] = await q<{ maxid: number }>("SELECT IFNULL(MAX(id),0) AS maxid FROM DEPOSITOS");
  const id = Number(maxid) + 1;
  await exec("INSERT INTO DEPOSITOS (id, deposito, direccion, telefono) VALUES (?,?,?,?)", [
    id,
    deposito,
    String(b.direccion || ""),
    String(b.telefono || ""),
  ]);
  return NextResponse.json({ id }, { status: 201 });
}
