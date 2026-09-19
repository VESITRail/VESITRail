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
	getStudentAddressAndStation,
	submitAddressChangeApplication,
	getLastAddressChangeApplication
} from "@/actions/change-address";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getAddressChangeRequests, reviewAddressChangeRequest } from "@/actions/address-change-requests";

describe("Address Change Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: any;
	let studentUser: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		studentUser = await createTestStudent(prisma, { status: "Approved" });
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	beforeEach(() => {
		unauthenticate();
	});

	describe("getStudentAddressAndStation", () => {
		it("returns current address and station for student", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getStudentAddressAndStation();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.address).toBe("Test Address, Mumbai 400001");
				expect(res.data.station.id).toBe(SEED.stations[0].id);
			}
		});
	});

	describe("submitAddressChangeApplication", () => {
		it("fails if new station is identical to current station", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await submitAddressChangeApplication({
				newAddress: "New Address",
				currentAddress: "Old Address",
				newStationId: SEED.stations[0].id,
				currentStationId: SEED.stations[0].id,
				verificationDocUrl: "https://test-r2.example.com/addr.pdf"
			});
			expect(res.isSuccess).toBe(false);
		});

		it("successfully submits address change to a different station", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await submitAddressChangeApplication({
				currentAddress: "Old Address",
				newAddress: "New Address 456",
				newStationId: SEED.stations[1].id,
				currentStationId: SEED.stations[0].id,
				verificationDocUrl: "https://test-r2.example.com/addr.pdf"
			});
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Pending");
				expect(res.data.newStationId).toBe(SEED.stations[1].id);
			}
		});
	});

	describe("getLastAddressChangeApplication", () => {
		it("returns the submitted address change application", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await getLastAddressChangeApplication();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).not.toBeNull();
				expect(res.data?.newAddress).toBe("New Address 456");
			}
		});
	});

	describe("admin review address change", () => {
		let requestId: string;

		beforeAll(async () => {
			const req = await prisma.addressChange.findFirst({
				where: { studentId: studentUser.user.id }
			});
			requestId = req!.id;
		});

		it("admin retrieves pending address change requests", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAddressChangeRequests({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBeGreaterThanOrEqual(1);
			}
		});

		it("admin approves request and student address and station update", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reviewAddressChangeRequest(requestId, "Approved");
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Approved");

				const updatedStudent = await prisma.student.findUnique({
					where: { userId: studentUser.user.id }
				});
				expect(updatedStudent?.address).toBe("New Address 456");
				expect(updatedStudent?.stationId).toBe(SEED.stations[1].id);
			}
		});

		it("preserves review metadata on resubmission after rejection and clears on approval", async () => {
			await authenticateAs(studentUser.user.id);
			const submitRes = await submitAddressChangeApplication({
				currentAddress: "New Address 456",
				newStationId: SEED.stations[2].id,
				newAddress: "Another New Address 789",
				currentStationId: SEED.stations[1].id,
				verificationDocUrl: "https://test-r2.example.com/addr2.pdf"
			});
			expect(submitRes.isSuccess).toBe(true);
			const newReqId = submitRes.isSuccess ? submitRes.data.id : "";

			await authenticateAs(adminUser.user.id);
			const rejectRes = await reviewAddressChangeRequest(newReqId, "Rejected", "Address proof illegible");
			expect(rejectRes.isSuccess).toBe(true);

			await authenticateAs(studentUser.user.id);
			const resubmitRes = await submitAddressChangeApplication({
				currentAddress: "New Address 456",
				newStationId: SEED.stations[2].id,
				newAddress: "Another New Address 789",
				currentStationId: SEED.stations[1].id,
				verificationDocUrl: "https://test-r2.example.com/addr2-clear.pdf"
			});
			expect(resubmitRes.isSuccess).toBe(true);
			if (resubmitRes.isSuccess) {
				expect(resubmitRes.data.status).toBe("Pending");
				expect(resubmitRes.data.submissionCount).toBe(2);
				expect(resubmitRes.data.rejectionReason).toBe("Address proof illegible");
				expect(resubmitRes.data.reviewedById).toBe(adminUser.user.id);
				expect(resubmitRes.data.reviewedAt).not.toBeNull();
			}

			await authenticateAs(adminUser.user.id);
			const approveRes = await reviewAddressChangeRequest(newReqId, "Approved");
			expect(approveRes.isSuccess).toBe(true);
			if (approveRes.isSuccess) {
				expect(approveRes.data.status).toBe("Approved");
				expect(approveRes.data.rejectionReason).toBeNull();
				expect(approveRes.data.reviewedById).toBe(adminUser.user.id);
			}
		});
	});
});
