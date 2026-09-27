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
import { getAdminAnalytics, generateAdminAnalyticsPDF } from "@/actions/analytics";

describe("Analytics Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: any;
	let studentUser: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		studentUser = await createTestStudent(prisma, { status: "Approved" });
		adminUser = await createTestAdmin(prisma, { isActive: true, name: "Analytics Admin" });

		await prisma.student.update({
			where: { userId: studentUser.user.id },
			data: {
				reviewedById: adminUser.user.id,
				reviewedAt: new Date()
			}
		});

		await prisma.addressChange.create({
			data: {
				status: "Approved",
				reviewedAt: new Date(),
				newAddress: "New Address",
				currentAddress: "Old Address",
				studentId: studentUser.user.id,
				reviewedById: adminUser.user.id,
				newStationId: studentUser.student.stationId,
				currentStationId: studentUser.student.stationId
			}
		});

		await prisma.concessionApplication.create({
			data: {
				status: "Approved",
				reviewedAt: new Date(),
				applicationType: "New",
				studentId: studentUser.user.id,
				reviewedById: adminUser.user.id,
				stationId: studentUser.student.stationId,
				concessionClassId: studentUser.student.preferredConcessionClassId,
				concessionPeriodId: studentUser.student.preferredConcessionPeriodId
			}
		});
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	beforeEach(() => {
		unauthenticate();
	});

	describe("getAdminAnalytics", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await getAdminAnalytics({
				page: 1,
				pageSize: 10,
				timeRange: "all"
			});
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when user is student", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getAdminAnalytics({
				page: 1,
				pageSize: 10,
				timeRange: "all"
			});
			expect(res.isSuccess).toBe(false);
		});

		it("returns analytics data and combinedStats for admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAdminAnalytics({
				page: 1,
				pageSize: 10,
				timeRange: "all"
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBeGreaterThanOrEqual(1);
				expect(res.data.combinedStats.studentsReviewedCount).toBeGreaterThanOrEqual(1);
				expect(res.data.combinedStats.addressChangesCount).toBeGreaterThanOrEqual(1);
				expect(res.data.combinedStats.applicationsCount).toBeGreaterThanOrEqual(1);
				expect(res.data.combinedStats.totalContribution).toBeGreaterThanOrEqual(3);

				const adminEntry = res.data.data.find((item) => item.adminId === adminUser.user.id);
				expect(adminEntry).toBeDefined();
				expect(adminEntry?.studentsCount).toBeGreaterThanOrEqual(1);
				expect(adminEntry?.applicationsCount).toBeGreaterThanOrEqual(1);
				expect(adminEntry?.addressChangesCount).toBeGreaterThanOrEqual(1);
			}
		});

		it("filters analytics by search query matching admin name", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAdminAnalytics({
				page: 1,
				pageSize: 10,
				timeRange: "all",
				searchQuery: "Analytics Admin"
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBeGreaterThanOrEqual(1);
				expect(res.data.data[0].name).toBe("Analytics Admin");
			}
		});

		it("returns empty result when search query has no match", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAdminAnalytics({
				page: 1,
				pageSize: 10,
				timeRange: "all",
				searchQuery: "NonexistentAdminNameXYZ"
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBe(0);
				expect(res.data.data).toHaveLength(0);
			}
		});

		it("supports various timeRange filters", async () => {
			await authenticateAs(adminUser.user.id);
			for (const timeRange of ["1m", "3m", "6m", "1y", "all"] as const) {
				const res = await getAdminAnalytics({
					page: 1,
					timeRange,
					pageSize: 10
				});
				expect(res.isSuccess).toBe(true);
			}
		});

		it("handles pagination boundaries", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAdminAnalytics({
				page: 1,
				pageSize: 1,
				timeRange: "all"
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.data.length).toBeLessThanOrEqual(1);
				expect(res.data.currentPage).toBe(1);
			}
		});
	});

	describe("generateAdminAnalyticsPDF", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await generateAdminAnalyticsPDF({
				timeRange: "all"
			});
			expect(res.isSuccess).toBe(false);
		});

		it("generates a valid base64 data URI PDF for admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await generateAdminAnalyticsPDF({
				timeRange: "all",
				searchQuery: "Analytics"
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).toContain("data:application/pdf;base64,");
			}
		});
	});
});
