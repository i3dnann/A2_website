import mysql from "mysql2/promise";
import { databaseEnabled, env } from "./env.js";

let pool;

export function getPool() {
  if (!databaseEnabled) return null;
  if (!pool) {
    pool = mysql.createPool({
      host: env.MYSQL_HOST,
      port: env.MYSQL_PORT,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      database: env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
      charset: "utf8mb4"
    });
  }
  return pool;
}

export async function query(sql, params = {}) {
  const activePool = getPool();
  if (!activePool) return null;

  try {
    const [rows] = await activePool.execute(sql, params);
    return rows;
  } catch (error) {
    console.warn("[database] query failed; falling back when possible:", error.message);
    return null;
  }
}

export async function pingDatabase() {
  const rows = await query("SELECT 1 AS ok");
  return Boolean(rows?.[0]?.ok);
}
