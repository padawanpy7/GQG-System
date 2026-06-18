import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const COOKIE_NAME = "gqg_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "gqg-dev-secret-cambiar-en-produccion",
);

export type Sesion = { usuario: string; rol: string };

// Admin desde .env (mismo criterio que alilaurisys: usuario+clave en el entorno)
export function verificarCredenciales(usuario: string, password: string): boolean {
  return (
    usuario === (process.env.ADMIN_USER || "admin") &&
    password === (process.env.ADMIN_PASSWORD || "admin")
  );
}

export async function crearSesion(usuario: string): Promise<void> {
  const token = await new SignJWT({ usuario, rol: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function leerSesion(): Promise<Sesion | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { usuario: String(payload.usuario), rol: String(payload.rol) };
  } catch {
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
