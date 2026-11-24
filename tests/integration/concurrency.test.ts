import {
	SEED,
	getTestPrisma,
	cleanAllTables,
	authenticateAs,
	unauthenticate,
	createTestAdmin,
	createTestStudent,
	seedReferenceData,
	createTestSemester,
	createTestApplication
} from "./helpers";
import {
	assignBookletToConcession,
	updateConcessionIssueDate,
	reviewConcessionApplication,
	submitConcessionApplication,
	submitConcessionResubmission
} from "@/actions/concession";
import { auth } from "./test-auth";
import type { PoolClient } from "pg";
import { setTestHeaders } from "./headers-state";
import { SUBMISSION_LOCK_NAMESPACE } from "@/lib/advisory-lock";
import { approveStudent, rejectStudent } from "@/actions/student";
import { updateAcademicSemester } from "@/actions/academic-semester";
import { getCollegeCalendarDate } from "@/lib/academic-semester-window";
import { submitAddressChangeApplication } from "@/actions/change-address";
import { reviewAddressChangeRequest } from "@/actions/address-change-requests";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Concurrency Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let semesterId: string;
	let bookletCounter = 0;
	let adminUser: Awaited<ReturnType<typeof createTestAdmin>>;

	const successes = (results: { isSuccess: boolean }[]) => results.filter((r) => r.isSuccess).length;

	const loginHeaders = async (userId: string): Promise<Headers> => {
		const ctx = await auth.$context;
		const { headers } = await (ctx as any).test.login({ userId });
		return headers;
	};

	const newConcession = () => ({
		expectedSemesterId: semesterId,
		stationId: SEED.stations[0].id,
		concessionClassId: SEED.concessionClasses[0].id,
		concessionPeriodId: SEED.concessionPeriods[0].id
	});

	async function runQueuedChanges<First, Second>(
		holdLock: (client: PoolClient) => Promise<unknown>,
		startFirst: () => Promise<First>,
		startSecond: () => Promise<Second>
	) {
		const client = await pool.connect();
		let first: Promise<First> | undefined;
		let second: Promise<Second> | undefined;

		try {
			await client.query("BEGIN");
			await holdLock(client);

			const { rows } = await client.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");
			const waitForBlocked = async () => {
				const result = await pool.query("SELECT pid FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))", [
					rows[0].pid
				]);
				return result.rowCount;
			};

			first = startFirst();
			await expect.poll(waitForBlocked, { timeout: 2_000 }).toBe(1);

			second = startSecond();
			await expect.poll(waitForBlocked, { timeout: 2_000 }).toBe(2);
		} finally {
			await client.query("ROLLBACK");
			client.release();
			await Promise.allSettled([first, second]);
		}

		return [await first, await second] as const;
	}

	const newAddressChange = () => ({
		newStationId: SEED.stations[1].id,
		currentStationId: SEED.stations[0].id,
		currentAddress: "Test Address, Mumbai 400001",
		newAddress: "Flat 4, Lake Road, Mumbai 400078",
		verificationDocUrl: "https://test-r2.example.com/address-doc.pdf"
	});

	const createApplication = async (studentId: string, status: "Pending" | "Approved" | "Rejected" = "Pending") =>
		prisma.concessionApplication.create({
			data: {
				status,
				studentId,
				semesterId,
				submissionCount: 1,
				applicationType: "New",
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			}
		});

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);
		semesterId = (await createTestSemester(prisma)).id;
		adminUser = await createTestAdmin(prisma, { isActive: true });
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	beforeEach(() => {
		unauthenticate();
	});

	it("allows exactly one of two simultaneous approvals of the same concession application", async () => {
		const { user } = await createTestStudent(prisma, { status: "Approved" });
		const application = await createApplication(user.id);
		await authenticateAs(adminUser.user.id);

		const results = await Promise.all([
			reviewConcessionApplication(application.id, "Approved"),
			reviewConcessionApplication(application.id, "Approved")
		]);

		expect(successes(results)).toBe(1);
	});

	it("assigns a booklet slot to exactly one of two simultaneous applications", async () => {
		const { user: first } = await createTestStudent(prisma, { status: "Approved" });
		const { user: second } = await createTestStudent(prisma, { status: "Approved" });
		const firstApp = await createApplication(first.id, "Approved");
		const secondApp = await createApplication(second.id, "Approved");
		bookletCounter++;
		const start = 7300001 + bookletCounter * 100;
		const booklet = await prisma.concessionBooklet.create({
			data: {
				anchorX: 0,
				anchorY: 0,
				totalPages: 50,
				status: "Available",
				serialStartNumber: `0${start}`,
				serialEndNumber: `0${start + 49}`
			}
		});
		await authenticateAs(adminUser.user.id);

		const results = await Promise.all([
			assignBookletToConcession(firstApp.id, booklet.id, 5),
			assignBookletToConcession(secondApp.id, booklet.id, 5)
		]);

		expect(successes(results)).toBe(1);
		const holders = await prisma.concessionApplication.count({
			where: { concessionBookletId: booklet.id, pageOffset: 5 }
		});
		expect(holders).toBe(1);
	});

	it("allows exactly one of two simultaneous approvals of the same student", async () => {
		const { user } = await createTestStudent(prisma, { status: "Pending" });
		await authenticateAs(adminUser.user.id);

		const results = await Promise.all([approveStudent({ studentId: user.id }), approveStudent({ studentId: user.id })]);

		expect(successes(results)).toBe(1);
	});

	it("allows exactly one of two simultaneous approvals of the same address change request", async () => {
		const { user } = await createTestStudent(prisma, { status: "Approved" });
		const request = await prisma.addressChange.create({
			data: {
				status: "Pending",
				submissionCount: 1,
				studentId: user.id,
				newStationId: SEED.stations[1].id,
				newAddress: "New Address Ghatkopar",
				currentAddress: "Old Address Chembur",
				currentStationId: SEED.stations[0].id,
				verificationDocUrl: "https://test-r2.example.com/address-doc.pdf"
			}
		});
		await authenticateAs(adminUser.user.id);

		const results = await Promise.all([
			reviewAddressChangeRequest(request.id, "Approved"),
			reviewAddressChangeRequest(request.id, "Approved")
		]);

		expect(successes(results)).toBe(1);
	});

	it("rejects exactly one of two simultaneous rejections of the same student", async () => {
		const { user } = await createTestStudent(prisma, { status: "Pending" });
		await authenticateAs(adminUser.user.id);

		const results = await Promise.all([
			rejectStudent({ studentId: user.id, rejectionReason: "First reviewer" }),
			rejectStudent({ studentId: user.id, rejectionReason: "Second reviewer" })
		]);

		expect(successes(results)).toBe(1);
	});

	it("creates only one pending concession when a student submits twice at the same time", async () => {
		const { user } = await createTestStudent(prisma, { status: "Approved" });
		await authenticateAs(user.id);

		const results = await Promise.all([
			submitConcessionApplication(newConcession()),
			submitConcessionApplication(newConcession())
		]);

		expect(successes(results)).toBe(1);
		expect(await prisma.concessionApplication.count({ where: { studentId: user.id, status: "Pending" } })).toBe(1);
	});

	it("preserves the rejected record when a fresh submit races with a correction", async () => {
		const { user } = await createTestStudent(prisma, { status: "Approved" });
		const rejected = await createApplication(user.id, "Rejected");
		await authenticateAs(user.id);

		const results = await Promise.all([
			submitConcessionApplication(newConcession()),
			submitConcessionResubmission(rejected.id, newConcession())
		]);

		expect(successes(results)).toBe(1);
		const stored = await prisma.concessionApplication.findUnique({ where: { id: rejected.id } });
		expect(stored).toMatchObject({ status: "Pending", submissionCount: 2 });
		expect(await prisma.concessionApplication.count({ where: { studentId: user.id } })).toBe(1);
	});

	it("accepts exactly one of two simultaneous resubmissions of the same rejected application", async () => {
		const { user } = await createTestStudent(prisma, { status: "Approved" });
		const rejected = await createApplication(user.id, "Rejected");
		await authenticateAs(user.id);

		const resubmission = newConcession();
		const results = await Promise.all([
			submitConcessionResubmission(rejected.id, resubmission),
			submitConcessionResubmission(rejected.id, resubmission)
		]);

		expect(successes(results)).toBe(1);
		const stored = await prisma.concessionApplication.findUnique({ where: { id: rejected.id } });
		expect(stored).toMatchObject({ status: "Pending", submissionCount: 2 });
	});

	it("uses the updated calendar when the admin calendar change enters the lock queue first", async () => {
		const { user } = await createTestStudent(prisma, { status: "Approved" });
		const [adminHeaders, studentHeaders] = await Promise.all([loginHeaders(adminUser.user.id), loginHeaders(user.id)]);
		const semester = await prisma.academicSemester.findUniqueOrThrow({ where: { id: semesterId } });
		const closedDate = getCollegeCalendarDate(new Date());
		closedDate.setUTCDate(closedDate.getUTCDate() - 2);

		try {
			const [edit, submission] = await runQueuedChanges(
				(client) => client.query('LOCK TABLE "AcademicSemester" IN SHARE ROW EXCLUSIVE MODE'),
				() => {
					setTestHeaders(adminHeaders);
					return updateAcademicSemester(semesterId, {
						term: semester.term,
						academicYearStart: semester.academicYearStart,
						endDate: closedDate.toISOString().slice(0, 10),
						startDate: semester.startDate.toISOString().slice(0, 10)
					});
				},
				() => {
					setTestHeaders(studentHeaders);
					return submitConcessionApplication(newConcession());
				}
			);
			expect(edit).toMatchObject({ isSuccess: true, data: { endDate: closedDate } });
			expect(submission).toMatchObject({ isSuccess: false, error: { field: "semesterId" } });
			expect(await prisma.concessionApplication.count({ where: { studentId: user.id } })).toBe(0);
		} finally {
			await prisma.academicSemester.update({ where: { id: semesterId }, data: { endDate: semester.endDate } });
		}
	});

	it.each(["admin", "student"] as const)(
		"checks pass validity when the %s operation enters the lock queue first",
		async (first) => {
			const { user } = await createTestStudent(prisma, { status: "Approved" });
			const [adminHeaders, studentHeaders] = await Promise.all([
				loginHeaders(adminUser.user.id),
				loginHeaders(user.id)
			]);

			const semester = await prisma.academicSemester.findUniqueOrThrow({ where: { id: semesterId } });
			const issued = await createTestApplication(prisma, {
				semesterId,
				status: "Issued",
				studentId: user.id,
				issuedAt: semester.startDate
			});

			const updatedIssueDate = new Date();
			const holdLock = (client: PoolClient) =>
				client.query("SELECT pg_advisory_xact_lock($1::int, hashtext($2))", [
					SUBMISSION_LOCK_NAMESPACE.concession,
					user.id
				]);
			const startEdit = () => {
				setTestHeaders(adminHeaders);
				return updateConcessionIssueDate(issued.id, updatedIssueDate);
			};
			const startSubmission = () => {
				setTestHeaders(studentHeaders);
				return submitConcessionApplication(newConcession());
			};

			const [edit, submission] =
				first === "admin"
					? await runQueuedChanges(holdLock, startEdit, startSubmission)
					: await runQueuedChanges(holdLock, startSubmission, startEdit).then(
							([submitted, edited]) => [edited, submitted] as const
						);

			expect(edit).toMatchObject({ isSuccess: true, data: { issuedAt: updatedIssueDate } });

			if (first === "admin") {
				expect(submission).toMatchObject({
					isSuccess: false,
					error: { field: "status", message: expect.stringContaining("still active") }
				});
			} else {
				expect(submission).toMatchObject({
					isSuccess: true,
					data: { status: "Pending", applicationType: "Renewal", previousApplication: { id: issued.id } }
				});
			}

			expect(await prisma.concessionApplication.count({ where: { studentId: user.id } })).toBe(
				first === "admin" ? 1 : 2
			);
		}
	);

	it("creates only one pending address change when a student submits twice at the same time", async () => {
		const { user } = await createTestStudent(prisma, { status: "Approved" });
		await authenticateAs(user.id);

		const results = await Promise.all([
			submitAddressChangeApplication(newAddressChange()),
			submitAddressChangeApplication(newAddressChange())
		]);

		expect(successes(results)).toBe(2);
		const requests = await prisma.addressChange.findMany({ where: { studentId: user.id } });
		expect(requests).toHaveLength(1);
		expect(requests[0]).toMatchObject({ status: "Pending", submissionCount: 2 });
	});

	it("lets different students submit concessions and address changes at the same time", async () => {
		const { user: first } = await createTestStudent(prisma, { status: "Approved" });
		const { user: second } = await createTestStudent(prisma, { status: "Approved" });
		const [firstHeaders, secondHeaders] = await Promise.all([loginHeaders(first.id), loginHeaders(second.id)]);

		setTestHeaders(firstHeaders);
		const firstConcession = submitConcessionApplication(newConcession());
		const firstAddress = submitAddressChangeApplication(newAddressChange());
		setTestHeaders(secondHeaders);
		const secondConcession = submitConcessionApplication(newConcession());
		const secondAddress = submitAddressChangeApplication(newAddressChange());

		const results = await Promise.all([firstConcession, firstAddress, secondConcession, secondAddress]);

		expect(successes(results)).toBe(4);
		for (const studentId of [first.id, second.id]) {
			expect(await prisma.concessionApplication.count({ where: { studentId, status: "Pending" } })).toBe(1);
			expect(await prisma.addressChange.count({ where: { studentId, status: "Pending" } })).toBe(1);
		}
	});
});
