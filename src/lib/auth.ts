import pg from "pg";
import "dotenv/config";
import { betterAuth } from "better-auth";
import { PrismaPg } from "@prisma/adapter-pg";
import { beforeUserCreate } from "./auth-hooks";
import { nextCookies } from "better-auth/next-js";
import { PrismaClient } from "@/generated/prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
	plugins: [nextCookies()],
	database: prismaAdapter(prisma, {
		provider: "postgresql"
	}),
	user: {
		additionalFields: {
			pushNotificationsEnabled: {
				input: false,
				required: true,
				type: "boolean",
				defaultValue: true
			},
			emailNotificationsEnabled: {
				input: false,
				required: true,
				type: "boolean",
				defaultValue: true
			}
		}
	},
	socialProviders: {
		google: {
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string
		}
	},
	databaseHooks: {
		user: {
			create: {
				before: beforeUserCreate
			}
		}
	}
});
