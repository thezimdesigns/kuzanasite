import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    // Staff accounts are created by a SUPER_ADMIN; there is no public sign-up.
    disableSignUp: true,
    minPasswordLength: 10,
  },
  session: {
    modelName: "authSession",
    expiresIn: 60 * 60 * 24 * 14,
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "VIEWER" },
      active: { type: "boolean", input: false, defaultValue: true },
    },
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
  plugins: [nextCookies()],
});
