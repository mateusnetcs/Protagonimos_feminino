import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined;
}

/**
 * Pool singleton armazenado em globalThis para sobreviver ao Hot Reload do Next.js
 * e evitar "Too many connections" ao criar múltiplos pools em dev.
 */
export function getPool(): mysql.Pool {
  if (globalThis.__mysqlPool) return globalThis.__mysqlPool;

  const host = process.env.MYSQL_HOST || 'localhost';
  const port = Number(process.env.MYSQL_PORT) || 3306;
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'jornada_produtor';
  const connectionLimit = Number(process.env.MYSQL_POOL_LIMIT) || 5;

  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  globalThis.__mysqlPool = pool;
  return pool;
}

export async function query<T = unknown>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<T> {
  const conn = getPool();
  const [rows] = await conn.execute(sql, params);
  return rows as T;
}
