import dotenv from "dotenv";
dotenv.config({ path: ".env.test", override: true });

import pg from "pg";
import { betterAuth } from "better-auth";
import { toTitleCase } from "@/lib/utils";
import { APIError } from "better-auth/api";
import { PrismaPg } from "@prisma/adapter-pg";
import { testUtils } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
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
				before: async (user) => {
					const emailDomainCheck = /^[a-zA-Z0-9._%+-]+@ves\.ac\.in$/;

					if (!user.email || !emailDomainCheck.test(user.email)) {
						throw new APIError("BAD_REQUEST", {
							code: "INVALID_EMAIL_DOMAIN",
							message: "INVALID_EMAIL_DOMAIN"
						});
					}

					return {
						data: {
							...user,
							name: user.name ? toTitleCase(user.name.trim()) : user.name
						}
					};
				}
			}
		}
	}
});
