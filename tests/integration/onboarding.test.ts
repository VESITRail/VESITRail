import {
	SEED,
	getTestPrisma,
	cleanAllTables,
	createTestUser,
	authenticateAs,
	unauthenticate,
	createTestAdmin,
	seedReferenceData
} from "./helpers";
import {
	getReviewData,
	submitOnboarding,
	type OnboardingData,
	getExistingStudentData,
	getLegacyStudentByEmail
} from "@/actions/onboarding";
import { getStudents, approveStudent, rejectStudent } from "@/actions/student";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Onboarding Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: any;
	let legacyUser: any;
	let studentUser: any;

	const baseOnboardingData: OnboardingData = {
		gender: "Male",
		middleName: "S",
		firstName: "Rahul",
		lastName: "Sharma",
		mobileNumber: "9876543210",
		classId: SEED.classes[0].id,
		stationId: SEED.stations[0].id,
		address: "123 Test Street, Mumbai",
		dateOfBirth: new Date("2003-06-15"),
		preferredConcessionClassId: SEED.concessionClasses[0].id,
		verificationDocUrl: "https://test-r2.example.com/doc.pdf",
		preferredConcessionPeriodId: SEED.concessionPeriods[0].id,
		class: {
			id: SEED.classes[0].id,
			year: {
				id: SEED.years[0].id,
				code: SEED.years[0].code,
				name: SEED.years[0].name
			},
			branch: {
				id: SEED.branches[0].id,
				code: SEED.branches[0].code,
				name: SEED.branches[0].name
			}
		}
	};

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		legacyUser = await createTestUser(prisma, { email: "vesitrail.legacy@ves.ac.in" });
		studentUser = await createTestUser(prisma, { email: "vesitrail.onboarding@ves.ac.in" });

		await prisma.legacyStudent.create({
			data: {
				email: "vesitrail.legacy@ves.ac.in",
				stationId: SEED.stations[0].id
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

	describe("Unauthorized Access (Guards)", () => {
		it("returns UNAUTHORIZED when unauthenticated for all onboarding endpoints", async () => {
			const resReview = await getReviewData({
				classId: SEED.classes[0].id,
				stationId: SEED.stations[0].id,
				preferredConcessionClassId: SEED.concessionClasses[0].id,
				preferredConcessionPeriodId: SEED.concessionPeriods[0].id
			});
			expect(resReview.isSuccess).toBe(false);

			const resExisting = await getExistingStudentData();
			expect(resExisting.isSuccess).toBe(false);

			const resLegacy = await getLegacyStudentByEmail();
			expect(resLegacy.isSuccess).toBe(false);

			const resSubmit = await submitOnboarding(baseOnboardingData);
			expect(resSubmit.isSuccess).toBe(false);
		});
	});

	describe("Validation Error Cases", () => {
		it("rejects invalid mobile number in submitOnboarding", async () => {
			await authenticateAs(studentUser.id);
			const res = await submitOnboarding({
				...baseOnboardingData,
				mobileNumber: "12345"
			});
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Please enter a valid Indian mobile number");
			}
		});

		it("rejects unavailable or nonexistent classId", async () => {
			await authenticateAs(studentUser.id);
			const res = await submitOnboarding({
				...baseOnboardingData,
				classId: "00000000-0000-0000-0000-000000000000"
			});
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("class, year, or branch is currently unavailable");
			}
		});

		it("rejects unavailable or nonexistent stationId", async () => {
			await authenticateAs(studentUser.id);
			const res = await submitOnboarding({
				...baseOnboardingData,
				stationId: "00000000-0000-0000-0000-000000000000"
			});
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("station is currently unavailable");
			}
		});

		it("rejects unavailable preferred concession class or period", async () => {
			await authenticateAs(studentUser.id);
			const res1 = await submitOnboarding({
				...baseOnboardingData,
				preferredConcessionClassId: "00000000-0000-0000-0000-000000000000"
			});
			expect(res1.isSuccess).toBe(false);

			const res2 = await submitOnboarding({
				...baseOnboardingData,
				preferredConcessionPeriodId: "00000000-0000-0000-0000-000000000000"
			});
			expect(res2.isSuccess).toBe(false);
		});

		it("rejects getReviewData when reference fields are missing or invalid", async () => {
			await authenticateAs(studentUser.id);
			const res = await getReviewData({
				classId: "00000000-0000-0000-0000-000000000000",
				stationId: SEED.stations[0].id,
				preferredConcessionClassId: SEED.concessionClasses[0].id,
				preferredConcessionPeriodId: SEED.concessionPeriods[0].id
			});
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("review fields are missing");
			}
		});
	});

	describe("getReviewData", () => {
		it("returns review data when authenticated", async () => {
			await authenticateAs(studentUser.id);
			const res = await getReviewData({
				classId: SEED.classes[0].id,
				stationId: SEED.stations[0].id,
				preferredConcessionClassId: SEED.concessionClasses[0].id,
				preferredConcessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.station.id).toBe(SEED.stations[0].id);
				expect(res.data.class.id).toBe(SEED.classes[0].id);
			}
		});
	});

	describe("getLegacyStudentByEmail", () => {
		it("returns legacy record if user email exists in legacy table", async () => {
			await authenticateAs(legacyUser.id);
			const res = await getLegacyStudentByEmail();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).not.toBeNull();
				expect(res.data?.stationId).toBe(SEED.stations[0].id);
			}
		});

		it("returns null if user email does not exist in legacy table", async () => {
			await authenticateAs(studentUser.id);
			const res = await getLegacyStudentByEmail();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).toBeNull();
			}
		});
	});

	describe("submitOnboarding", () => {
		it("creates a student with Pending status for regular student", async () => {
			await authenticateAs(studentUser.id);
			const res = await submitOnboarding(baseOnboardingData);
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Pending");
				expect(res.data.userId).toBe(studentUser.id);
				expect(res.data.submissionCount).toBe(1);
			}
		});

		it("handles duplicate onboarding submission for same user by incrementing submissionCount", async () => {
			await authenticateAs(studentUser.id);
			const res = await submitOnboarding({
				...baseOnboardingData,
				address: "Updated 456 Street, Mumbai"
			});
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Pending");
				expect(res.data.submissionCount).toBe(2);
				expect(res.data.address).toBe("Updated 456 Street, Mumbai");
			}
		});

		it("auto-approves student if email exists in legacy table", async () => {
			await authenticateAs(legacyUser.id);
			const res = await submitOnboarding(baseOnboardingData);
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Approved");
				expect(res.data.userId).toBe(legacyUser.id);
			}
		});

		it("preserves review metadata and rejection reason on resubmission after rejection and clears on approval", async () => {
			const resubmitUser = await createTestUser(prisma, { email: "vesitrail.resubmit@ves.ac.in" });
			await authenticateAs(resubmitUser.id);
			const firstSubmit = await submitOnboarding(baseOnboardingData);
			expect(firstSubmit.isSuccess).toBe(true);

			await authenticateAs(adminUser.user.id);
			const rejectRes = await rejectStudent({
				studentId: resubmitUser.id,
				rejectionReason: "Invalid verification document uploaded"
			});
			expect(rejectRes.isSuccess).toBe(true);

			await authenticateAs(resubmitUser.id);
			const resubmitRes = await submitOnboarding({
				...baseOnboardingData,
				address: "Updated Test Address 456, Mumbai"
			});
			expect(resubmitRes.isSuccess).toBe(true);
			if (resubmitRes.isSuccess) {
				expect(resubmitRes.data.status).toBe("Pending");
				expect(resubmitRes.data.submissionCount).toBe(2);
				expect(resubmitRes.data.rejectionReason).toBe("Invalid verification document uploaded");
				expect(resubmitRes.data.reviewedById).toBe(adminUser.user.id);
				expect(resubmitRes.data.reviewedAt).not.toBeNull();
			}

			const dbStudent = await prisma.student.findUnique({
				where: { userId: resubmitUser.id }
			});
			expect(dbStudent?.status).toBe("Pending");
			expect(dbStudent?.submissionCount).toBe(2);
			expect(dbStudent?.rejectionReason).toBe("Invalid verification document uploaded");
			expect(dbStudent?.reviewedById).toBe(adminUser.user.id);
			expect(dbStudent?.reviewedAt).not.toBeNull();

			await authenticateAs(adminUser.user.id);
			const approveRes = await approveStudent({ studentId: resubmitUser.id });
			expect(approveRes.isSuccess).toBe(true);
			if (approveRes.isSuccess) {
				expect(approveRes.data.status).toBe("Approved");
				expect(approveRes.data.rejectionReason).toBeNull();
				expect(approveRes.data.reviewedBy?.userId).toBe(adminUser.user.id);
			}
		});

		it("returns an approved student rejected by an admin to the pending queue after resubmission", async () => {
			const approvedThenRejectedUser = await createTestUser(prisma, { email: "vesitrail.rereview@ves.ac.in" });
			await authenticateAs(approvedThenRejectedUser.id);
			expect((await submitOnboarding(baseOnboardingData)).isSuccess).toBe(true);

			await authenticateAs(adminUser.user.id);
			expect((await approveStudent({ studentId: approvedThenRejectedUser.id })).isSuccess).toBe(true);
			const rejectRes = await rejectStudent({
				studentId: approvedThenRejectedUser.id,
				rejectionReason: "Address proof no longer valid"
			});
			expect(rejectRes.isSuccess).toBe(true);
			if (rejectRes.isSuccess) expect(rejectRes.data.status).toBe("Rejected");

			await authenticateAs(approvedThenRejectedUser.id);
			const resubmitRes = await submitOnboarding({ ...baseOnboardingData, address: "New Valid Address 789, Mumbai" });
			expect(resubmitRes.isSuccess).toBe(true);
			if (resubmitRes.isSuccess) {
				expect(resubmitRes.data.status).toBe("Pending");
				expect(resubmitRes.data.submissionCount).toBe(2);
				expect(resubmitRes.data.address).toBe("New Valid Address 789, Mumbai");
			}

			await authenticateAs(adminUser.user.id);
			const pendingQueue = await getStudents({ page: 1, pageSize: 50, statusFilter: "Pending" });
			expect(pendingQueue.isSuccess).toBe(true);
			if (pendingQueue.isSuccess) {
				expect(pendingQueue.data.data.map((student) => student.userId)).toContain(approvedThenRejectedUser.id);
			}
		});
	});

	describe("approved student resubmission", () => {
		it("blocks an approved student from resubmitting onboarding and leaves their record unchanged", async () => {
			const approvedUser = await createTestUser(prisma, { email: "vesitrail.noresubmit@ves.ac.in" });
			await authenticateAs(approvedUser.id);
			expect((await submitOnboarding(baseOnboardingData)).isSuccess).toBe(true);

			await authenticateAs(adminUser.user.id);
			expect((await approveStudent({ studentId: approvedUser.id })).isSuccess).toBe(true);

			await authenticateAs(approvedUser.id);
			const res = await submitOnboarding({ ...baseOnboardingData, address: "Sneaky New Address, Mumbai" });

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error).toMatchObject({
					type: "VALIDATION_ERROR",
					message: "Your account is already approved. Onboarding can only be resubmitted after an admin rejects it"
				});
			}

			const stored = await prisma.student.findUnique({ where: { userId: approvedUser.id } });
			expect(stored).toMatchObject({
				status: "Approved",
				submissionCount: 1,
				address: baseOnboardingData.address
			});
		});
	});

	describe("getExistingStudentData", () => {
		it("returns existing student data after onboarding is submitted", async () => {
			await authenticateAs(studentUser.id);
			const res = await getExistingStudentData();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).not.toBeNull();
				expect(res.data?.firstName).toBe("Rahul");
			}
		});

		it("returns rejection reason and submission count for rejected student", async () => {
			const rejectedUser = await createTestUser(prisma, { email: "vesitrail.rejected@ves.ac.in" });
			await authenticateAs(rejectedUser.id);
			await submitOnboarding(baseOnboardingData);

			await authenticateAs(adminUser.user.id);
			await rejectStudent({
				studentId: rejectedUser.id,
				rejectionReason: "Document illegible, re-upload clear copy"
			});

			await authenticateAs(rejectedUser.id);
			const res = await getExistingStudentData();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data?.status).toBe("Rejected");
				expect(res.data?.rejectionReason).toBe("Document illegible, re-upload clear copy");
				expect(res.data?.submissionCount).toBe(1);
			}
		});
	});
});
