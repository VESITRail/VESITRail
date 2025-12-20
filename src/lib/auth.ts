import pg from "pg";
import "dotenv/config";
import { toTitleCase } from "./utils";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { oneTap } from "better-auth/plugins";
import { PrismaPg } from "@prisma/adapter-pg";
import { nextCookies } from "better-auth/next-js";
import { PrismaClient } from "@/generated/prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
	plugins: [oneTap(), nextCookies()],
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
