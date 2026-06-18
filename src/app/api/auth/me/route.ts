import { NextResponse } from "next/server";
import { leerSesion } from "@/lib/auth";

export async function GET() {
  const s = await leerSesion();
  if (!s) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  return NextResponse.json(s);
}
