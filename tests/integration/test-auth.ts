import dotenv from "dotenv";
dotenv.config({ path: ".env.test", override: true });

import pg from "pg";
import { betterAuth } from "better-auth";
import { PrismaPg } from "@prisma/adapter-pg";
import { testUtils } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { beforeUserCreate } from "@/lib/auth-hooks";
import { PrismaClient } from "@/generated/prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
	plugins: [nextCookies(), testUtils()],
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
	databaseHooks: {
		user: {
			create: {
				before: beforeUserCreate
			}
		}
	}
});
