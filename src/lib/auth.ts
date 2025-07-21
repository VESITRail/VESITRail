import { toTitleCase } from "./utils";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { oneTap } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { PrismaClient } from "@/generated/prisma";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prisma = new PrismaClient();

export const auth = betterAuth({
  plugins: [oneTap(), nextCookies()],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
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
              message: "INVALID_EMAIL_DOMAIN",
            });
          }

          return {
            data: {
              ...user,
              name: user.name ? toTitleCase(user.name.trim()) : user.name,
            },
          };
        },
      },
    },
  },
});
