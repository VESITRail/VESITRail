import {
	getTestPrisma,
	cleanAllTables,
	authenticateAs,
	unauthenticate,
	createTestAdmin,
	createTestStudent,
	seedReferenceData
} from "./helpers";
import { getStudentProfile, getAdminProfile } from "@/actions/profile";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Profile Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: any;
	let studentUser: any;
	let inactiveAdmin: any;
	let pendingStudent: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		inactiveAdmin = await createTestAdmin(prisma, { isActive: false });
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

	describe("getStudentProfile", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await getStudentProfile();
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when called by an admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getStudentProfile();
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when student status is Pending", async () => {
			await authenticateAs(pendingStudent.user.id);
			const res = await getStudentProfile();
			expect(res.isSuccess).toBe(false);
		});

		it("returns student profile for approved student", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getStudentProfile();

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.userId).toBe(studentUser.user.id);
				expect(res.data.status).toBe("Approved");
				expect(res.data.class).toBeDefined();
				expect(res.data.class.year).toBeDefined();
				expect(res.data.class.branch).toBeDefined();
				expect(res.data.station).toBeDefined();
				expect(res.data.preferredConcessionClass).toBeDefined();
				expect(res.data.preferredConcessionPeriod).toBeDefined();
			}
		});
	});

	describe("getAdminProfile", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await getAdminProfile();
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when called by a student", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getAdminProfile();
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when admin is inactive", async () => {
			await authenticateAs(inactiveAdmin.user.id);
			const res = await getAdminProfile();
			expect(res.isSuccess).toBe(false);
		});

		it("returns admin profile with review counts for active admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAdminProfile();

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.userId).toBe(adminUser.user.id);
				expect(res.data.user.email).toBe(adminUser.user.email);
				expect(typeof res.data.studentsCount).toBe("number");
				expect(typeof res.data.applicationsCount).toBe("number");
				expect(typeof res.data.addressChangesCount).toBe("number");
			}
		});
	});
});
