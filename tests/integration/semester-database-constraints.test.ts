import type { PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import { getTestPrisma } from "./helpers";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Academic semester database constraints", () => {
	let db: PoolClient;
	const { pool } = getTestPrisma();

	beforeEach(async () => {
		db = await pool.connect();
		await db.query("BEGIN");
	});

	afterEach(async () => {
		await db.query("ROLLBACK");
		db.release();
	});

	afterAll(async () => {
		await pool.end();
	});

	function insertSemester(term: "Odd" | "Even", startDate: string, endDate: string) {
		const id = randomUUID();
		return db.query<{ id: string }>(
			`INSERT INTO "AcademicSemester" ("id", "academicYearStart", "term", "startDate", "endDate", "updatedAt")
			 VALUES ($1, 2099, $2, $3::date, $4::date, CURRENT_TIMESTAMP)
			 RETURNING "id"`,
			[id, term, startDate, endDate]
		);
	}

	it("rejects reversed dates on insert", async () => {
		await expect(insertSemester("Odd", "2099-08-03", "2099-08-02")).rejects.toMatchObject({
			code: "23514",
			constraint: "AcademicSemester_date_order_check"
		});
	});

	it("rejects reversed dates on update", async () => {
		const {
			rows: [semester]
		} = await insertSemester("Odd", "2099-08-03", "2099-12-20");
		await expect(
			db.query('UPDATE "AcademicSemester" SET "endDate" = $1::date WHERE "id" = $2', ["2099-08-02", semester.id])
		).rejects.toMatchObject({ code: "23514", constraint: "AcademicSemester_date_order_check" });
	});

	it.each(["2099-12-26", "2100-01-07"])(
		"rejects a new application window overlapping a window ending on %s",
		async (endDate) => {
			await insertSemester("Odd", "2099-08-03", endDate);
			await expect(insertSemester("Even", "2100-01-02", "2100-06-15")).rejects.toMatchObject({
				code: "23P01",
				constraint: "AcademicSemester_application_window_exclusion"
			});
		}
	);

	it("rejects an update that creates an overlap only in the seven early days", async () => {
		await insertSemester("Odd", "2099-08-03", "2099-12-26");
		const {
			rows: [semester]
		} = await insertSemester("Even", "2100-01-03", "2100-06-15");
		await expect(
			db.query('UPDATE "AcademicSemester" SET "startDate" = $1::date WHERE "id" = $2', ["2100-01-02", semester.id])
		).rejects.toMatchObject({ code: "23P01", constraint: "AcademicSemester_application_window_exclusion" });
	});

	it("accepts adjacent windows and a one-day semester", async () => {
		await insertSemester("Odd", "2099-08-03", "2099-12-25");
		const result = await insertSemester("Even", "2100-01-02", "2100-01-02");
		expect(result.rowCount).toBe(1);
	});

	it("requires a semester ID in the deployed database", async () => {
		const { rows } = await db.query(
			`SELECT is_nullable FROM information_schema.columns
			 WHERE table_schema = current_schema()
			   AND table_name = 'ConcessionApplication'
			   AND column_name = 'semesterId'`
		);
		expect(rows).toEqual([{ is_nullable: "NO" }]);
	});
});
