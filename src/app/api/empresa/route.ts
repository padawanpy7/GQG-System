import { NextResponse } from "next/server";
import { q } from "@/lib/db";

export async function GET() {
  const [e] = await q(
    "SELECT id, empresa, direccion, telefono, mail, ruc FROM EMPRESAS ORDER BY id LIMIT 1",
  );
  return NextResponse.json(e ?? null);
}
