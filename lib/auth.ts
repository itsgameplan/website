
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { pool } from "@/lib/db";

/**
 * Gameplan Admin Authentication
 *
 * Email/password authentication stored in PostgreSQL.
 * Public sign-up is disabled.
 * Admin accounts are created via npm run db:setup.
 */

export const auth = betterAuth({
  appName: "Gameplan Admin",

  // Authentication base URL
  baseURL: process.env.BETTER_AUTH_URL,

  // Allow authentication requests from approved domains
  trustedOrigins: [
    "https://www.itsgameplan.com",
    "https://itsgameplan.com",

    // Local development only
    ...(process.env.NODE_ENV !== "production"
      ? ["http://localhost:3000"]
      : []),
  ],

  // Existing PostgreSQL connection
  database: pool,

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 10,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
  },

  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
