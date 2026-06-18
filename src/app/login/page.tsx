"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password }),
    });
    if (r.ok) {
      router.replace("/");
      router.refresh();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "No se pudo iniciar sesion");
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
      }}
    >
      <form onSubmit={entrar} className="card" style={{ width: 360, maxWidth: "100%" }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: "var(--color-ink)" }}>
            GQG System
          </div>
          <div style={{ fontSize: 13, color: "var(--color-slate)" }}>Modulo de credito</div>
        </div>

        <label className="lbl">Usuario</label>
        <input
          className="field"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoFocus
          style={{ marginBottom: 14 }}
        />

        <label className="lbl">Contrasena</label>
        <input
          className="field"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        {error && (
          <p
            style={{
              color: "var(--color-alert)",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {error}
          </p>
        )}

        <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>
          {busy ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
