import {
	getTestPrisma,
	cleanAllTables,
	authenticateAs,
	unauthenticate,
	createTestAdmin,
	createTestStudent,
	seedReferenceData
} from "./helpers";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
	getYears,
	getClasses,
	getBranches,
	getStations,
	getStudentStation,
	getConcessionClasses,
	getConcessionPeriods,
	getStudentPreferences
} from "@/actions/utils";

describe("Utils Action Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: any;
	let studentUser: any;
	let pendingStudent: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		studentUser = await createTestStudent(prisma, { status: "Approved" });
		pendingStudent = await createTestStudent(prisma, { status: "Pending" });
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	beforeEach(() => {
		unauthenticate();
	});

	describe("Reference data getters with populated DB", () => {
		it("getYears returns sorted years", async () => {
			const res = await getYears();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.length).toBeGreaterThan(0);
				expect(res.data.map((y) => y.code)).toEqual(expect.arrayContaining(["FY", "SY", "TY", "LY"]));
			}
		});

		it("getBranches returns branches", async () => {
			const res = await getBranches();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.length).toBeGreaterThan(0);
				expect(res.data.map((b) => b.code)).toEqual(expect.arrayContaining(["CMPN", "INFT"]));
			}
		});

		it("getClasses returns classes", async () => {
			const res = await getClasses();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.length).toBeGreaterThan(0);
			}
		});

		it("getStations returns stations", async () => {
			const res = await getStations();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.length).toBeGreaterThan(0);
			}
		});

		it("getConcessionClasses returns concession classes", async () => {
			const res = await getConcessionClasses();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.length).toBeGreaterThan(0);
			}
		});

		it("getConcessionPeriods returns concession periods", async () => {
			const res = await getConcessionPeriods();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.length).toBeGreaterThan(0);
			}
		});
	});

	describe("Reference data getters with empty DB", () => {
		beforeAll(async () => {
			await cleanAllTables(prisma);
			await prisma.class.deleteMany();
			await prisma.year.deleteMany();
			await prisma.branch.deleteMany();
			await prisma.station.deleteMany();
			await prisma.concessionClass.deleteMany();
			await prisma.concessionPeriod.deleteMany();
		});

		afterAll(async () => {
			await seedReferenceData(prisma);
			adminUser = await createTestAdmin(prisma, { isActive: true });
			studentUser = await createTestStudent(prisma, { status: "Approved" });
			pendingStudent = await createTestStudent(prisma, { status: "Pending" });
		});

		it("returns empty arrays when tables are empty", async () => {
			const [years, branches, classes, stations, concessionClasses, concessionPeriods] = await Promise.all([
				getYears(),
				getBranches(),
				getClasses(),
				getStations(),
				getConcessionClasses(),
				getConcessionPeriods()
			]);

			expect(years.isSuccess).toBe(true);
			if (years.isSuccess) expect(years.data).toHaveLength(0);

			expect(branches.isSuccess).toBe(true);
			if (branches.isSuccess) expect(branches.data).toHaveLength(0);

			expect(classes.isSuccess).toBe(true);
			if (classes.isSuccess) expect(classes.data).toHaveLength(0);

			expect(stations.isSuccess).toBe(true);
			if (stations.isSuccess) expect(stations.data).toHaveLength(0);

			expect(concessionClasses.isSuccess).toBe(true);
			if (concessionClasses.isSuccess) expect(concessionClasses.data).toHaveLength(0);

			expect(concessionPeriods.isSuccess).toBe(true);
			if (concessionPeriods.isSuccess) expect(concessionPeriods.data).toHaveLength(0);
		});
	});

	describe("getStudentPreferences", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await getStudentPreferences();
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when called by admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getStudentPreferences();
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when student is not approved", async () => {
			await authenticateAs(pendingStudent.user.id);
			const res = await getStudentPreferences();
			expect(res.isSuccess).toBe(false);
		});

		it("returns preferences for approved student", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getStudentPreferences();

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.preferredConcessionClass).toBeDefined();
				expect(res.data.preferredConcessionPeriod).toBeDefined();
			}
		});
	});

	describe("getStudentStation", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await getStudentStation();
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when called by admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getStudentStation();
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when student is not approved", async () => {
			await authenticateAs(pendingStudent.user.id);
			const res = await getStudentStation();
			expect(res.isSuccess).toBe(false);
		});

		it("returns station for approved student", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getStudentStation();

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.id).toBe(studentUser.student.stationId);
				expect(res.data.code).toBeDefined();
				expect(res.data.name).toBeDefined();
			}
		});
	});
});
