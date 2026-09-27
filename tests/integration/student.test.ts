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
import { getStudents, getStudentDetails, approveStudent, rejectStudent, updateStudentDetails } from "@/actions/student";

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

		it("returns empty result when search filter matches nothing", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getStudents({
				page: 1,
				pageSize: 10,
				searchQuery: "NonexistentStudent9999"
			});
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBe(0);
				expect(res.data.data).toHaveLength(0);
			}
		});
	});

	describe("getStudentDetails", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(pendingStudent.user.id);
			const res = await getStudentDetails(approvedStudent.user.id);
			expect(res.isSuccess).toBe(false);
		});

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

	describe("approveStudent & rejectStudent state transitions", () => {
		it("rejects non-admin access to approve and reject", async () => {
			await authenticateAs(pendingStudent.user.id);
			const appRes = await approveStudent({ studentId: pendingStudent.user.id });
			expect(appRes.isSuccess).toBe(false);

			const rejRes = await rejectStudent({ studentId: pendingStudent.user.id, rejectionReason: "Reason" });
			expect(rejRes.isSuccess).toBe(false);
		});

		it("requires rejectionReason when rejecting", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await rejectStudent({
				rejectionReason: "",
				studentId: pendingStudent.user.id
			});
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Rejection reason is required");
			}
		});

		it("approves a pending student", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await approveStudent({ studentId: pendingStudent.user.id });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Approved");
			}
		});

		it("prevents double-approving an already approved student (state-transition race)", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await approveStudent({ studentId: pendingStudent.user.id });
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Only pending students can be approved");
			}
		});

		it("rejects a student with rejection reason", async () => {
			const anotherStudent = await createTestStudent(prisma, { status: "Pending" });
			await authenticateAs(adminUser.user.id);
			const res = await rejectStudent({
				studentId: anotherStudent.user.id,
				rejectionReason: "Invalid identity documentation"
			});
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Rejected");
				expect(res.data.rejectionReason).toBe("Invalid identity documentation");
			}

			const doubleReject = await rejectStudent({
				studentId: anotherStudent.user.id,
				rejectionReason: "Second rejection"
			});
			expect(doubleReject.isSuccess).toBe(false);
			if (!doubleReject.isSuccess) {
				expect(doubleReject.error.message).toContain("Only pending or approved students can be rejected");
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

	describe("updateStudentDetails", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(approvedStudent.user.id);
			const res = await updateStudentDetails({
				gender: "Male",
				firstName: "Updated",
				year: SEED.years[0].id,
				dateOfBirth: "2003-05-15",
				class: SEED.classes[0].id,
				mobileNumber: "9876543210",
				branch: SEED.branches[1].id,
				studentId: approvedStudent.user.id
			});
			expect(res.isSuccess).toBe(false);
		});

		it("fails if class does not match year and branch", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await updateStudentDetails({
				gender: "Male",
				firstName: "Updated",
				year: SEED.years[1].id,
				dateOfBirth: "2003-05-15",
				class: SEED.classes[0].id,
				mobileNumber: "9876543210",
				branch: SEED.branches[0].id,
				studentId: approvedStudent.user.id
			});

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Selected class does not match");
			}
		});

		it("updates student details and user name successfully", async () => {
			await authenticateAs(adminUser.user.id);
			const targetClass = SEED.classes[0];
			const res = await updateStudentDetails({
				gender: "Male",
				lastName: "Verma",
				firstName: "Anand",
				middleName: "Kumar",
				class: targetClass.id,
				dateOfBirth: "2003-06-20",
				year: targetClass.yearId,
				mobileNumber: "9820555555",
				branch: targetClass.branchId,
				studentId: approvedStudent.user.id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.firstName).toBe("Anand");
				expect(res.data.lastName).toBe("Verma");
				expect(res.data.user.name).toBe("Anand Kumar Verma");
				expect(res.data.mobileNumber).toBe("9820555555");
			}
		});
	});
});
