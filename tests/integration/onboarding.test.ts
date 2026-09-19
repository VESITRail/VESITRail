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
import { approveStudent, rejectStudent } from "@/actions/student";
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
