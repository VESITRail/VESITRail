import {
	SEED,
	getTestPrisma,
	cleanAllTables,
	createTestUser,
	authenticateAs,
	unauthenticate,
	seedReferenceData
} from "./helpers";
import {
	getReviewData,
	submitOnboarding,
	type OnboardingData,
	getExistingStudentData,
	getLegacyStudentByEmail
} from "@/actions/onboarding";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Onboarding Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let legacyUser: any;
	let studentUser: any;

	const baseOnboardingData: OnboardingData = {
		gender: "Male",
		middleName: "S",
		status: "Pending",
		firstName: "Rahul",
		lastName: "Sharma",
		submissionCount: 1,
		rejectionReason: null,
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
	});
});
