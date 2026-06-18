import mysql from "mysql2/promise";

// Pool unico reusado entre requests (mysql2/promise).
let pool: mysql.Pool | undefined;

export function db(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "gqg",
      password: process.env.DB_PASSWORD || "gqg",
      database: process.env.DB_NAME || "gqg",
      connectionLimit: 10,
      decimalNumbers: true, // DECIMAL -> number (no string)
      dateStrings: true, // DATETIME -> 'YYYY-MM-DD HH:MM:SS'
    });
  }
  return pool;
}

// Helper de consulta tipado.
export async function q<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [rows] = await db().query(sql, params);
  return rows as T[];
}

export async function exec(
  sql: string,
  params: unknown[] = [],
): Promise<mysql.ResultSetHeader> {
  const [res] = await db().query(sql, params);
  return res as mysql.ResultSetHeader;
}
