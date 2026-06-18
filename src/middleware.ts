import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "gqg-dev-secret-cambiar-en-produccion",
);

// Rutas publicas (no requieren sesion)
function esPublica(path: string): boolean {
  return (
    path === "/login" ||
    path.startsWith("/api/auth/login") ||
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    path === "/icon.svg"
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (esPublica(pathname)) return NextResponse.next();

  const token = req.cookies.get("gqg_session")?.value;
  let valido = false;
  if (token) {
    try {
      await jwtVerify(token, secret);
      valido = true;
    } catch {
      valido = false;
    }
  }

  if (!valido) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
