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
import { updateStudentMobileNumber, getStudentMobileStatus } from "@/actions/update-mobile";

describe("Update Mobile Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: any;
	let studentUser: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		studentUser = await createTestStudent(prisma, { status: "Approved" });
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	beforeEach(() => {
		unauthenticate();
	});

	describe("updateStudentMobileNumber", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await updateStudentMobileNumber("9876543210");
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when called by admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await updateStudentMobileNumber("9876543210");
			expect(res.isSuccess).toBe(false);
		});

		it("returns validation error for invalid mobile number format", async () => {
			await authenticateAs(studentUser.user.id);

			const invalidNumbers = ["12345", "1234567890", "abcd567890", "987654321"];
			for (const num of invalidNumbers) {
				const res = await updateStudentMobileNumber(num);
				expect(res.isSuccess).toBe(false);
			}
		});

		it("updates student mobile number successfully for valid Indian mobile", async () => {
			await authenticateAs(studentUser.user.id);
			const newMobile = "9820123456";

			const res = await updateStudentMobileNumber(newMobile);
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.mobileNumber).toBe(newMobile);
			}

			const dbStudent = await prisma.student.findUnique({
				where: { userId: studentUser.user.id }
			});
			expect(dbStudent?.mobileNumber).toBe(newMobile);
		});
	});

	describe("getStudentMobileStatus", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await getStudentMobileStatus();
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when called by admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getStudentMobileStatus();
			expect(res.isSuccess).toBe(false);
		});

		it("returns hasMobileNumber: true when student has valid mobile", async () => {
			await prisma.student.update({
				data: { mobileNumber: "9876543210" },
				where: { userId: studentUser.user.id }
			});

			await authenticateAs(studentUser.user.id);
			const res = await getStudentMobileStatus();

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.hasMobileNumber).toBe(true);
			}
		});

		it("returns hasMobileNumber: false when student has null or invalid mobile", async () => {
			await prisma.student.update({
				data: { mobileNumber: "12345" },
				where: { userId: studentUser.user.id }
			});

			await authenticateAs(studentUser.user.id);
			const res = await getStudentMobileStatus();

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.hasMobileNumber).toBe(false);
			}
		});
	});
});
