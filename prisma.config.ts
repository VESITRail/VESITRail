import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
	schema: path.join("prisma"),
	datasource: {
		url: env("DATABASE_URL")
	},
	migrations: {
		path: "prisma/migrations"
	}
});
