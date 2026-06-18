import { NextRequest, NextResponse } from "next/server";
import { verificarCredenciales, crearSesion } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { usuario, password } = await req.json().catch(() => ({}));
  if (!usuario || !password) {
    return NextResponse.json({ error: "Usuario y contraseña requeridos" }, { status: 422 });
  }
  if (!verificarCredenciales(usuario, password)) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }
  await crearSesion(usuario);
  return NextResponse.json({ ok: true, usuario });
}
