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
	updateConcessionIssueDate,
	assignBookletToConcession,
	submitConcessionApplication,
	reviewConcessionApplication,
	reprintConcessionApplication,
	approveConcessionWithBooklet,
	getConcessionApplicationDetails
} from "@/actions/concession";
import {
	createBooklet,
	deleteBooklet,
	updateBooklet,
	reorderBookletApplications,
	updateBookletAnchorCoordinates
} from "@/actions/booklets";
import { subDays } from "date-fns";
import { submitOnboarding } from "@/actions/onboarding";
import { getAdminAnalytics } from "@/actions/analytics";
import { deleteR2File, getUploadUrl } from "@/actions/r2";
import { markNotificationAsRead } from "@/actions/notifications";
import { submitAddressChangeApplication } from "@/actions/change-address";
import { getStudentDetails, updateStudentDetails } from "@/actions/student";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { saveFcmToken, removeFcmTokenForDevice, disablePushNotifications } from "@/actions/fcm";

describe("Business Rules Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: Awaited<ReturnType<typeof createTestAdmin>>;
	let bookletCounter = 0;

	const createApplication = async (
		studentId: string,
		status: "Pending" | "Approved" | "Rejected" | "Issued" = "Pending",
		extra: { concessionBookletId?: string; pageOffset?: number; issuedAt?: Date } = {}
	) =>
		prisma.concessionApplication.create({
			data: {
				status,
				studentId,
				submissionCount: 1,
				applicationType: "New",
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id,
				...extra
			}
		});

	const createBookletRecord = async (status: "Available" | "InUse" | "Exhausted" = "Available") => {
		bookletCounter++;
		const start = 8200001 + bookletCounter * 100;
		return prisma.concessionBooklet.create({
			data: {
				status,
				anchorX: 0,
				anchorY: 0,
				totalPages: 50,
				serialStartNumber: `0${start}`,
				serialEndNumber: `0${start + 49}`
			}
		});
	};

	const approvedStudent = () => createTestStudent(prisma, { status: "Approved" });

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

	describe("updateConcessionIssueDate", () => {
		it.each(["Pending", "Approved", "Rejected"] as const)(
			"rejects updating the issue date of a %s application",
			async (status) => {
				const { user } = await approvedStudent();
				const application = await createApplication(user.id, status);
				await authenticateAs(adminUser.user.id);

				const res = await updateConcessionIssueDate(application.id, new Date());

				expect(res.isSuccess).toBe(false);
				if (!res.isSuccess) {
					expect(res.error).toMatchObject({
						type: "VALIDATION_ERROR",
						message: "Only issued applications can have their issue date updated"
					});
				}
			}
		);

		it("returns a validation error for a missing application", async () => {
			await authenticateAs(adminUser.user.id);

			const res = await updateConcessionIssueDate("00000000-0000-0000-0000-000000000000", new Date());

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Application not found");
		});
	});

	describe("approveConcessionWithBooklet", () => {
		it("issues a pending application directly into the selected slot", async () => {
			const { user } = await approvedStudent();
			const application = await createApplication(user.id, "Pending");
			const booklet = await createBookletRecord();
			await authenticateAs(adminUser.user.id);

			const res = await approveConcessionWithBooklet(application.id, booklet.id, 3);

			expect(res.isSuccess).toBe(true);
			const stored = await prisma.concessionApplication.findUnique({ where: { id: application.id } });
			expect(stored).toMatchObject({ status: "Issued", pageOffset: 3, concessionBookletId: booklet.id });
		});

		it("rejects a slot already held by another application", async () => {
			const { user: holder } = await approvedStudent();
			const { user } = await approvedStudent();
			const booklet = await createBookletRecord("InUse");
			await createApplication(holder.id, "Issued", { concessionBookletId: booklet.id, pageOffset: 7 });
			const application = await createApplication(user.id, "Pending");
			await authenticateAs(adminUser.user.id);

			const res = await approveConcessionWithBooklet(application.id, booklet.id, 7);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error).toMatchObject({
					type: "VALIDATION_ERROR",
					message: "Slip number is already assigned in this booklet"
				});
			}
			const stored = await prisma.concessionApplication.findUnique({ where: { id: application.id } });
			expect(stored).toMatchObject({ status: "Pending", pageOffset: null, concessionBookletId: null });
		});

		it("returns a validation error for a missing booklet", async () => {
			const { user } = await approvedStudent();
			const application = await createApplication(user.id, "Pending");
			await authenticateAs(adminUser.user.id);

			const res = await approveConcessionWithBooklet(application.id, "00000000-0000-0000-0000-000000000000", 0);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error).toMatchObject({ type: "VALIDATION_ERROR", message: "Booklet not found" });
		});

		it("returns a specific validation error for a rejected application", async () => {
			const { user } = await approvedStudent();
			const application = await createApplication(user.id, "Rejected");
			const booklet = await createBookletRecord();
			await authenticateAs(adminUser.user.id);

			const res = await approveConcessionWithBooklet(application.id, booklet.id, 0);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error).toMatchObject({
					type: "VALIDATION_ERROR",
					message: "Only approved applications can be assigned a booklet"
				});
			}
		});

		it("returns a specific validation error for an exhausted booklet", async () => {
			const { user } = await approvedStudent();
			const application = await createApplication(user.id, "Pending");
			const booklet = await createBookletRecord("Exhausted");
			await authenticateAs(adminUser.user.id);

			const res = await approveConcessionWithBooklet(application.id, booklet.id, 0);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error).toMatchObject({ type: "VALIDATION_ERROR", message: "Booklet is not available for use" });
			}
		});

		it("returns a specific validation error for a page offset outside the booklet", async () => {
			const { user } = await approvedStudent();
			const application = await createApplication(user.id, "Pending");
			const booklet = await createBookletRecord();
			await authenticateAs(adminUser.user.id);

			const res = await approveConcessionWithBooklet(application.id, booklet.id, 50);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error).toMatchObject({
					type: "VALIDATION_ERROR",
					message: "Page offset must be between 0 and 49"
				});
			}
		});
	});

	describe("assignBookletToConcession", () => {
		it("rejects a slot already held by another application", async () => {
			const { user: holder } = await approvedStudent();
			const { user } = await approvedStudent();
			const booklet = await createBookletRecord("InUse");
			await createApplication(holder.id, "Issued", { concessionBookletId: booklet.id, pageOffset: 2 });
			const application = await createApplication(user.id, "Approved");
			await authenticateAs(adminUser.user.id);

			const res = await assignBookletToConcession(application.id, booklet.id, 2);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Slip number is already assigned in this booklet");
		});

		it("marks the booklet InUse after the first slip and Exhausted after the last slip", async () => {
			const { user: first } = await approvedStudent();
			const { user: last } = await approvedStudent();
			const booklet = await createBookletRecord();
			const firstApp = await createApplication(first.id, "Approved");
			const lastApp = await createApplication(last.id, "Approved");
			await authenticateAs(adminUser.user.id);

			await assignBookletToConcession(firstApp.id, booklet.id, 0);
			expect((await prisma.concessionBooklet.findUnique({ where: { id: booklet.id } }))?.status).toBe("InUse");

			await assignBookletToConcession(lastApp.id, booklet.id, 49);
			expect((await prisma.concessionBooklet.findUnique({ where: { id: booklet.id } }))?.status).toBe("Exhausted");
		});

		it("returns the booklet to InUse and then Available as issued slips are rejected", async () => {
			const { user: first } = await approvedStudent();
			const { user: last } = await approvedStudent();
			const booklet = await createBookletRecord("Exhausted");
			const firstApp = await createApplication(first.id, "Issued", { concessionBookletId: booklet.id, pageOffset: 0 });
			const lastApp = await createApplication(last.id, "Issued", { concessionBookletId: booklet.id, pageOffset: 49 });
			await authenticateAs(adminUser.user.id);

			await reviewConcessionApplication(lastApp.id, "Rejected", "Issued in error");
			expect((await prisma.concessionBooklet.findUnique({ where: { id: booklet.id } }))?.status).toBe("InUse");

			await reviewConcessionApplication(firstApp.id, "Rejected", "Issued in error");
			expect((await prisma.concessionBooklet.findUnique({ where: { id: booklet.id } }))?.status).toBe("Available");
		});
	});

	describe("reprintConcessionApplication", () => {
		it("rejects reprinting into a slot held by a different application", async () => {
			const { user: holder } = await approvedStudent();
			const { user } = await approvedStudent();
			const booklet = await createBookletRecord("InUse");
			await createApplication(holder.id, "Issued", { concessionBookletId: booklet.id, pageOffset: 4 });
			const application = await createApplication(user.id, "Issued", {
				pageOffset: 5,
				issuedAt: new Date(),
				concessionBookletId: booklet.id
			});
			await authenticateAs(adminUser.user.id);

			const res = await reprintConcessionApplication(application.id, booklet.id, 4);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Slip number is already assigned in this booklet");
			const stored = await prisma.concessionApplication.findUnique({ where: { id: application.id } });
			expect(stored?.pageOffset).toBe(5);
		});

		it("rejects reprinting into an exhausted booklet", async () => {
			const { user } = await approvedStudent();
			const source = await createBookletRecord("InUse");
			const exhausted = await createBookletRecord("Exhausted");
			const application = await createApplication(user.id, "Issued", {
				pageOffset: 0,
				issuedAt: new Date(),
				concessionBookletId: source.id
			});
			await authenticateAs(adminUser.user.id);

			const res = await reprintConcessionApplication(application.id, exhausted.id, 0);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error).toMatchObject({
					type: "VALIDATION_ERROR",
					message: "Selected booklet is not available for use"
				});
			}
		});

		it.each(["Pending", "Approved"] as const)("rejects reprinting a %s application", async (status) => {
			const { user } = await approvedStudent();
			const booklet = await createBookletRecord();
			const application = await createApplication(user.id, status);
			await authenticateAs(adminUser.user.id);

			const res = await reprintConcessionApplication(application.id, booklet.id, 0);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error).toMatchObject({
					type: "VALIDATION_ERROR",
					message: "Only issued applications can be reprinted"
				});
			}
		});
	});

	describe("getConcessionApplicationDetails", () => {
		it("returns a validation error for a missing application", async () => {
			await authenticateAs(adminUser.user.id);

			const res = await getConcessionApplicationDetails("00000000-0000-0000-0000-000000000000");

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Application not found");
		});
	});

	describe("submitConcessionApplication", () => {
		it("rejects an inactive concession period", async () => {
			const { user } = await approvedStudent();
			const inactivePeriod = await prisma.concessionPeriod.create({
				data: { name: "Half Yearly (Retired)", duration: 6, isActive: false }
			});

			try {
				await authenticateAs(user.id);

				const res = await submitConcessionApplication({
					studentId: user.id,
					applicationType: "New",
					stationId: SEED.stations[0].id,
					concessionPeriodId: inactivePeriod.id,
					concessionClassId: SEED.concessionClasses[0].id
				});

				expect(res.isSuccess).toBe(false);
				if (!res.isSuccess) expect(res.error.message).toBe("Selected concession period is currently unavailable");
				expect(await prisma.concessionApplication.count({ where: { studentId: user.id } })).toBe(0);
			} finally {
				await prisma.concessionPeriod.delete({ where: { id: inactivePeriod.id } });
			}
		});
	});

	describe("submitAddressChangeApplication", () => {
		const addressChange = (newStationId: string) => ({
			newStationId,
			currentStationId: SEED.stations[0].id,
			newAddress: "Flat 9, Station Road, Mumbai 400070",
			currentAddress: "Test Address, Mumbai 400001",
			verificationDocUrl: "https://test-r2.example.com/address-doc.pdf"
		});

		it("rejects an inactive new station", async () => {
			const { user } = await approvedStudent();
			const inactiveStation = await prisma.station.create({
				data: { code: "ZZINA", name: "Closed Halt", isActive: false }
			});

			try {
				await authenticateAs(user.id);

				const res = await submitAddressChangeApplication(addressChange(inactiveStation.id));

				expect(res.isSuccess).toBe(false);
				if (!res.isSuccess) expect(res.error.message).toBe("Selected new station is currently unavailable");
			} finally {
				await prisma.station.delete({ where: { id: inactiveStation.id } });
			}
		});

		it("forbids students that are not approved", async () => {
			const { user } = await createTestStudent(prisma, { status: "Pending" });
			await authenticateAs(user.id);

			const res = await submitAddressChangeApplication(addressChange(SEED.stations[1].id));

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error).toMatchObject({ type: "AUTH_ERROR", code: "FORBIDDEN" });
		});

		it("rejects unauthenticated requests", async () => {
			const res = await submitAddressChangeApplication(addressChange(SEED.stations[1].id));

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error).toMatchObject({ type: "AUTH_ERROR", code: "UNAUTHORIZED" });
		});
	});

	describe("student administration", () => {
		it("rejects an invalid date of birth when updating student details", async () => {
			const { user } = await approvedStudent();
			await authenticateAs(adminUser.user.id);

			const res = await updateStudentDetails({
				gender: "Male",
				firstName: "Updated",
				studentId: user.id,
				lastName: "Student",
				dateOfBirth: "not-a-date",
				class: SEED.classes[0].id,
				year: SEED.classes[0].yearId,
				mobileNumber: "9876543210",
				branch: SEED.classes[0].branchId
			} as Parameters<typeof updateStudentDetails>[0]);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess)
				expect(res.error).toMatchObject({ type: "VALIDATION_ERROR", message: "Please enter a valid date" });
		});

		it("returns a validation error for a missing student", async () => {
			await authenticateAs(adminUser.user.id);

			const res = await getStudentDetails("missing-student");

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Student not found");
		});
	});

	describe("booklet management", () => {
		it.each(["", "   "])("rejects an empty serial start number %j", async (serialStartNumber) => {
			await authenticateAs(adminUser.user.id);

			const res = await createBooklet({ anchorX: 0, anchorY: 0, serialStartNumber });

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Serial start number is required");
		});

		it.each([
			[
				"updateBooklet",
				() =>
					updateBooklet("00000000-0000-0000-0000-000000000000", {
						anchorX: 0,
						anchorY: 0,
						isExhausted: false,
						serialStartNumber: "0900001"
					})
			],
			["deleteBooklet", () => deleteBooklet("00000000-0000-0000-0000-000000000000")],
			[
				"updateBookletAnchorCoordinates",
				() => updateBookletAnchorCoordinates("00000000-0000-0000-0000-000000000000", 0, 0)
			]
		])("%s returns a validation error for a missing booklet", async (_label, action) => {
			await authenticateAs(adminUser.user.id);

			const res = await action();

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error).toMatchObject({ type: "VALIDATION_ERROR", message: "Booklet not found" });
		});

		it("rejects reordering without a booklet id", async () => {
			await authenticateAs(adminUser.user.id);

			const res = await reorderBookletApplications("", []);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Booklet ID is required");
		});

		it("rejects reordering when assignments is not an array", async () => {
			const booklet = await createBookletRecord();
			await authenticateAs(adminUser.user.id);

			const res = await reorderBookletApplications(booklet.id, null as unknown as []);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Assignments must be an array");
		});
	});

	describe("onboarding", () => {
		it("rejects an empty onboarding payload", async () => {
			const { user } = await approvedStudent();
			await authenticateAs(user.id);

			const res = await submitOnboarding(null as unknown as Parameters<typeof submitOnboarding>[0]);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Onboarding data is required");
		});
	});

	describe("push notification tokens", () => {
		it("requires a device id when removing a token", async () => {
			const { user } = await approvedStudent();
			await authenticateAs(user.id);

			const res = await removeFcmTokenForDevice("");

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Device ID is required");
		});

		it.each([
			["saveFcmToken", () => saveFcmToken({ token: "token", deviceId: "device", platform: "Web" })],
			["removeFcmTokenForDevice", () => removeFcmTokenForDevice("device")],
			["disablePushNotifications", () => disablePushNotifications()]
		])("%s rejects unauthenticated requests", async (_label, action) => {
			const res = await action();

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error).toMatchObject({ type: "AUTH_ERROR", code: "UNAUTHORIZED" });
		});
	});

	describe("notifications", () => {
		it("returns not found when marking a non-existent notification as read", async () => {
			const { user } = await approvedStudent();
			await authenticateAs(user.id);

			const res = await markNotificationAsRead("missing-notification");

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Notification not found");
		});
	});

	describe("file uploads", () => {
		it("requires a file key when deleting", async () => {
			const { user } = await approvedStudent();
			await authenticateAs(user.id);

			const res = await deleteR2File("");

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("File key is required");
		});

		it("requires a file type when requesting an upload url", async () => {
			const { user } = await approvedStudent();
			await authenticateAs(user.id);

			const res = await getUploadUrl("");

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("File type is required");
		});
	});

	describe("analytics time ranges", () => {
		it.each([
			["1m", 1],
			["3m", 2],
			["6m", 3],
			["1y", 4],
			["all", 5]
		] as const)("counts only reviews inside the %s range", async (timeRange, expected) => {
			const rangeAdmin = await createTestAdmin(prisma, { isActive: true, name: `Range Admin ${timeRange}` });
			const { user } = await approvedStudent();
			const now = new Date();

			for (const daysAgo of [10, 60, 150, 300, 500]) {
				await prisma.concessionApplication.create({
					data: {
						status: "Rejected",
						studentId: user.id,
						submissionCount: 1,
						applicationType: "New",
						rejectionReason: "Seeded",
						stationId: SEED.stations[0].id,
						reviewedById: rangeAdmin.user.id,
						reviewedAt: subDays(now, daysAgo),
						concessionClassId: SEED.concessionClasses[0].id,
						concessionPeriodId: SEED.concessionPeriods[0].id
					}
				});
			}
			await authenticateAs(adminUser.user.id);

			const res = await getAdminAnalytics({
				page: 1,
				pageSize: 10,
				timeRange,
				searchQuery: `Range Admin ${timeRange}`
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.data).toHaveLength(1);
				expect(res.data.data[0].applicationsCount).toBe(expected);
			}
		});
	});
});
