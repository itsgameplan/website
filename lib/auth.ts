import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { pool } from "@/lib/db";

/**
 * Admin authentication (Better Auth, email + password, stored in PostgreSQL).
 * Public sign-up is off: the only accounts are admins created with `npm run db:setup`
 * (ADMIN_EMAIL / ADMIN_PASSWORD), so any signed-in user is an admin.
 *
 * Needs BETTER_AUTH_SECRET (32+ random characters) and BETTER_AUTH_URL (the site's URL).
 */
export const auth = betterAuth({
  appName: "Gameplan Admin",
  database: pool,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 10,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // a week
    updateAge: 60 * 60 * 24,
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
