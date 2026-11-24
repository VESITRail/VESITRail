import { Pool } from "pg";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { unwrap } from "@/lib/result";
import { expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { join, resolve } from "node:path";
import { createTestAuth } from "./test-auth";
import { execFile } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { cp, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";

const execFileAsync = promisify(execFile);
const sourceMigrations = resolve("prisma/migrations");
const semesterMigration = "20261123161819_add_academic_semesters";

async function prepareBaselineMigrations(directory: string) {
	const migrationsPath = join(directory, "migrations");
	await mkdir(migrationsPath);

	const entries = await readdir(sourceMigrations, { withFileTypes: true });
	const baseline = entries.filter((entry) => entry.isDirectory() && entry.name < semesterMigration);

	await Promise.all([
		cp(join(sourceMigrations, "migration_lock.toml"), join(migrationsPath, "migration_lock.toml")),
		...baseline.map(({ name }) => cp(join(sourceMigrations, name), join(migrationsPath, name), { recursive: true })),
		writeFile(
			join(directory, "prisma.config.mjs"),
			`export default {
				migrations: { path: "migrations" },
				schema: ${JSON.stringify(resolve("prisma"))},
				datasource: { url: process.env.DATABASE_URL }
			};`
		)
	]);

	return migrationsPath;
}

it("preserves legacy application history and opens submissions after a semester is configured", async () => {
	const database = new URL(process.env.DATABASE_URL ?? "");
	if (!["localhost", "127.0.0.1"].includes(database.hostname) || database.pathname !== "/vesitrail_test") {
		throw new Error("Semester rollout tests require the local vesitrail_test database");
	}

	const controlPool = new Pool({ connectionString: database.href, max: 1 });
	const databaseName = `vesitrail_rollout_${randomUUID().replaceAll("-", "")}`;

	database.pathname = `/${databaseName}`;
	database.searchParams.set("schema", "public");

	const pool = new Pool({ connectionString: database.href });
	const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
	const directory = await mkdtemp(join(tmpdir(), "vesitrail-semester-rollout-"));

	const deploy = () =>
		execFileAsync("pnpm", ["exec", "prisma", "migrate", "deploy", "--config", join(directory, "prisma.config.mjs")], {
			env: { ...process.env, DATABASE_URL: database.href },
			timeout: 15_000
		});

	let databaseCreated = false;
	try {
		await controlPool.query(`CREATE DATABASE "${databaseName}"`);
		databaseCreated = true;

		const migrationsPath = await prepareBaselineMigrations(directory);
		await deploy();

		vi.doMock(import("@/lib/prisma"), () => ({ default: prisma }));
		vi.doMock(import("./test-auth"), () => ({ auth: createTestAuth(prisma) }));

		const { authenticateAs, createTestSemester, createTestStudent, seedReferenceData, SEED } =
			await import("./helpers");
		await seedReferenceData(prisma);

		const { student } = await createTestStudent(prisma);
		const details = {
			stationId: SEED.stations[0].id,
			concessionClassId: SEED.concessionClasses[0].id,
			concessionPeriodId: SEED.concessionPeriods[0].id
		};

		const legacyApplication = {
			id: randomUUID(),
			rejectionReason: "Verify travel details",
			createdAt: new Date("2025-08-05T08:00:00Z")
		};

		const { rows } = await pool.query<{ shortId: number }>(
			`INSERT INTO "ConcessionApplication"
				("id", "studentId", "stationId", "concessionClassId", "concessionPeriodId",
				 "createdAt", "updatedAt", "applicationType", "status", "rejectionReason")
			 VALUES ($1, $2, $3, $4, $5, $6::timestamptz AT TIME ZONE 'UTC', $6::timestamptz AT TIME ZONE 'UTC',
			         'New', 'Rejected', $7)
			 RETURNING "shortId"`,
			[
				legacyApplication.id,
				student.userId,
				details.stationId,
				details.concessionClassId,
				details.concessionPeriodId,
				legacyApplication.createdAt,
				legacyApplication.rejectionReason
			]
		);

		await cp(join(sourceMigrations, semesterMigration), join(migrationsPath, semesterMigration), { recursive: true });
		await deploy();

		const { getConcessionApplicationState, getConcessions, submitConcessionApplication } =
			await import("@/actions/concession");
		await authenticateAs(student.userId);

		expect(unwrap(await getConcessions({ page: 1, pageSize: 10 })).data).toMatchObject([
			{ ...legacyApplication, shortId: rows[0].shortId, status: "Rejected" }
		]);
		expect(unwrap(await getConcessionApplicationState())).toMatchObject({ semester: null, upcomingSemester: null });
		expect(await submitConcessionApplication({ ...details, expectedSemesterId: randomUUID() })).toMatchObject({
			isSuccess: false,
			error: { field: "semesterId", message: "Concession applications are closed for the semester break" }
		});
		expect(await prisma.concessionApplication.count()).toBe(1);

		const semester = await createTestSemester(prisma);
		expect(unwrap(await getConcessionApplicationState())).toMatchObject({
			correction: null,
			applicationType: "New",
			semester: { id: semester.id }
		});

		const application = unwrap(await submitConcessionApplication({ ...details, expectedSemesterId: semester.id }));
		expect(application).toMatchObject({ status: "Pending", applicationType: "New" });
		expect(await prisma.concessionApplication.findMany({ orderBy: { shortId: "asc" } })).toMatchObject([
			{ ...legacyApplication, shortId: rows[0].shortId, status: "Rejected", semesterId: null },
			{ id: application?.id, status: "Pending", semesterId: semester.id, previousApplicationId: null }
		]);
	} finally {
		vi.doUnmock("./test-auth");
		vi.doUnmock("@/lib/prisma");
		try {
			await prisma.$disconnect();
			await pool.end();
			if (databaseCreated) await controlPool.query(`DROP DATABASE "${databaseName}"`);
		} finally {
			await Promise.all([controlPool.end(), rm(directory, { recursive: true, force: true })]);
		}
	}
});
