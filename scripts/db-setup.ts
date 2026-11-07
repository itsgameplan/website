/**
 * One-off database setup: `npm run db:setup` (reads .env.local if present).
 *
 *  1. creates / updates Better Auth's tables (user, session, account, verification)
 *  2. creates the form_message table
 *  3. creates the admin from ADMIN_EMAIL + ADMIN_PASSWORD (and ADMIN_NAME), or resets that
 *     admin's password if the account already exists
 *
 * Safe to run again at any time; run it once per environment (local, production).
 */
import { getMigrations } from "better-auth/db/migration";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { MESSAGES_SCHEMA } from "@/lib/messages";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (put it in .env.local).");

  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
  if (toBeCreated.length || toBeAdded.length) {
    await runMigrations();
    console.log(`✓ auth tables migrated (${[...toBeCreated, ...toBeAdded].map((t) => t.table).join(", ")})`);
  } else console.log("✓ auth tables up to date");

  await pool.query(MESSAGES_SCHEMA);
  console.log("✓ form_message table ready");

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("• ADMIN_EMAIL / ADMIN_PASSWORD not set: no admin created.");
    return;
  }
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters.");

  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  const existing = await ctx.internalAdapter.findUserByEmail(email);
  if (existing) {
    await ctx.internalAdapter.updatePassword(existing.user.id, hash);
    console.log(`✓ admin ${email} already existed: password updated`);
    return;
  }
  const user = await ctx.internalAdapter.createUser({ email, name: process.env.ADMIN_NAME?.trim() || "Admin", emailVerified: true }, { method: "admin" });
  await ctx.internalAdapter.linkAccount({ userId: user.id, providerId: "credential", accountId: user.id, password: hash });
  console.log(`✓ admin ${email} created`);
}

main()
  .catch((err) => { console.error("✗ setup failed:", err instanceof Error ? err.message : err); process.exitCode = 1; })
  .finally(() => pool.end());
