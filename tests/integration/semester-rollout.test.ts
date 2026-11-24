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

it("preserves history through the first-semester backfill and required semester upgrade", async () => {
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

		const { authenticateAs, createTestApplication, createTestSemester, createTestStudent, seedReferenceData, SEED } =
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
		const legacyPassId = randomUUID();

		const { rows } = await pool.query<{ shortId: number }>(
			`WITH issued AS (
			   INSERT INTO "ConcessionApplication"
			      ("id", "studentId", "stationId", "concessionClassId", "concessionPeriodId",
			       "createdAt", "updatedAt", "issuedAt", "applicationType", "status")
			   VALUES ($8, $2, $3, $4, $5,
			           ($6::timestamptz - INTERVAL '4 months') AT TIME ZONE 'UTC',
			           $6::timestamptz AT TIME ZONE 'UTC',
			           ($6::timestamptz - INTERVAL '4 months') AT TIME ZONE 'UTC',
			           'New', 'Issued')
			   RETURNING "id"
			 )
			 INSERT INTO "ConcessionApplication"
				("id", "studentId", "stationId", "concessionClassId", "concessionPeriodId",
				 "createdAt", "updatedAt", "applicationType", "status", "rejectionReason", "previousApplicationId")
			 SELECT $1, $2, $3, $4, $5, $6::timestamptz AT TIME ZONE 'UTC', $6::timestamptz AT TIME ZONE 'UTC',
			        'Renewal', 'Rejected', $7, "id" FROM issued
			 RETURNING "shortId"`,
			[
				legacyApplication.id,
				student.userId,
				details.stationId,
				details.concessionClassId,
				details.concessionPeriodId,
				legacyApplication.createdAt,
				legacyApplication.rejectionReason,
				legacyPassId
			]
		);

		await cp(join(sourceMigrations, semesterMigration), join(migrationsPath, semesterMigration), { recursive: true });
		await deploy();

		const { getConcessionApplicationState, getConcessions, submitConcessionApplication } =
			await import("@/actions/concession");
		await authenticateAs(student.userId);

		expect(unwrap(await getConcessions({ page: 1, pageSize: 10 })).data).toMatchObject([
			{ ...legacyApplication, shortId: rows[0].shortId, status: "Rejected", previousApplication: { id: legacyPassId } },
			{ id: legacyPassId, status: "Issued" }
		]);
		const { student: newcomer } = await createTestStudent(prisma);
		await authenticateAs(newcomer.userId);
		expect(unwrap(await getConcessionApplicationState())).toMatchObject({ semester: null, upcomingSemester: null });
		expect(await submitConcessionApplication({ ...details, expectedSemesterId: randomUUID() })).toMatchObject({
			isSuccess: false,
			error: { field: "semesterId", message: "Concession applications are closed for the semester break" }
		});
		expect(await prisma.concessionApplication.count()).toBe(2);

		const semester = await createTestSemester(prisma);
		const prior = await createTestSemester(prisma, { term: "Even", startOffset: -240, endOffset: -98 });
		await createTestApplication(prisma, { studentId: student.userId, semesterId: prior.id, status: "Rejected" });

		const requireSemester = () =>
			pool.query('ALTER TABLE "ConcessionApplication" ALTER COLUMN "semesterId" SET NOT NULL');
		await expect(requireSemester()).rejects.toMatchObject({ code: "23502", column: "semesterId" });

		const readApplications = async () =>
			(await pool.query('SELECT * FROM "ConcessionApplication" ORDER BY "shortId"')).rows;
		const before = await readApplications();
		const backfill = () =>
			pool.query(
				`UPDATE "ConcessionApplication" AS a
				 SET "semesterId" = s."id"
				 FROM "AcademicSemester" AS s
				 WHERE s."id" = $1 AND a."semesterId" IS NULL`,
				[semester.id]
			);

		expect((await backfill()).rowCount).toBe(2);
		expect((await backfill()).rowCount).toBe(0);
		await requireSemester();
		expect(await readApplications()).toEqual(
			before.map((application) => ({ ...application, semesterId: application.semesterId ?? semester.id }))
		);

		await expect(
			pool.query(
				`INSERT INTO "ConcessionApplication"
				   ("id", "studentId", "stationId", "concessionClassId", "concessionPeriodId",
				    "updatedAt", "applicationType", "status")
				 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'New', 'Pending')`,
				[randomUUID(), newcomer.userId, details.stationId, details.concessionClassId, details.concessionPeriodId]
			)
		).rejects.toMatchObject({ code: "23502", column: "semesterId" });
		await expect(
			pool.query('UPDATE "ConcessionApplication" SET "semesterId" = NULL WHERE "id" = $1', [legacyApplication.id])
		).rejects.toMatchObject({ code: "23502", column: "semesterId" });

		await authenticateAs(student.userId);
		expect(unwrap(await getConcessionApplicationState())).toMatchObject({
			applicationType: "Renewal",
			correction: { id: legacyApplication.id },
			previousPass: { id: legacyPassId }
		});

		await authenticateAs(newcomer.userId);
		expect(unwrap(await getConcessionApplicationState())).toMatchObject({
			correction: null,
			applicationType: "New",
			semester: { id: semester.id }
		});

		const application = unwrap(await submitConcessionApplication({ ...details, expectedSemesterId: semester.id }));
		expect(application).toMatchObject({ status: "Pending", applicationType: "New" });
		expect(await prisma.concessionApplication.findMany({ where: { studentId: newcomer.userId } })).toMatchObject([
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
}, 40_000);
