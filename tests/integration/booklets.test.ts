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
	getBooklet,
	getBooklets,
	createBooklet,
	updateBooklet,
	deleteBooklet,
	getAvailableBooklets,
	getBookletApplications,
	recalculateBookletStatus,
	getBookletAssignedStudents,
	reorderBookletApplications,
	recalculateAllBookletStatuses,
	updateBookletAnchorCoordinates
} from "@/actions/booklets";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Booklets Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: any;
	let studentUser: any;
	let seededBooklet: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		studentUser = await createTestStudent(prisma, { status: "Approved" });

		seededBooklet = await prisma.concessionBooklet.create({
			data: {
				anchorX: 10,
				anchorY: 15,
				totalPages: 50,
				status: "Available",
				serialEndNumber: "0900049",
				serialStartNumber: "0900000"
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

	describe("createBooklet", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await createBooklet({
				anchorX: 10,
				anchorY: 15,
				serialStartNumber: "0910000"
			});
			expect(res.isSuccess).toBe(false);
		});

		it("returns error for invalid serial format", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await createBooklet({
				anchorX: 10,
				anchorY: 15,
				serialStartNumber: "INVALID-SERIAL"
			});
			expect(res.isSuccess).toBe(false);
		});

		it("creates a booklet and computes serialEndNumber", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await createBooklet({
				anchorX: 10,
				anchorY: 15,
				serialStartNumber: "0910000"
			});
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.serialStartNumber).toBe("0910000");
				expect(res.data.serialEndNumber).toBe("0910049");
				expect(res.data.status).toBe("Available");
			}
		});

		it("returns error for duplicate serialStartNumber", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await createBooklet({
				anchorX: 10,
				anchorY: 15,
				serialStartNumber: "0900000"
			});
			expect(res.isSuccess).toBe(false);
		});
	});

	describe("getBooklets", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getBooklets({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(false);
		});

		it("fetches paginated booklets for admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getBooklets({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBeGreaterThanOrEqual(1);
			}
		});

		it("filters booklets by search query and status", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getBooklets({
				page: 1,
				pageSize: 10,
				searchQuery: "0900000",
				statusFilter: "Available"
			});
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.data.some((b) => b.serialStartNumber === "0900000")).toBe(true);
			}
		});
	});

	describe("getBooklet", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getBooklet(seededBooklet.id);
			expect(res.isSuccess).toBe(false);
		});

		it("returns booklet by ID for admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getBooklet(seededBooklet.id);
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.id).toBe(seededBooklet.id);
			}
		});

		it("returns validation error when booklet not found", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getBooklet("00000000-0000-0000-0000-000000000000");
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("not found");
			}
		});
	});

	describe("updateBooklet", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await updateBooklet(seededBooklet.id, {
				anchorX: 12,
				anchorY: 18,
				isExhausted: false,
				serialStartNumber: "0900000"
			});
			expect(res.isSuccess).toBe(false);
		});

		it("updates booklet anchor and serial start number", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await updateBooklet(seededBooklet.id, {
				anchorX: 15,
				anchorY: 20,
				isExhausted: false,
				serialStartNumber: "0900001"
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.anchorX).toBe(15);
				expect(res.data.anchorY).toBe(20);
				expect(res.data.serialStartNumber).toBe("0900001");
			}

			await updateBooklet(seededBooklet.id, {
				anchorX: 10,
				anchorY: 15,
				isExhausted: false,
				serialStartNumber: "0900000"
			});
		});

		it("rejects overlapping serial number range with existing booklet", async () => {
			await authenticateAs(adminUser.user.id);

			const secondBooklet = await createBooklet({
				anchorX: 0,
				anchorY: 0,
				serialStartNumber: "0920000"
			});
			expect(secondBooklet.isSuccess).toBe(true);

			if (secondBooklet.isSuccess) {
				const overlapRes = await updateBooklet(secondBooklet.data.id, {
					anchorX: 0,
					anchorY: 0,
					isExhausted: false,
					serialStartNumber: "0900010"
				});

				expect(overlapRes.isSuccess).toBe(false);
				if (!overlapRes.isSuccess) {
					expect(overlapRes.error.message).toContain("overlaps");
				}

				await deleteBooklet(secondBooklet.data.id);
			}
		});

		it("returns error for invalid serial format on update", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await updateBooklet(seededBooklet.id, {
				anchorX: 10,
				anchorY: 15,
				isExhausted: false,
				serialStartNumber: "BAD-SERIAL"
			});
			expect(res.isSuccess).toBe(false);
		});
	});

	describe("deleteBooklet", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await deleteBooklet(seededBooklet.id);
			expect(res.isSuccess).toBe(false);
		});

		it("prevents deleting a booklet that has assigned applications", async () => {
			const activeBooklet = await prisma.concessionBooklet.create({
				data: {
					anchorX: 0,
					anchorY: 0,
					totalPages: 50,
					status: "InUse",
					serialEndNumber: "0940049",
					serialStartNumber: "0940000"
				}
			});

			await prisma.concessionApplication.create({
				data: {
					pageOffset: 0,
					status: "Issued",
					applicationType: "New",
					studentId: studentUser.user.id,
					stationId: SEED.stations[0].id,
					concessionBookletId: activeBooklet.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			await authenticateAs(adminUser.user.id);
			const delRes = await deleteBooklet(activeBooklet.id);
			expect(delRes.isSuccess).toBe(false);
			if (!delRes.isSuccess) {
				expect(delRes.error.message).toContain("Cannot delete booklet that has applications");
			}

			await prisma.concessionApplication.deleteMany({
				where: { concessionBookletId: activeBooklet.id }
			});
			await deleteBooklet(activeBooklet.id);
		});

		it("deletes an unused booklet", async () => {
			await authenticateAs(adminUser.user.id);
			const created = await createBooklet({
				anchorX: 5,
				anchorY: 5,
				serialStartNumber: "0950000"
			});
			expect(created.isSuccess).toBe(true);

			if (created.isSuccess) {
				const delRes = await deleteBooklet(created.data.id);
				expect(delRes.isSuccess).toBe(true);
			}
		});
	});

	describe("getAvailableBooklets", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getAvailableBooklets();
			expect(res.isSuccess).toBe(false);
		});

		it("returns only Available and InUse booklets for admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAvailableBooklets();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.every((b) => b.status === "Available" || b.status === "InUse")).toBe(true);
			}
		});
	});

	describe("getBookletApplications and getBookletAssignedStudents", () => {
		let testApp1: any;
		let testApp2: any;
		let testApp3: any;
		let testBooklet: any;

		beforeAll(async () => {
			testBooklet = await prisma.concessionBooklet.create({
				data: {
					anchorX: 0,
					anchorY: 0,
					totalPages: 50,
					status: "InUse",
					serialEndNumber: "0960049",
					serialStartNumber: "0960000"
				}
			});

			testApp1 = await prisma.concessionApplication.create({
				data: {
					pageOffset: 0,
					status: "Issued",
					applicationType: "New",
					studentId: studentUser.user.id,
					stationId: SEED.stations[0].id,
					concessionBookletId: testBooklet.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			testApp2 = await prisma.concessionApplication.create({
				data: {
					pageOffset: 2,
					status: "Issued",
					applicationType: "New",
					studentId: studentUser.user.id,
					stationId: SEED.stations[0].id,
					concessionBookletId: testBooklet.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			testApp3 = await prisma.concessionApplication.create({
				data: {
					pageOffset: 3,
					status: "Issued",
					applicationType: "Renewal",
					studentId: studentUser.user.id,
					stationId: SEED.stations[0].id,
					previousApplicationId: testApp1.id,
					concessionBookletId: testBooklet.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});
		});

		it("returns UNAUTHORIZED for non-admin on getBookletApplications", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getBookletApplications(testBooklet.id);
			expect(res.isSuccess).toBe(false);
		});

		it("fetches applications and derives damaged/cancelled page for gaps (offset 1)", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getBookletApplications(testBooklet.id);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.booklet.id).toBe(testBooklet.id);
				expect(res.data.totalCount).toBeGreaterThanOrEqual(4);

				const damagedPage = res.data.data.find(
					(item) => "isDamaged" in item && item.isDamaged === true && item.pageNumber === 2
				);
				expect(damagedPage).toBeDefined();
			}
		});

		it("includes previousApplication and booklet details for Renewal applications", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getBookletApplications(testBooklet.id);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				const renewalItem = res.data.data.find((item) => "id" in item && item.id === testApp3.id) as any;
				expect(renewalItem).toBeDefined();
				expect(renewalItem.applicationType).toBe("Renewal");
				expect(renewalItem.previousApplication?.id).toBe(testApp1.id);
				expect(renewalItem.previousApplication?.pageOffset).toBe(0);
				expect(renewalItem.previousApplication?.concessionBooklet?.serialStartNumber).toBe("0960000");
			}
		});

		it("returns assigned students mapping for booklet", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getBookletAssignedStudents(testBooklet.id);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data[0]).toBeDefined();
				expect(res.data[0].applicationId).toBe(testApp1.id);
				expect(res.data[2]).toBeDefined();
				expect(res.data[2].applicationId).toBe(testApp2.id);
			}
		});
	});

	describe("updateBookletAnchorCoordinates", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await updateBookletAnchorCoordinates(seededBooklet.id, 5, 5);
			expect(res.isSuccess).toBe(false);
		});

		it("rejects coordinates outside [-50, 100] range", async () => {
			await authenticateAs(adminUser.user.id);

			const resLow = await updateBookletAnchorCoordinates(seededBooklet.id, -51, 0);
			expect(resLow.isSuccess).toBe(false);

			const resHigh = await updateBookletAnchorCoordinates(seededBooklet.id, 0, 101);
			expect(resHigh.isSuccess).toBe(false);
		});

		it("updates anchor coordinates successfully", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await updateBookletAnchorCoordinates(seededBooklet.id, 25, 30);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.anchorX).toBe(25);
				expect(res.data.anchorY).toBe(30);
			}
		});
	});

	describe("recalculateBookletStatus & recalculateAllBookletStatuses", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res1 = await recalculateBookletStatus(seededBooklet.id);
			expect(res1.isSuccess).toBe(false);

			const res2 = await recalculateAllBookletStatuses();
			expect(res2.isSuccess).toBe(false);
		});

		it("recalculates status for a single booklet and all booklets", async () => {
			await authenticateAs(adminUser.user.id);
			const resSingle = await recalculateBookletStatus(seededBooklet.id);
			expect(resSingle.isSuccess).toBe(true);

			const resAll = await recalculateAllBookletStatuses();
			expect(resAll.isSuccess).toBe(true);
			if (resAll.isSuccess) {
				expect(typeof resAll.data.updated).toBe("number");
			}
		});
	});

	describe("reorderBookletApplications", () => {
		let appA: any;
		let appB: any;
		let reorderBooklet: any;

		beforeAll(async () => {
			reorderBooklet = await prisma.concessionBooklet.create({
				data: {
					anchorX: 0,
					anchorY: 0,
					totalPages: 50,
					status: "InUse",
					serialEndNumber: "0970049",
					serialStartNumber: "0970000"
				}
			});

			appA = await prisma.concessionApplication.create({
				data: {
					pageOffset: 0,
					status: "Issued",
					applicationType: "New",
					studentId: studentUser.user.id,
					stationId: SEED.stations[0].id,
					concessionBookletId: reorderBooklet.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			appB = await prisma.concessionApplication.create({
				data: {
					pageOffset: 1,
					status: "Issued",
					applicationType: "New",
					studentId: studentUser.user.id,
					stationId: SEED.stations[0].id,
					concessionBookletId: reorderBooklet.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});
		});

		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await reorderBookletApplications(reorderBooklet.id, [
				{ applicationId: appA.id, pageOffset: 1 },
				{ applicationId: appB.id, pageOffset: 0 }
			]);
			expect(res.isSuccess).toBe(false);
		});

		it("rejects duplicate target page offsets", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reorderBookletApplications(reorderBooklet.id, [
				{ applicationId: appA.id, pageOffset: 5 },
				{ applicationId: appB.id, pageOffset: 5 }
			]);
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Duplicate page offset");
			}
		});

		it("rejects page offset outside booklet totalPages", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reorderBookletApplications(reorderBooklet.id, [{ applicationId: appA.id, pageOffset: 50 }]);
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Invalid page offset");
			}
		});

		it("successfully swaps application slots within booklet", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reorderBookletApplications(reorderBooklet.id, [
				{ applicationId: appA.id, pageOffset: 1 },
				{ applicationId: appB.id, pageOffset: 0 }
			]);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.success).toBe(true);
				expect(res.data.updatedCount).toBe(2);
			}

			const updatedA = await prisma.concessionApplication.findUnique({ where: { id: appA.id } });
			const updatedB = await prisma.concessionApplication.findUnique({ where: { id: appB.id } });
			expect(updatedA?.pageOffset).toBe(1);
			expect(updatedB?.pageOffset).toBe(0);
		});
	});
});
