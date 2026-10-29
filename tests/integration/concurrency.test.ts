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
import { approveStudent } from "@/actions/student";
import { reviewAddressChangeRequest } from "@/actions/address-change-requests";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { assignBookletToConcession, reviewConcessionApplication } from "@/actions/concession";

describe("Concurrency Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: Awaited<ReturnType<typeof createTestAdmin>>;
	let bookletCounter = 0;

	const successes = (results: { isSuccess: boolean }[]) => results.filter((r) => r.isSuccess).length;

	const createApplication = async (studentId: string, status: "Pending" | "Approved" = "Pending") =>
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
});
