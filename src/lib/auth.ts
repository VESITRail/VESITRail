import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";

import { nextCookies } from "better-auth/next-js";
import { PrismaClient } from "@/generated/prisma";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prisma = new PrismaClient();

export const auth = betterAuth({
  plugins: [nextCookies()],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const emailDomainCheck = /^[a-zA-Z0-9._%+-]+@ves\.ac\.in$/;

          if (!user.email || !emailDomainCheck.test(user.email)) {
            throw new APIError("BAD_REQUEST", {
              code: "INVALID_EMAIL_DOMAIN",
              message: "Only emails with @ves.ac.in domain are allowed",
            });
          }

          return { data: { ...user } };
        },
      },
    },
  },
});
