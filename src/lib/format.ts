// Formatos compartidos de la UI.

// Fecha -> DD/MM/YYYY (con ceros). Acepta 'YYYY-MM-DD', 'YYYY-MM-DD HH:MM:SS' o Date.
export function fechaCorta(valor: string | Date | null | undefined): string {
  if (!valor) return "-";
  if (typeof valor === "string") {
    const p = valor.slice(0, 10).split("-"); // YYYY-MM-DD
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
  }
  const d = new Date(valor);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// Numero de cuota -> "01/03" (ambos con dos digitos)
export function cuotaLabel(n: number, total: number): string {
  return `${String(n).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
}

// Monto -> separador de miles es-PY, sin decimales (Guarani)
export function gs(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString("es-PY");
}
