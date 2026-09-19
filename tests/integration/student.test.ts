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
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getStudents, getStudentDetails, approveStudent, rejectStudent } from "@/actions/student";

describe("Student Management Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: any;
	let pendingStudent: any;
	let approvedStudent: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		pendingStudent = await createTestStudent(prisma, { status: "Pending" });
		approvedStudent = await createTestStudent(prisma, { status: "Approved" });
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	beforeEach(() => {
		unauthenticate();
	});

	describe("getStudents", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(pendingStudent.user.id);
			const res = await getStudents({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(false);
		});

		it("returns paginated student list for admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getStudents({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBeGreaterThanOrEqual(2);
			}
		});

		it("filters students by status", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getStudents({ page: 1, pageSize: 10, statusFilter: "Pending" });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.data.every((s) => s.status === "Pending")).toBe(true);
			}
		});
	});

	describe("getStudentDetails", () => {
		it("returns student details with relations for admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getStudentDetails(approvedStudent.user.id);
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.userId).toBe(approvedStudent.user.id);
				expect(res.data.station).toBeDefined();
			}
		});
	});

	describe("approveStudent & rejectStudent", () => {
		it("approves a pending student", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await approveStudent({ studentId: pendingStudent.user.id });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Approved");
			}
		});

		it("rejects a pending student with rejection reason", async () => {
			const anotherPending = await createTestStudent(prisma, { status: "Pending" });
			await authenticateAs(adminUser.user.id);
			const res = await rejectStudent({
				studentId: anotherPending.user.id,
				rejectionReason: "Invalid identity documentation"
			});
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Rejected");
				expect(res.data.rejectionReason).toBe("Invalid identity documentation");
			}
		});

		it("rejects an approved student and cascade-rejects in-flight requests", async () => {
			const studentWithRequests = await createTestStudent(prisma, { status: "Approved" });

			const concessionApp = await prisma.concessionApplication.create({
				data: {
					status: "Pending",
					applicationType: "New",
					stationId: SEED.stations[0].id,
					studentId: studentWithRequests.user.id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			const addressChange = await prisma.addressChange.create({
				data: {
					status: "Pending",
					newAddress: "New Address",
					currentAddress: "Old Address",
					newStationId: SEED.stations[1].id,
					currentStationId: SEED.stations[0].id,
					studentId: studentWithRequests.user.id
				}
			});

			await authenticateAs(adminUser.user.id);
			const res = await rejectStudent({
				studentId: studentWithRequests.user.id,
				rejectionReason: "Fraudulent DOB detected post-approval"
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Rejected");
				expect(res.data.rejectionReason).toBe("Fraudulent DOB detected post-approval");
			}

			const updatedConcession = await prisma.concessionApplication.findUnique({
				where: { id: concessionApp.id }
			});
			expect(updatedConcession?.status).toBe("Rejected");
			expect(updatedConcession?.rejectionReason).toContain("revoked");

			const updatedAddressChange = await prisma.addressChange.findUnique({
				where: { id: addressChange.id }
			});
			expect(updatedAddressChange?.status).toBe("Rejected");
			expect(updatedAddressChange?.rejectionReason).toContain("revoked");
		});
	});
});
