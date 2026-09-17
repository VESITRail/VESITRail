import dotenv from "dotenv";
dotenv.config({ path: ".env.test", override: true });

import { execSync } from "node:child_process";
import { getTestPrisma, seedReferenceData } from "./helpers";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/vesitrail_test";

export async function setup() {
	process.env.DATABASE_URL = DATABASE_URL;

	if (DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1")) {
		console.log("[global-setup] Running Prisma migrations on test database...");

		execSync("pnpm exec prisma migrate deploy", {
			stdio: "inherit",
			env: { ...process.env, DATABASE_URL }
		});

		console.log("[global-setup] Migrations applied successfully.");
		console.log("[global-setup] Seeding reference data...");

		const { prisma, pool } = getTestPrisma();
		await seedReferenceData(prisma);
		await prisma.$disconnect();
		await pool.end();

		console.log("[global-setup] Reference data seeded successfully.");
	} else {
		throw new Error("[global-setup] DATABASE_URL does not point to localhost. Aborting to protect database integrity.");
	}
}

export async function teardown() {
	console.log("[global-setup] Teardown complete.");
}
