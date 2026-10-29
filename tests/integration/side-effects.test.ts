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
	submitConcessionApplication,
	reviewConcessionApplication
} from "@/actions/concession";
import {
	sendConcessionNotification,
	sendAddressChangeNotification,
	sendStudentAccountNotification
} from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { approveStudent, rejectStudent } from "@/actions/student";
import { submitAddressChangeApplication } from "@/actions/change-address";
import { reviewAddressChangeRequest } from "@/actions/address-change-requests";
import { createBooklet, deleteBooklet, updateBooklet } from "@/actions/booklets";
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

describe("Action Side Effects Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: Awaited<ReturnType<typeof createTestAdmin>>;
	let serialCounter = 0;

	const revalidatedPaths = () => vi.mocked(revalidatePath).mock.calls.map(([path]) => path);

	const createPendingApplication = async (studentId: string, applicationType: "New" | "Renewal" = "New") =>
		prisma.concessionApplication.create({
			data: {
				studentId,
				applicationType,
				status: "Pending",
				submissionCount: 1,
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			}
		});

	const createAvailableBooklet = async () => {
		serialCounter++;
		const start = 9100001 + serialCounter * 100;
		return prisma.concessionBooklet.create({
			data: {
				anchorX: 0,
				anchorY: 0,
				totalPages: 50,
				status: "Available",
				serialStartNumber: `0${start}`,
				serialEndNumber: `0${start + 49}`
			}
		});
	};

	const createPendingAddressChange = async (studentId: string) =>
		prisma.addressChange.create({
			data: {
				studentId,
				status: "Pending",
				submissionCount: 1,
				newStationId: SEED.stations[1].id,
				newAddress: "New Address Ghatkopar",
				currentAddress: "Old Address Chembur",
				currentStationId: SEED.stations[0].id,
				verificationDocUrl: "https://test-r2.example.com/address-doc.pdf"
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

	describe("student review", () => {
		it("approveStudent sends the account approval notification and revalidates the students page", async () => {
			const { user } = await createTestStudent(prisma, { status: "Pending" });
			await authenticateAs(adminUser.user.id);

			const res = await approveStudent({ studentId: user.id });

			expect(res.isSuccess).toBe(true);
			expect(sendStudentAccountNotification).toHaveBeenCalledWith(user.id, true, undefined, 1);
			expect(revalidatedPaths()).toEqual(["/dashboard/admin/students"]);
		});

		it("rejectStudent sends the account rejection notification with the reason", async () => {
			const { user } = await createTestStudent(prisma, { status: "Pending" });
			await authenticateAs(adminUser.user.id);

			const res = await rejectStudent({ studentId: user.id, rejectionReason: "Invalid ID card" });

			expect(res.isSuccess).toBe(true);
			expect(sendStudentAccountNotification).toHaveBeenCalledWith(user.id, false, "Invalid ID card", 1);
			expect(revalidatedPaths()).toEqual(
				expect.arrayContaining([
					"/dashboard/admin/students",
					"/dashboard/admin/applications",
					"/dashboard/admin/address-change-requests"
				])
			);
		});

		it("does not notify or revalidate when the review fails", async () => {
			const { user } = await createTestStudent(prisma, { status: "Approved" });
			await authenticateAs(adminUser.user.id);

			const res = await approveStudent({ studentId: user.id });

			expect(res.isSuccess).toBe(false);
			expect(sendStudentAccountNotification).not.toHaveBeenCalled();
			expect(revalidatePath).not.toHaveBeenCalled();
		});
	});

	describe("concession review", () => {
		it.each([
			["New", "Approved", true, undefined],
			["Renewal", "Approved", true, undefined],
			["New", "Rejected", false, "Blurry document"]
		] as const)(
			"notifies the student for a %s application that is %s",
			async (applicationType, status, isApproved, rejectionReason) => {
				const { user } = await createTestStudent(prisma, { status: "Approved" });
				const application = await createPendingApplication(user.id, applicationType);
				await authenticateAs(adminUser.user.id);

				const res = await reviewConcessionApplication(application.id, status, rejectionReason);

				expect(res.isSuccess).toBe(true);
				expect(sendConcessionNotification).toHaveBeenCalledWith(
					user.id,
					application.id,
					isApproved,
					applicationType,
					rejectionReason
				);
				expect(revalidatedPaths()).toEqual(expect.arrayContaining(["/dashboard/admin", "/dashboard/admin/booklets"]));
			}
		);

		it("does not notify when the application has already been reviewed", async () => {
			const { user } = await createTestStudent(prisma, { status: "Approved" });
			const application = await createPendingApplication(user.id);
			await prisma.concessionApplication.update({ where: { id: application.id }, data: { status: "Approved" } });
			await authenticateAs(adminUser.user.id);

			const res = await reviewConcessionApplication(application.id, "Approved");

			expect(res.isSuccess).toBe(false);
			expect(sendConcessionNotification).not.toHaveBeenCalled();
		});

		it("assignBookletToConcession revalidates the admin dashboard and booklet page without notifying", async () => {
			const { user } = await createTestStudent(prisma, { status: "Approved" });
			const application = await createPendingApplication(user.id);
			await prisma.concessionApplication.update({ where: { id: application.id }, data: { status: "Approved" } });
			const booklet = await createAvailableBooklet();
			await authenticateAs(adminUser.user.id);

			const res = await assignBookletToConcession(application.id, booklet.id, 0);

			expect(res.isSuccess).toBe(true);
			expect(revalidatedPaths()).toEqual(
				expect.arrayContaining(["/dashboard/admin", `/dashboard/admin/booklets/${booklet.id}`])
			);
			expect(sendConcessionNotification).not.toHaveBeenCalled();
		});

		it("submitConcessionApplication revalidates the student dashboard", async () => {
			const { user } = await createTestStudent(prisma, { status: "Approved" });
			await authenticateAs(user.id);

			const res = await submitConcessionApplication({
				studentId: user.id,
				applicationType: "New",
				stationId: SEED.stations[0].id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			});

			expect(res.isSuccess).toBe(true);
			expect(revalidatedPaths()).toEqual(["/dashboard/student"]);
		});
	});

	describe("address change", () => {
		it.each([
			["Approved", true, undefined],
			["Rejected", false, "Proof unclear"]
		] as const)(
			"reviewAddressChangeRequest notifies the student when %s",
			async (status, isApproved, rejectionReason) => {
				const { user } = await createTestStudent(prisma, { status: "Approved" });
				const request = await createPendingAddressChange(user.id);
				await authenticateAs(adminUser.user.id);

				const res = await reviewAddressChangeRequest(request.id, status, rejectionReason);

				expect(res.isSuccess).toBe(true);
				expect(sendAddressChangeNotification).toHaveBeenCalledWith(
					user.id,
					request.id,
					isApproved,
					`${SEED.stations[0].name} (${SEED.stations[0].code})`,
					`${SEED.stations[1].name} (${SEED.stations[1].code})`,
					rejectionReason
				);
				expect(revalidatedPaths()).toEqual(
					expect.arrayContaining([
						"/dashboard/admin/address-change-requests",
						"/dashboard/admin/students",
						"/dashboard/student/change-address"
					])
				);
			}
		);

		it("submitAddressChangeApplication revalidates the change address page", async () => {
			const { user } = await createTestStudent(prisma, { status: "Approved" });
			await authenticateAs(user.id);

			const res = await submitAddressChangeApplication({
				newAddress: "Flat 2, New Road, Mumbai 400070",
				newStationId: SEED.stations[2].id,
				currentStationId: SEED.stations[0].id,
				currentAddress: "Test Address, Mumbai 400001",
				verificationDocUrl: "https://test-r2.example.com/address-doc.pdf"
			});

			expect(res.isSuccess).toBe(true);
			expect(revalidatedPaths()).toEqual(["/dashboard/student/change-address"]);
		});
	});

	describe("booklet management", () => {
		it("createBooklet revalidates the booklets page", async () => {
			await authenticateAs(adminUser.user.id);

			const res = await createBooklet({ anchorX: 0, anchorY: 0, serialStartNumber: "0950001" });

			expect(res.isSuccess).toBe(true);
			expect(revalidatedPaths()).toEqual(["/dashboard/admin/booklets"]);
		});

		it("updateBooklet revalidates the booklets page and admin dashboard", async () => {
			const booklet = await createAvailableBooklet();
			await authenticateAs(adminUser.user.id);

			const res = await updateBooklet(booklet.id, {
				anchorX: 5,
				anchorY: 5,
				isExhausted: false,
				serialStartNumber: booklet.serialStartNumber
			});

			expect(res.isSuccess).toBe(true);
			expect(revalidatedPaths()).toEqual(expect.arrayContaining(["/dashboard/admin/booklets", "/dashboard/admin"]));
		});

		it("deleteBooklet revalidates the booklets page", async () => {
			const booklet = await createAvailableBooklet();
			await authenticateAs(adminUser.user.id);

			const res = await deleteBooklet(booklet.id);

			expect(res.isSuccess).toBe(true);
			expect(revalidatedPaths()).toEqual(["/dashboard/admin/booklets"]);
		});
	});
});
