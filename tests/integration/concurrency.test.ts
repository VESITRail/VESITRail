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
	assignBookletToConcession,
	reviewConcessionApplication,
	submitConcessionApplication,
	submitConcessionResubmission
} from "@/actions/concession";
import { auth } from "./test-auth";
import { setTestHeaders } from "./headers-state";
import { approveStudent, rejectStudent } from "@/actions/student";
import { submitAddressChangeApplication } from "@/actions/change-address";
import { reviewAddressChangeRequest } from "@/actions/address-change-requests";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Concurrency Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: Awaited<ReturnType<typeof createTestAdmin>>;
	let bookletCounter = 0;

	const successes = (results: { isSuccess: boolean }[]) => results.filter((r) => r.isSuccess).length;

	const loginHeaders = async (userId: string): Promise<Headers> => {
		const ctx = await auth.$context;
		const { headers } = await (ctx as any).test.login({ userId });
		return headers;
	};

	const newConcession = (studentId: string) => ({
		studentId,
		stationId: SEED.stations[0].id,
		applicationType: "New" as const,
		concessionClassId: SEED.concessionClasses[0].id,
		concessionPeriodId: SEED.concessionPeriods[0].id
	});

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
			submitConcessionApplication(newConcession(user.id)),
			submitConcessionApplication(newConcession(user.id))
		]);

		expect(successes(results)).toBe(1);
		expect(await prisma.concessionApplication.count({ where: { studentId: user.id, status: "Pending" } })).toBe(1);
	});

	it("counts only one resubmission when a rejected student submits twice at the same time", async () => {
		const { user } = await createTestStudent(prisma, { status: "Approved" });
		const rejected = await createApplication(user.id, "Rejected");
		await authenticateAs(user.id);

		const results = await Promise.all([
			submitConcessionApplication(newConcession(user.id)),
			submitConcessionApplication(newConcession(user.id))
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

		const { studentId: _studentId, ...resubmission } = newConcession(user.id);
		const results = await Promise.all([
			submitConcessionResubmission(rejected.id, resubmission),
			submitConcessionResubmission(rejected.id, resubmission)
		]);

		expect(successes(results)).toBe(1);
		const stored = await prisma.concessionApplication.findUnique({ where: { id: rejected.id } });
		expect(stored).toMatchObject({ status: "Pending", submissionCount: 2 });
	});

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
		const firstConcession = submitConcessionApplication(newConcession(first.id));
		const firstAddress = submitAddressChangeApplication(newAddressChange());
		setTestHeaders(secondHeaders);
		const secondConcession = submitConcessionApplication(newConcession(second.id));
		const secondAddress = submitAddressChangeApplication(newAddressChange());

		const results = await Promise.all([firstConcession, firstAddress, secondConcession, secondAddress]);

		expect(successes(results)).toBe(4);
		for (const studentId of [first.id, second.id]) {
			expect(await prisma.concessionApplication.count({ where: { studentId, status: "Pending" } })).toBe(1);
			expect(await prisma.addressChange.count({ where: { studentId, status: "Pending" } })).toBe(1);
		}
	});
});
