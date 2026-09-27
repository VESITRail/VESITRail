import {
	SEED,
	getTestPrisma,
	cleanAllTables,
	authenticateAs,
	unauthenticate,
	createTestAdmin,
	createTestStudent,
	seedReferenceData
} from "./helpers";
import {
	getStudentPreferences,
	updateStudentPreferences,
	getNotificationPreferences,
	updateNotificationPreferences
} from "@/actions/settings";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { updateStudentMobileNumber, getStudentMobileStatus } from "@/actions/update-mobile";

describe("Settings Integration", () => {
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

	describe("concession preferences", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await getStudentPreferences();
			expect(res.isSuccess).toBe(false);

			const updateRes = await updateStudentPreferences({
				preferredConcessionClassId: SEED.concessionClasses[0].id,
				preferredConcessionPeriodId: SEED.concessionPeriods[0].id
			});
			expect(updateRes.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when admin attempts student-only concession preferences", async () => {
			await authenticateAs(adminUser.user.id);
			const getRes = await getStudentPreferences();
			expect(getRes.isSuccess).toBe(false);

			const updateRes = await updateStudentPreferences({
				preferredConcessionClassId: SEED.concessionClasses[0].id,
				preferredConcessionPeriodId: SEED.concessionPeriods[0].id
			});
			expect(updateRes.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when student is not approved", async () => {
			await authenticateAs(pendingStudent.user.id);
			const getRes = await getStudentPreferences();
			expect(getRes.isSuccess).toBe(false);

			const updateRes = await updateStudentPreferences({
				preferredConcessionClassId: SEED.concessionClasses[0].id,
				preferredConcessionPeriodId: SEED.concessionPeriods[0].id
			});
			expect(updateRes.isSuccess).toBe(false);
		});

		it("retrieves current student preferences", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getStudentPreferences();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.preferredConcessionClass.id).toBe(SEED.concessionClasses[0].id);
				expect(res.data.preferredConcessionPeriod.id).toBe(SEED.concessionPeriods[0].id);
			}
		});

		it("fails with validation error for invalid/nonexistent classId or periodId", async () => {
			await authenticateAs(studentUser.user.id);

			const badClassRes = await updateStudentPreferences({
				preferredConcessionPeriodId: SEED.concessionPeriods[0].id,
				preferredConcessionClassId: "00000000-0000-0000-0000-000000000000"
			});
			expect(badClassRes.isSuccess).toBe(false);
			if (!badClassRes.isSuccess) {
				expect(badClassRes.error.message).toContain("concession class is currently unavailable");
			}

			const badPeriodRes = await updateStudentPreferences({
				preferredConcessionClassId: SEED.concessionClasses[0].id,
				preferredConcessionPeriodId: "00000000-0000-0000-0000-000000000000"
			});
			expect(badPeriodRes.isSuccess).toBe(false);
			if (!badPeriodRes.isSuccess) {
				expect(badPeriodRes.error.message).toContain("concession period is currently unavailable");
			}
		});

		it("updates student concession preferences", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await updateStudentPreferences({
				preferredConcessionClassId: SEED.concessionClasses[1].id,
				preferredConcessionPeriodId: SEED.concessionPeriods[1].id
			});
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.preferredConcessionClass.id).toBe(SEED.concessionClasses[1].id);
				expect(res.data.preferredConcessionPeriod.id).toBe(SEED.concessionPeriods[1].id);
			}
		});
	});

	describe("notification preferences", () => {
		it("fetches user notification preferences", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getNotificationPreferences();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.pushEnabled).toBe(true);
				expect(res.data.emailEnabled).toBe(true);
			}
		});

		it("updates user notification preferences", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await updateNotificationPreferences({
				pushEnabled: false,
				emailEnabled: false
			});
			expect(res.isSuccess).toBe(true);

			const verifyRes = await getNotificationPreferences();
			if (verifyRes.isSuccess) {
				expect(verifyRes.data.pushEnabled).toBe(false);
				expect(verifyRes.data.emailEnabled).toBe(false);
			}
		});
	});

	describe("mobile number updates", () => {
		it("checks student mobile status", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getStudentMobileStatus();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.hasMobileNumber).toBe(true);
			}
		});

		it("updates mobile number with valid format", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await updateStudentMobileNumber("9123456780");
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.mobileNumber).toBe("9123456780");
			}
		});

		it("fails with invalid mobile number", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await updateStudentMobileNumber("1234");
			expect(res.isSuccess).toBe(false);
		});
	});
});
