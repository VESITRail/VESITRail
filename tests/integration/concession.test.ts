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
	getConcessions,
	getLastApplication,
	getAllApplications,
	updateConcessionIssueDate,
	assignBookletToConcession,
	submitConcessionApplication,
	reviewConcessionApplication,
	getStudentConcessionHistory,
	reprintConcessionApplication,
	approveConcessionWithBooklet,
	submitConcessionResubmission,
	getConcessionApplicationDetails
} from "@/actions/concession";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Concession Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let booklet: any;
	let adminUser: any;
	let studentUser: any;
	let secondStudent: any;
	let pendingStudent: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		studentUser = await createTestStudent(prisma, { status: "Approved" });
		pendingStudent = await createTestStudent(prisma, { status: "Pending" });
		secondStudent = await createTestStudent(prisma, { status: "Approved" });

		booklet = await prisma.concessionBooklet.create({
			data: {
				anchorX: 10,
				anchorY: 20,
				totalPages: 50,
				status: "Available",
				serialEndNumber: "0807599",
				serialStartNumber: "0807550"
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

	describe("submitConcessionApplication", () => {
		it("fails when student status is not Approved", async () => {
			await authenticateAs(pendingStudent.user.id);
			const res = await submitConcessionApplication({
				applicationType: "New",
				previousApplicationId: null,
				stationId: SEED.stations[0].id,
				studentId: pendingStudent.user.id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(false);
		});

		it("fails when invalid station or concession class is passed", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionApplication({
				applicationType: "New",
				previousApplicationId: null,
				studentId: studentUser.user.id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id,
				stationId: "00000000-0000-0000-0000-000000000000"
			});

			expect(res.isSuccess).toBe(false);
		});

		it("submits a new concession application for approved student", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionApplication({
				applicationType: "New",
				previousApplicationId: null,
				stationId: SEED.stations[0].id,
				studentId: studentUser.user.id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data?.status).toBe("Pending");
				expect(res.data?.applicationType).toBe("New");
				expect(res.data?.submissionCount).toBe(1);
			}
		});

		it("updates existing application and increments submissionCount on duplicate submission while Pending", async () => {
			await authenticateAs(studentUser.user.id);

			const res = await submitConcessionApplication({
				applicationType: "New",
				previousApplicationId: null,
				stationId: SEED.stations[1].id,
				studentId: studentUser.user.id,
				concessionClassId: SEED.concessionClasses[1].id,
				concessionPeriodId: SEED.concessionPeriods[1].id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data?.status).toBe("Pending");
				expect(res.data?.submissionCount).toBe(2);
			}
		});
	});

	describe("getConcessions & getLastApplication", () => {
		it("fetches concessions for student", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getConcessions({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBeGreaterThanOrEqual(1);
			}
		});

		it("fetches the last application for student", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getLastApplication();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).not.toBeNull();
				expect(res.data?.status).toBe("Pending");
			}
		});
	});

	describe("Non-admin authorization guards for admin functions", () => {
		it("rejects non-admin access across all admin operations", async () => {
			await authenticateAs(studentUser.user.id);

			const res1 = await getAllApplications({ page: 1, pageSize: 10 });
			expect(res1.isSuccess).toBe(false);

			const res2 = await reviewConcessionApplication("dummy-id", "Approved");
			expect(res2.isSuccess).toBe(false);

			const res3 = await assignBookletToConcession("dummy-id", "dummy-booklet", 0);
			expect(res3.isSuccess).toBe(false);

			const res4 = await approveConcessionWithBooklet("dummy-id", "dummy-booklet", 0);
			expect(res4.isSuccess).toBe(false);

			const res5 = await reprintConcessionApplication("dummy-id", "dummy-booklet", 1);
			expect(res5.isSuccess).toBe(false);

			const res6 = await updateConcessionIssueDate("dummy-id", new Date());
			expect(res6.isSuccess).toBe(false);

			const res7 = await getConcessionApplicationDetails("dummy-id");
			expect(res7.isSuccess).toBe(false);

			const res8 = await getStudentConcessionHistory(studentUser.user.id);
			expect(res8.isSuccess).toBe(false);
		});
	});

	describe("admin review and state-transition races", () => {
		let createdAppId: string;

		beforeAll(async () => {
			const app = await prisma.concessionApplication.findFirst({
				where: { studentId: studentUser.user.id }
			});
			createdAppId = app!.id;
		});

		it("allows admin to get all applications", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAllApplications({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBeGreaterThanOrEqual(1);
			}
		});

		it("requires rejectionReason when rejecting", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reviewConcessionApplication(createdAppId, "Rejected", "");
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Rejection reason is required");
			}
		});

		it("allows admin to approve a pending application", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reviewConcessionApplication(createdAppId, "Approved");
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Approved");
			}
		});

		it("prevents re-approving an already approved application (state-transition race)", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reviewConcessionApplication(createdAppId, "Approved");
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("already been reviewed");
			}
		});

		it("allows admin to assign a booklet slip to the approved application", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await assignBookletToConcession(createdAppId, booklet.id, 0);
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Issued");
				expect(res.data.pageOffset).toBe(0);
			}
		});

		it("fails assignBookletToConcession when booklet is already assigned to this application", async () => {
			const appWithBooklet = await prisma.concessionApplication.create({
				data: {
					status: "Approved",
					applicationType: "New",
					stationId: SEED.stations[0].id,
					concessionBookletId: booklet.id,
					studentId: secondStudent.user.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			await authenticateAs(adminUser.user.id);
			const res = await assignBookletToConcession(appWithBooklet.id, booklet.id, 1);
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("already assigned to this application");
			}
		});

		it("fails assignBookletToConcession when booklet is exhausted", async () => {
			const exhaustedBooklet = await prisma.concessionBooklet.create({
				data: {
					anchorX: 0,
					anchorY: 0,
					totalPages: 50,
					status: "Exhausted",
					serialEndNumber: "0808049",
					serialStartNumber: "0808000"
				}
			});

			const newApp = await prisma.concessionApplication.create({
				data: {
					status: "Approved",
					applicationType: "New",
					stationId: SEED.stations[0].id,
					studentId: secondStudent.user.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			await authenticateAs(adminUser.user.id);
			const res = await assignBookletToConcession(newApp.id, exhaustedBooklet.id, 0);
			expect(res.isSuccess).toBe(false);
		});

		it("allows admin to reject an application and unlinks booklet", async () => {
			await authenticateAs(adminUser.user.id);
			const rejectRes = await reviewConcessionApplication(createdAppId, "Rejected", "Incorrect pass type selected");
			expect(rejectRes.isSuccess).toBe(true);

			const detailsRes = await getConcessionApplicationDetails(createdAppId);
			expect(detailsRes.isSuccess).toBe(true);
			if (detailsRes.isSuccess) {
				expect(detailsRes.data.status).toBe("Rejected");
				expect(detailsRes.data.rejectionReason).toBe("Incorrect pass type selected");
				expect(detailsRes.data.concessionBookletId).toBeNull();
			}
		});

		it("prevents rejecting an already rejected application (state-transition race)", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reviewConcessionApplication(createdAppId, "Rejected", "Another rejection reason");
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("already rejected");
			}
		});
	});

	describe("submitConcessionResubmission", () => {
		let rejectedAppId: string;

		beforeAll(async () => {
			const app = await prisma.concessionApplication.findFirst({
				where: { studentId: studentUser.user.id, status: "Rejected" }
			});
			rejectedAppId = app!.id;
		});

		it("fails if application does not belong to authenticated student", async () => {
			await authenticateAs(secondStudent.user.id);
			const res = await submitConcessionResubmission(rejectedAppId, {
				applicationType: "New",
				previousApplicationId: null,
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(false);
		});

		it("allows student to resubmit their rejected application", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionResubmission(rejectedAppId, {
				applicationType: "New",
				previousApplicationId: null,
				stationId: SEED.stations[1].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data?.status).toBe("Pending");
				expect(res.data?.rejectionReason).toBeNull();
				expect(res.data?.submissionCount).toBeGreaterThanOrEqual(2);
			}
		});

		it("fails when trying to resubmit an application that is already Pending", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionResubmission(rejectedAppId, {
				applicationType: "New",
				previousApplicationId: null,
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Only rejected applications can be resubmitted");
			}
		});
	});

	describe("approveConcessionWithBooklet, reprintConcessionApplication, updateConcessionIssueDate", () => {
		let issuedAppId: string;

		beforeAll(async () => {
			const app = await prisma.concessionApplication.create({
				data: {
					status: "Pending",
					applicationType: "New",
					stationId: SEED.stations[0].id,
					studentId: secondStudent.user.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});
			issuedAppId = app.id;
		});

		it("approves application directly with booklet via approveConcessionWithBooklet", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await approveConcessionWithBooklet(issuedAppId, booklet.id, 5);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Issued");
				expect(res.data.pageOffset).toBe(5);
			}
		});

		it("reprintConcessionApplication fails when reprinting to exact same voucher slip", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reprintConcessionApplication(issuedAppId, booklet.id, 5);
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Cannot reprint to the same voucher slip");
			}
		});

		it("reprintConcessionApplication succeeds when moving to a different slip offset", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reprintConcessionApplication(issuedAppId, booklet.id, 6);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Issued");
				expect(res.data.pageOffset).toBe(6);
			}
		});

		it("updateConcessionIssueDate fails with invalid date", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await updateConcessionIssueDate(issuedAppId, "invalid-date-string");
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Invalid issue date");
			}
		});

		it("updateConcessionIssueDate updates date for issued application", async () => {
			await authenticateAs(adminUser.user.id);
			const newDate = new Date("2026-05-10T10:00:00Z");
			const res = await updateConcessionIssueDate(issuedAppId, newDate);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(new Date(res.data.issuedAt!).toISOString()).toBe(newDate.toISOString());
			}
		});

		it("getStudentConcessionHistory returns application history with derived certificates", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getStudentConcessionHistory(secondStudent.user.id);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.length).toBeGreaterThanOrEqual(1);
				const issuedItem = res.data.find((item) => item.id === issuedAppId);
				expect(issuedItem?.derivedCertificateNo).toBeDefined();
			}
		});
	});
});
