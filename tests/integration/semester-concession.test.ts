import {
	SEED,
	getTestPrisma,
	authenticateAs,
	cleanAllTables,
	unauthenticate,
	createTestAdmin,
	createTestBooklet,
	createTestStudent,
	seedReferenceData,
	createTestSemester,
	createTestApplication
} from "./helpers";
import {
	getConcessions,
	reviewConcessionApplication,
	submitConcessionApplication,
	approveConcessionWithBooklet,
	submitConcessionResubmission,
	getConcessionApplicationState
} from "@/actions/concession";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Semester-aware concession applications", () => {
	const { prisma, pool } = getTestPrisma();
	const details = {
		stationId: SEED.stations[0].id,
		concessionClassId: SEED.concessionClasses[0].id,
		concessionPeriodId: SEED.concessionPeriods[0].id
	};
	let studentId: string;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);
	});

	beforeEach(async () => {
		unauthenticate();
		const { user } = await createTestStudent(prisma);
		studentId = user.id;
	});

	afterEach(async () => {
		unauthenticate();
		await prisma.concessionApplication.deleteMany();
		await prisma.academicSemester.deleteMany();
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	it.each([
		{ startOffset: 8, endOffset: 80, open: false },
		{ startOffset: 7, endOffset: 80, open: true },
		{ startOffset: 0, endOffset: 80, open: true },
		{ startOffset: -80, endOffset: 0, open: true },
		{ startOffset: -80, endOffset: -1, open: false }
	])("enforces the application window with start offset $startOffset and end offset $endOffset", async (scenario) => {
		const semester = await createTestSemester(prisma, scenario);
		await authenticateAs(studentId);

		const state = await getConcessionApplicationState();
		expect(state).toMatchObject({ isSuccess: true, data: { semester: scenario.open ? { id: semester.id } : null } });
		const submission = await submitConcessionApplication({ ...details, expectedSemesterId: semester.id });
		expect(submission.isSuccess).toBe(scenario.open);

		const stored = await prisma.concessionApplication.findMany({ where: { studentId } });
		if (scenario.open) {
			expect(state).toMatchObject({ data: { upcomingSemester: null } });
			expect(stored).toMatchObject([{ semesterId: semester.id, applicationType: "New", previousApplicationId: null }]);
		} else {
			expect(stored).toHaveLength(0);
		}
	});

	it("returns the next semester's academic year, term, and opening date when applications are closed", async () => {
		await authenticateAs(studentId);

		expect(await getConcessionApplicationState()).toMatchObject({
			isSuccess: true,
			data: { semester: null, upcomingSemester: null }
		});

		const semester = await createTestSemester(prisma, { startOffset: 22, endOffset: 90, term: "Even" });
		const academicYearStart = semester.startDate.getUTCFullYear() - 1;

		await prisma.academicSemester.update({ where: { id: semester.id }, data: { academicYearStart } });
		await createTestSemester(prisma, { startOffset: 120, endOffset: 180 });

		const opening = new Date(semester.startDate);
		opening.setUTCDate(opening.getUTCDate() - 7);

		expect(await getConcessionApplicationState()).toMatchObject({
			isSuccess: true,
			data: { semester: null, upcomingSemester: { academicYearStart, term: "Even", openingDate: opening } }
		});
	});

	it("rejects both an application and a correction when their window closes after loading the form", async () => {
		const semester = await createTestSemester(prisma);

		const rejected = await createTestApplication(prisma, {
			studentId,
			status: "Rejected",
			semesterId: semester.id,
			rejectionReason: "Verify class"
		});

		await authenticateAs(studentId);

		expect(await getConcessionApplicationState()).toMatchObject({
			isSuccess: true,
			data: { correction: { id: rejected.id }, semester: { id: semester.id } }
		});

		const yesterday = new Date();
		yesterday.setUTCDate(yesterday.getUTCDate() - 2);

		await prisma.academicSemester.update({ where: { id: semester.id }, data: { endDate: yesterday } });
		const submitted = { ...details, expectedSemesterId: semester.id };

		for (const result of [
			await submitConcessionApplication(submitted),
			await submitConcessionResubmission(rejected.id, submitted)
		]) {
			expect(result).toMatchObject({ isSuccess: false, error: { field: "semesterId" } });
		}
		expect(await prisma.concessionApplication.findUniqueOrThrow({ where: { id: rejected.id } })).toMatchObject({
			status: "Rejected",
			submissionCount: 1,
			rejectionReason: "Verify class"
		});
	});

	it("opens a new application with only prior-semester history", async () => {
		const prior = await createTestSemester(prisma, { startOffset: -180, endOffset: -20 });
		const current = await createTestSemester(prisma, { startOffset: 7, endOffset: 80, term: "Even" });

		const oldPass = await createTestApplication(prisma, {
			studentId,
			status: "Issued",
			semesterId: prior.id,
			issuedAt: prior.startDate
		});

		const oldRejection = await createTestApplication(prisma, {
			studentId,
			status: "Rejected",
			semesterId: prior.id,
			applicationType: "Renewal",
			rejectionReason: "Unreadable pass"
		});
		await authenticateAs(studentId);

		const state = await getConcessionApplicationState();
		expect(state).toMatchObject({
			isSuccess: true,
			data: {
				correction: null,
				previousPass: null,
				applicationType: "New",
				semester: { id: current.id },
				latestApplication: { id: oldRejection.id, rejectionReason: "Unreadable pass" }
			}
		});

		expect(await submitConcessionApplication({ ...details, expectedSemesterId: prior.id })).toMatchObject({
			isSuccess: false,
			error: { field: "semesterId" }
		});

		expect(
			await submitConcessionResubmission(oldRejection.id, { ...details, expectedSemesterId: current.id })
		).toMatchObject({
			isSuccess: false,
			error: { field: "applicationId" }
		});

		const result = await submitConcessionApplication({ ...details, expectedSemesterId: current.id });
		expect(result).toMatchObject({ isSuccess: true, data: { applicationType: "New", previousApplication: null } });

		const historyResult = await getConcessions({ page: 1, pageSize: 10 });
		expect(historyResult).toMatchObject({
			isSuccess: true,
			data: {
				data: expect.arrayContaining([
					expect.objectContaining({ id: oldRejection.id, rejectionReason: "Unreadable pass" })
				])
			}
		});
		expect(
			await prisma.concessionApplication.findMany({ where: { studentId }, orderBy: { shortId: "asc" } })
		).toMatchObject([
			{ id: oldPass.id, status: "Issued" },
			{ id: oldRejection.id, status: "Rejected", submissionCount: 1 },
			{ status: "Pending", semesterId: current.id, previousApplicationId: null, submissionCount: 1 }
		]);
	});

	it.each(["Pending", "Approved"] as const)(
		"resubmits a same-semester first application rejected from %s",
		async (status) => {
			const semester = await createTestSemester(prisma);
			const original = await createTestApplication(prisma, { studentId, semesterId: semester.id, status });

			const { user: admin } = await createTestAdmin(prisma);
			await authenticateAs(admin.id);

			expect(await reviewConcessionApplication(original.id, "Rejected", "Verify details")).toMatchObject({
				isSuccess: true
			});

			await authenticateAs(studentId);
			const submitted = { ...details, expectedSemesterId: semester.id };
			const result = await submitConcessionResubmission(original.id, submitted);

			expect(result).toMatchObject({ isSuccess: true, data: { id: original.id, applicationType: "New" } });

			expect(await prisma.concessionApplication.findMany({ where: { studentId } })).toMatchObject([
				{
					id: original.id,
					reviewedAt: null,
					status: "Pending",
					reviewedById: null,
					submissionCount: 2,
					rejectionReason: null,
					semesterId: semester.id,
					shortId: original.shortId,
					previousApplicationId: null,
					createdAt: original.createdAt
				}
			]);
		}
	);

	it("derives Renewal and the history pass from the latest issued application in the open semester", async () => {
		const prior = await createTestSemester(prisma, { startOffset: -240, endOffset: -98 });
		const semester = await createTestSemester(prisma, { term: "Even" });
		const oldIssueDate = semester.startDate;

		await createTestApplication(prisma, {
			studentId,
			status: "Issued",
			issuedAt: oldIssueDate,
			semesterId: semester.id
		});

		const predecessor = await createTestApplication(prisma, {
			studentId,
			status: "Issued",
			semesterId: semester.id,
			reviewedAt: oldIssueDate,
			applicationType: "Renewal"
		});

		await createTestApplication(prisma, {
			studentId,
			status: "Issued",
			semesterId: prior.id,
			issuedAt: prior.startDate
		});
		await authenticateAs(studentId);

		expect(await getConcessionApplicationState()).toMatchObject({
			isSuccess: true,
			data: { applicationType: "Renewal", previousPass: { id: predecessor.id }, blocker: null }
		});

		const craftedPayload = {
			...details,
			applicationType: "New",
			studentId: "different-student",
			expectedSemesterId: semester.id,
			previousApplicationId: "different-pass"
		};

		expect(await submitConcessionApplication(craftedPayload)).toMatchObject({
			isSuccess: true,
			data: { applicationType: "Renewal", previousApplication: { id: predecessor.id } }
		});

		expect(
			await prisma.concessionApplication.findFirstOrThrow({ where: { studentId, status: "Pending" } })
		).toMatchObject({
			semesterId: semester.id,
			previousApplicationId: predecessor.id
		});
	});

	it("refuses a fresh form once a rejection needs correction", async () => {
		const semester = await createTestSemester(prisma);
		const rejected = await createTestApplication(prisma, { studentId, semesterId: semester.id, status: "Rejected" });
		await authenticateAs(studentId);

		expect(await submitConcessionApplication({ ...details, expectedSemesterId: semester.id })).toMatchObject({
			isSuccess: false,
			error: { field: "status" }
		});

		expect(await prisma.concessionApplication.findUniqueOrThrow({ where: { id: rejected.id } })).toMatchObject({
			status: "Rejected",
			submissionCount: 1
		});
	});

	it("keeps pending review, approval, and a late-issued pass tied to the previous term", async () => {
		const prior = await createTestSemester(prisma, { startOffset: -100, endOffset: -1 });
		const current = await createTestSemester(prisma, { startOffset: 7, endOffset: 100, term: "Even" });
		const application = await createTestApplication(prisma, { studentId, semesterId: prior.id });
		const { user: admin } = await createTestAdmin(prisma);
		const booklet = await createTestBooklet(prisma);
		const submitted = { ...details, expectedSemesterId: current.id };

		await authenticateAs(studentId);
		expect(await getConcessionApplicationState()).toMatchObject({
			isSuccess: true,
			data: { blocker: { status: "Pending" } }
		});

		expect(await submitConcessionApplication(submitted)).toMatchObject({
			isSuccess: false,
			error: { field: "status" }
		});

		await authenticateAs(admin.id);
		expect(await reviewConcessionApplication(application.id, "Approved")).toMatchObject({ isSuccess: true });

		await authenticateAs(studentId);
		expect(await getConcessionApplicationState()).toMatchObject({
			isSuccess: true,
			data: { blocker: { status: "Approved" } }
		});

		expect(await submitConcessionApplication(submitted)).toMatchObject({
			isSuccess: false,
			error: { field: "status" }
		});

		await authenticateAs(admin.id);
		expect(await approveConcessionWithBooklet(application.id, booklet.id, 0)).toMatchObject({ isSuccess: true });

		await authenticateAs(studentId);
		expect(await getConcessionApplicationState()).toMatchObject({
			isSuccess: true,
			data: { semester: { id: current.id }, blocker: { status: "ActivePass" } }
		});

		expect(await submitConcessionApplication(submitted)).toMatchObject({
			isSuccess: false,
			error: { field: "status" }
		});

		expect(await prisma.concessionApplication.findMany({ where: { studentId } })).toMatchObject([
			{ id: application.id, semesterId: prior.id, status: "Issued" }
		]);
	});

	it("rejects a submission and correction without the semester shown on the form", async () => {
		const semester = await createTestSemester(prisma);
		const rejected = await createTestApplication(prisma, { studentId, semesterId: semester.id, status: "Rejected" });

		await authenticateAs(studentId);
		const incompleteForm = details as Parameters<typeof submitConcessionApplication>[0];

		for (const result of [
			await submitConcessionApplication(incompleteForm),
			await submitConcessionResubmission(rejected.id, incompleteForm)
		]) {
			expect(result).toMatchObject({ isSuccess: false, error: { field: "expectedSemesterId" } });
		}

		expect(await prisma.concessionApplication.findMany({ where: { studentId } })).toMatchObject([
			{ id: rejected.id, status: "Rejected", submissionCount: 1 }
		]);
	});

	it("requires an approved student session for both the page state and submission", async () => {
		const { user: pending } = await createTestStudent(prisma, { status: "Pending" });
		const semester = await createTestSemester(prisma);

		expect(await getConcessionApplicationState()).toMatchObject({ isSuccess: false, error: { code: "UNAUTHORIZED" } });
		expect(await submitConcessionApplication({ ...details, expectedSemesterId: semester.id })).toMatchObject({
			isSuccess: false,
			error: { code: "UNAUTHORIZED" }
		});

		await authenticateAs(pending.id);
		expect(await getConcessionApplicationState()).toMatchObject({ isSuccess: false, error: { code: "FORBIDDEN" } });
		expect(await submitConcessionApplication({ ...details, expectedSemesterId: semester.id })).toMatchObject({
			isSuccess: false,
			error: { code: "FORBIDDEN" }
		});
	});

	it("rejects a forged home station even when it is active", async () => {
		const semester = await createTestSemester(prisma);
		await authenticateAs(studentId);

		const result = await submitConcessionApplication({
			...details,
			stationId: SEED.stations[1].id,
			expectedSemesterId: semester.id
		});

		expect(result).toMatchObject({ isSuccess: false, error: { field: "stationId" } });
		expect(await prisma.concessionApplication.count({ where: { studentId } })).toBe(0);
	});
});
