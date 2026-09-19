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
	assignBookletToConcession,
	submitConcessionApplication,
	reviewConcessionApplication,
	getConcessionApplicationDetails
} from "@/actions/concession";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Concession Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let booklet: any;
	let adminUser: any;
	let studentUser: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		studentUser = await createTestStudent(prisma, { status: "Approved" });

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

	describe("admin review and booklet assignment", () => {
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

		it("allows admin to approve a pending application", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reviewConcessionApplication(createdAppId, "Approved");
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Approved");
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

		it("allows admin to reject an application and fetch details including reviewer and submissionCount", async () => {
			await authenticateAs(adminUser.user.id);
			const rejectRes = await reviewConcessionApplication(createdAppId, "Rejected", "Incorrect pass type selected");
			expect(rejectRes.isSuccess).toBe(true);

			const detailsRes = await getConcessionApplicationDetails(createdAppId);
			expect(detailsRes.isSuccess).toBe(true);
			if (detailsRes.isSuccess) {
				expect(detailsRes.data.status).toBe("Rejected");
				expect(detailsRes.data.rejectionReason).toBe("Incorrect pass type selected");
				expect(detailsRes.data.submissionCount).toBeGreaterThanOrEqual(1);
				expect(detailsRes.data.reviewedBy?.user.name).toBe(adminUser.user.name);
				expect(detailsRes.data.reviewedAt).not.toBeNull();
			}

			const allAppsRes = await getAllApplications({ page: 1, pageSize: 10 });
			expect(allAppsRes.isSuccess).toBe(true);
			if (allAppsRes.isSuccess) {
				const appInList = allAppsRes.data.data.find((a) => a.id === createdAppId);
				expect(appInList?.reviewedBy?.user.name).toBe(adminUser.user.name);
				expect(appInList?.submissionCount).toBeGreaterThanOrEqual(1);
			}
		});
	});
});
