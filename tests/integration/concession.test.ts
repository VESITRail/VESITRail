import {
	SEED,
	getTestPrisma,
	cleanAllTables,
	authenticateAs,
	unauthenticate,
	createTestAdmin,
	createTestBooklet,
	createTestStudent,
	seedReferenceData,
	createTestApplication
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
import { sendConcessionNotification } from "@/lib/notifications";
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
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	beforeEach(async () => {
		unauthenticate();
		booklet = await createTestBooklet(prisma);
		studentUser = await createTestStudent(prisma, { status: "Approved" });
		pendingStudent = await createTestStudent(prisma, { status: "Pending" });
		secondStudent = await createTestStudent(prisma, { status: "Approved" });
	});

	describe("submitConcessionApplication", () => {
		it("fails when student status is not Approved", async () => {
			await authenticateAs(pendingStudent.user.id);
			const res = await submitConcessionApplication({
				applicationType: "New",
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

		it("prevents creating/submitting a new application when student already has a Pending application", async () => {
			await createTestApplication(prisma, { studentId: studentUser.user.id });
			await authenticateAs(studentUser.user.id);

			const res = await submitConcessionApplication({
				applicationType: "New",
				stationId: SEED.stations[1].id,
				studentId: studentUser.user.id,
				concessionClassId: SEED.concessionClasses[1].id,
				concessionPeriodId: SEED.concessionPeriods[1].id
			});

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("already have a concession application under review");
			}
		});
	});

	describe("getConcessions & getLastApplication", () => {
		it("fetches concessions for student", async () => {
			await createTestApplication(prisma, { studentId: studentUser.user.id });
			await authenticateAs(studentUser.user.id);
			const res = await getConcessions({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBeGreaterThanOrEqual(1);
			}
		});

		it("fetches the last application for student", async () => {
			await createTestApplication(prisma, { studentId: studentUser.user.id });
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

		const createApp = async (
			status: "Pending" | "Approved" | "Rejected" | "Issued",
			extra: Omit<Parameters<typeof createTestApplication>[1], "studentId" | "status"> = {}
		) => {
			const app = await createTestApplication(prisma, { status, studentId: studentUser.user.id, ...extra });
			createdAppId = app.id;
		};

		const createIssuedApp = () =>
			createApp("Issued", {
				pageOffset: 0,
				issuedAt: new Date(),
				reviewedAt: new Date(),
				concessionBookletId: booklet.id
			});

		it("allows admin to get all applications", async () => {
			await createApp("Pending");
			await authenticateAs(adminUser.user.id);
			const res = await getAllApplications({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBeGreaterThanOrEqual(1);
			}
		});

		it("requires rejectionReason when rejecting", async () => {
			await createApp("Pending");
			await authenticateAs(adminUser.user.id);
			const res = await reviewConcessionApplication(createdAppId, "Rejected", "");
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Rejection reason is required");
			}
		});

		it("allows admin to approve a pending application", async () => {
			await createApp("Pending");
			await authenticateAs(adminUser.user.id);
			const res = await reviewConcessionApplication(createdAppId, "Approved");
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Approved");
			}
		});

		it("prevents creating a new application when student already has an Approved application", async () => {
			await createApp("Approved");
			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionApplication({
				applicationType: "New",
				stationId: SEED.stations[0].id,
				studentId: studentUser.user.id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("already have an approved concession application");
			}
		});

		it("prevents re-approving an already approved application (state-transition race)", async () => {
			await createApp("Approved");
			await authenticateAs(adminUser.user.id);
			const res = await reviewConcessionApplication(createdAppId, "Approved");
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("already been reviewed");
			}
		});

		it("allows admin to assign a booklet slip to the approved application", async () => {
			await createApp("Approved");
			await authenticateAs(adminUser.user.id);
			const res = await assignBookletToConcession(createdAppId, booklet.id, 0);
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Issued");
				expect(res.data.pageOffset).toBe(0);
			}
		});

		it("prevents creating a new application while an issued concession pass is still active", async () => {
			await createIssuedApp();
			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionApplication({
				applicationType: "New",
				stationId: SEED.stations[0].id,
				studentId: studentUser.user.id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("concession pass is still active");
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
			await createIssuedApp();
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
			await createApp("Rejected", { rejectionReason: "Incorrect pass type selected" });
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

		beforeEach(async () => {
			const app = await createTestApplication(prisma, {
				status: "Rejected",
				studentId: studentUser.user.id,
				rejectionReason: "Incorrect pass type selected"
			});
			rejectedAppId = app.id;
		});

		it("fails if application does not belong to authenticated student", async () => {
			await authenticateAs(secondStudent.user.id);
			const res = await submitConcessionResubmission(rejectedAppId, {
				applicationType: "New",
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(false);
		});

		it("rejects resubmitting a first-time rejected application as a renewal when no pass was ever issued", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionResubmission(rejectedAppId, {
				applicationType: "Renewal",
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("previously issued");
			}

			const stored = await prisma.concessionApplication.findUnique({ where: { id: rejectedAppId } });
			expect(stored?.status).toBe("Rejected");
			expect(stored?.applicationType).toBe("New");
			expect(stored?.previousApplicationId).toBeNull();
		});

		it("returns the latest issued pass as previousApplication for a rejected last application", async () => {
			await authenticateAs(secondStudent.user.id);

			const firstTimeRejected = await prisma.concessionApplication.create({
				data: {
					status: "Rejected",
					applicationType: "New",
					stationId: SEED.stations[0].id,
					studentId: secondStudent.user.id,
					rejectionReason: "Test rejection",
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			const firstTimeRes = await getLastApplication();
			expect(firstTimeRes.isSuccess).toBe(true);
			if (firstTimeRes.isSuccess) {
				expect(firstTimeRes.data?.id).toBe(firstTimeRejected.id);
				expect(firstTimeRes.data?.previousApplication).toBeNull();
			}

			const issuedApp = await prisma.concessionApplication.create({
				data: {
					status: "Issued",
					issuedAt: new Date(),
					reviewedAt: new Date(),
					applicationType: "New",
					stationId: SEED.stations[0].id,
					studentId: secondStudent.user.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});
			const laterRejected = await prisma.concessionApplication.create({
				data: {
					status: "Rejected",
					applicationType: "New",
					stationId: SEED.stations[0].id,
					studentId: secondStudent.user.id,
					rejectionReason: "Test rejection",
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			const res = await getLastApplication();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data?.id).toBe(laterRejected.id);
				expect(res.data?.previousApplication?.id).toBe(issuedApp.id);
			}

			await prisma.concessionApplication.deleteMany({
				where: { id: { in: [firstTimeRejected.id, issuedApp.id, laterRejected.id] } }
			});
		});

		it("rejects resubmitting as a renewal while the latest issued pass is still active", async () => {
			const activeIssuedApp = await prisma.concessionApplication.create({
				data: {
					status: "Issued",
					issuedAt: new Date(),
					reviewedAt: new Date(),
					applicationType: "New",
					stationId: SEED.stations[0].id,
					studentId: secondStudent.user.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});
			const rejectedAfterIssue = await prisma.concessionApplication.create({
				data: {
					status: "Rejected",
					applicationType: "New",
					stationId: SEED.stations[0].id,
					studentId: secondStudent.user.id,
					rejectionReason: "Test rejection",
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			await authenticateAs(secondStudent.user.id);
			const res = await submitConcessionResubmission(rejectedAfterIssue.id, {
				applicationType: "Renewal",
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("still active");
			}

			await prisma.concessionApplication.deleteMany({
				where: { id: { in: [activeIssuedApp.id, rejectedAfterIssue.id] } }
			});
		});

		it("allows student to resubmit their rejected application", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionResubmission(rejectedAppId, {
				applicationType: "New",
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
			const firstResubmission = await submitConcessionResubmission(rejectedAppId, {
				applicationType: "New",
				stationId: SEED.stations[1].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});
			expect(firstResubmission.isSuccess).toBe(true);
			const res = await submitConcessionResubmission(rejectedAppId, {
				applicationType: "New",
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

		const issueApp = async () => {
			await authenticateAs(adminUser.user.id);
			const res = await approveConcessionWithBooklet(issuedAppId, booklet.id, 5);
			expect(res.isSuccess).toBe(true);
		};

		beforeEach(async () => {
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
			await issueApp();
			await authenticateAs(adminUser.user.id);
			const res = await reprintConcessionApplication(issuedAppId, booklet.id, 5);
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Cannot reprint to the same voucher slip");
			}
		});

		it("reprintConcessionApplication succeeds when moving to a different slip offset", async () => {
			await issueApp();
			await authenticateAs(adminUser.user.id);
			const res = await reprintConcessionApplication(issuedAppId, booklet.id, 6);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Issued");
				expect(res.data.pageOffset).toBe(6);
			}
		});

		it("updateConcessionIssueDate fails with invalid date", async () => {
			await issueApp();
			await authenticateAs(adminUser.user.id);
			const res = await updateConcessionIssueDate(issuedAppId, "invalid-date-string");
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Invalid issue date");
			}
		});

		it("updateConcessionIssueDate updates date for issued application", async () => {
			await issueApp();
			await authenticateAs(adminUser.user.id);
			const newDate = new Date("2026-05-10T10:00:00Z");
			const res = await updateConcessionIssueDate(issuedAppId, newDate);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(new Date(res.data.issuedAt!).toISOString()).toBe(newDate.toISOString());
			}
		});

		it("getStudentConcessionHistory returns application history with derived certificates", async () => {
			await issueApp();
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

	describe("Renewal Concession Application Lifecycle", () => {
		let renewalApp: any;
		let initialIssuedApp: any;

		const submitRenewal = async () => {
			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionApplication({
				applicationType: "Renewal",
				stationId: SEED.stations[0].id,
				studentId: studentUser.user.id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});
			expect(res.isSuccess).toBe(true);
			renewalApp = res.isSuccess ? res.data : null;
		};

		beforeEach(async () => {
			const expiredDate = new Date();
			expiredDate.setMonth(expiredDate.getMonth() - 2);

			initialIssuedApp = await prisma.concessionApplication.create({
				data: {
					pageOffset: 10,
					status: "Issued",
					issuedAt: expiredDate,
					applicationType: "New",
					reviewedAt: expiredDate,
					studentId: studentUser.user.id,
					stationId: SEED.stations[0].id,
					concessionBookletId: booklet.id,
					reviewedById: adminUser.user.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});
		});

		it("fails when submitting a renewal for a student with no previously issued pass", async () => {
			const newcomer = await createTestStudent(prisma, { status: "Approved" });

			await authenticateAs(newcomer.user.id);
			const res = await submitConcessionApplication({
				applicationType: "Renewal",
				studentId: newcomer.user.id,
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("previously issued");
			}
		});

		it("fails when the latest issued pass is still active (unexpired)", async () => {
			const activePass = await prisma.concessionApplication.create({
				data: {
					status: "Issued",
					issuedAt: new Date(),
					applicationType: "New",
					studentId: studentUser.user.id,
					stationId: SEED.stations[0].id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionApplication({
				applicationType: "Renewal",
				stationId: SEED.stations[0].id,
				studentId: studentUser.user.id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("concession pass is still active");
			}

			await prisma.concessionApplication.delete({ where: { id: activePass.id } });
		});

		it("submits a renewal application linked by the server to the latest expired issued pass", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionApplication({
				applicationType: "Renewal",
				stationId: SEED.stations[0].id,
				studentId: studentUser.user.id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data?.status).toBe("Pending");
				expect(res.data?.applicationType).toBe("Renewal");
				expect(res.data?.previousApplication?.id).toBe(initialIssuedApp.id);
				expect(res.data?.previousApplication?.status).toBe("Issued");
				expect(res.data?.previousApplication?.station).toBeDefined();
				expect(res.data?.previousApplication?.concessionClass).toBeDefined();
				expect(res.data?.previousApplication?.concessionPeriod).toBeDefined();
				renewalApp = res.data;
			}
		});

		it("filters student concessions by typeFilter (Renewal vs New)", async () => {
			await submitRenewal();
			await authenticateAs(studentUser.user.id);

			const renewalRes = await getConcessions({ page: 1, pageSize: 10, typeFilter: "Renewal" });
			expect(renewalRes.isSuccess).toBe(true);
			if (renewalRes.isSuccess) {
				expect(renewalRes.data.data.every((app) => app?.applicationType === "Renewal")).toBe(true);
				expect(renewalRes.data.data.some((app) => app?.id === renewalApp.id)).toBe(true);
			}

			const newRes = await getConcessions({ page: 1, pageSize: 10, typeFilter: "New" });
			expect(newRes.isSuccess).toBe(true);
			if (newRes.isSuccess) {
				expect(newRes.data.data.every((app) => app?.applicationType === "New")).toBe(true);
			}
		});

		it("filters admin applications by typeFilter (Renewal vs New)", async () => {
			await submitRenewal();
			await authenticateAs(adminUser.user.id);

			const adminRenewalRes = await getAllApplications({ page: 1, pageSize: 10, typeFilter: "Renewal" });
			expect(adminRenewalRes.isSuccess).toBe(true);
			if (adminRenewalRes.isSuccess) {
				expect(adminRenewalRes.data.data.every((app) => app.applicationType === "Renewal")).toBe(true);
				expect(adminRenewalRes.data.data.some((app) => app.id === renewalApp.id)).toBe(true);
			}

			const adminNewRes = await getAllApplications({ page: 1, pageSize: 10, typeFilter: "New" });
			expect(adminNewRes.isSuccess).toBe(true);
			if (adminNewRes.isSuccess) {
				expect(adminNewRes.data.data.every((app) => app.applicationType === "New")).toBe(true);
			}
		});

		it("handles rejection and resubmission of a renewal application preserving previousApplicationId", async () => {
			await submitRenewal();
			await authenticateAs(adminUser.user.id);
			const rejectRes = await reviewConcessionApplication(
				renewalApp.id,
				"Rejected",
				"Previous season ticket pass expired more than allowed window"
			);
			expect(rejectRes.isSuccess).toBe(true);

			await authenticateAs(studentUser.user.id);
			const resubmitRes = await submitConcessionResubmission(renewalApp.id, {
				applicationType: "Renewal",
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[1].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(resubmitRes.isSuccess).toBe(true);
			if (resubmitRes.isSuccess) {
				expect(resubmitRes.data?.status).toBe("Pending");
				expect(resubmitRes.data?.applicationType).toBe("Renewal");
				expect(resubmitRes.data?.previousApplication?.id).toBe(initialIssuedApp.id);
				expect(resubmitRes.data?.rejectionReason).toBeNull();
				expect(resubmitRes.data?.submissionCount).toBeGreaterThanOrEqual(2);
			}
		});

		it("allows a rejected renewal to be resubmitted as a new application", async () => {
			await submitRenewal();
			await authenticateAs(adminUser.user.id);
			const rejectRes = await reviewConcessionApplication(renewalApp.id, "Rejected", "Should have applied as new");
			expect(rejectRes.isSuccess).toBe(true);

			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionResubmission(renewalApp.id, {
				applicationType: "New",
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(true);

			const stored = await prisma.concessionApplication.findUnique({ where: { id: renewalApp.id } });
			expect(stored?.status).toBe("Pending");
			expect(stored?.applicationType).toBe("New");
			expect(stored?.previousApplicationId).toBeNull();
		});

		it("resubmits a rejected application as a renewal linked to the latest issued pass", async () => {
			await submitRenewal();
			await authenticateAs(adminUser.user.id);
			const rejectRes = await reviewConcessionApplication(renewalApp.id, "Rejected", "Should have applied as renewal");
			expect(rejectRes.isSuccess).toBe(true);

			await authenticateAs(studentUser.user.id);
			const res = await submitConcessionResubmission(renewalApp.id, {
				applicationType: "Renewal",
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[1].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data?.status).toBe("Pending");
				expect(res.data?.applicationType).toBe("Renewal");
				expect(res.data?.previousApplication?.id).toBe(initialIssuedApp.id);
			}
		});

		it("approves and assigns booklet to the resubmitted renewal application", async () => {
			await submitRenewal();
			await authenticateAs(adminUser.user.id);
			const approveRes = await reviewConcessionApplication(renewalApp.id, "Approved");
			expect(approveRes.isSuccess).toBe(true);

			expect(sendConcessionNotification).toHaveBeenCalledWith(
				studentUser.user.id,
				renewalApp.id,
				true,
				"Renewal",
				undefined
			);

			const assignRes = await assignBookletToConcession(renewalApp.id, booklet.id, 11);
			expect(assignRes.isSuccess).toBe(true);
			if (assignRes.isSuccess) {
				expect(assignRes.data.status).toBe("Issued");
				expect(assignRes.data.pageOffset).toBe(11);
			}

			await authenticateAs(studentUser.user.id);
			const lastAppRes = await getLastApplication();
			expect(lastAppRes.isSuccess).toBe(true);
			if (lastAppRes.isSuccess) {
				expect(lastAppRes.data?.id).toBe(renewalApp.id);
				expect(lastAppRes.data?.applicationType).toBe("Renewal");
				expect(lastAppRes.data?.status).toBe("Issued");
			}
		});
	});
});
