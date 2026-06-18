import { NextRequest, NextResponse } from "next/server";
import { q, exec } from "@/lib/db";

export async function GET() {
  const [e] = await q(
    "SELECT id, empresa, direccion, telefono, mail, ruc FROM EMPRESAS ORDER BY id LIMIT 1",
  );
  return NextResponse.json(e ?? null);
}

// Edicion de la empresa (registro unico del emisor).
export async function PUT(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const empresa = String(b.empresa || "").trim();
  const ruc = String(b.ruc || "").trim();
  if (!empresa) return NextResponse.json({ error: "Nombre de la empresa requerido" }, { status: 422 });
  if (!ruc) return NextResponse.json({ error: "RUC requerido" }, { status: 422 });

  const [e] = await q<{ id: number }>("SELECT id FROM EMPRESAS ORDER BY id LIMIT 1");
  if (!e) return NextResponse.json({ error: "No hay empresa cargada" }, { status: 404 });

  await exec(
    `UPDATE EMPRESAS SET empresa = ?, direccion = ?, telefono = ?, mail = ?, ruc = ?
     WHERE id = ?`,
    [empresa, String(b.direccion || ""), String(b.telefono || ""), String(b.mail || ""), ruc, e.id],
  );
  return NextResponse.json({ id: e.id });
}
