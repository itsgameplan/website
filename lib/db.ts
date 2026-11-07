import { Pool } from "pg";

/**
 * One shared PostgreSQL pool for the whole server (Better Auth and the form messages).
 * Set DATABASE_URL, e.g. postgres://user:pass@localhost:5432/gameplan
 * (append ?sslmode=require for hosted databases that need TLS).
 * In dev the pool is kept on globalThis so hot reloads don't open new connections each time.
 */
const globalForDb = globalThis as unknown as { __gpPool?: Pool };

function createPool() {
  if (!process.env.DATABASE_URL) {
    console.warn("[db] DATABASE_URL is not set: form messages and admin login will not work.");
  }
  // DATABASE_POOL_MAX: lower it on small hosted plans with few connections (default 5)
  return new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DATABASE_POOL_MAX) || 5, idleTimeoutMillis: 10_000 });
}

export const pool = globalForDb.__gpPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__gpPool = pool;
