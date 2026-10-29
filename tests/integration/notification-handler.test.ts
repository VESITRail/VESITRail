import {
	sendNotification,
	sendConcessionNotification,
	sendAddressChangeNotification,
	sendStudentAccountNotification
} from "@/lib/notifications/handler";
import { getNotificationScenario } from "@/lib/notifications/scenarios";
import { SEED, getTestPrisma, cleanAllTables, createTestStudent, seedReferenceData } from "./helpers";
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

const { sendMail, sendEachForMulticast } = vi.hoisted(() => ({
	sendMail: vi.fn(),
	sendEachForMulticast: vi.fn()
}));

vi.mock("nodemailer", () => ({
	default: { createTransport: vi.fn(() => ({ sendMail })) },
	createTransport: vi.fn(() => ({ sendMail }))
}));

vi.mock("firebase-admin/messaging", () => ({
	getMessaging: vi.fn(() => ({ sendEachForMulticast }))
}));

describe("Notification Handler Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let approvedStudent: Awaited<ReturnType<typeof createTestStudent>>;
	let pendingStudent: Awaited<ReturnType<typeof createTestStudent>>;

	const scenario = (id: string) => getNotificationScenario(id)!;

	const setChannels = async (userId: string, channels: { email: boolean; push: boolean }) => {
		await prisma.user.update({
			where: { id: userId },
			data: { emailNotificationsEnabled: channels.email, pushNotificationsEnabled: channels.push }
		});
	};

	const addFcmToken = async (userId: string, token: string, deviceId: string) => {
		await prisma.fcmToken.create({ data: { userId, token, deviceId, platform: "Web" } });
	};

	const createApplication = async (studentId: string, applicationType: "New" | "Renewal" = "New") =>
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

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		approvedStudent = await createTestStudent(prisma, { status: "Approved", name: "Approved Student" });
		pendingStudent = await createTestStudent(prisma, { status: "Pending", name: "Pending Student" });
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	beforeEach(async () => {
		await prisma.notification.deleteMany();
		await prisma.fcmToken.deleteMany();
		await setChannels(approvedStudent.user.id, { email: true, push: true });
		await setChannels(pendingStudent.user.id, { email: true, push: true });

		sendMail.mockReset();
		sendMail.mockResolvedValue({ messageId: "mock-email-id" });
		sendEachForMulticast.mockReset();
		sendEachForMulticast.mockImplementation(async ({ tokens }: { tokens: string[] }) => ({
			successCount: tokens.length,
			failureCount: 0,
			responses: tokens.map(() => ({ success: true }))
		}));
	});

	describe("sendNotification", () => {
		it("returns a validation error for an unknown scenario", async () => {
			const res = await sendNotification({
				templateParams: { userName: "Placeholder" },
				scenarioId: "does_not_exist",
				studentId: approvedStudent.user.id
			});

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Invalid scenario ID: does_not_exist");
			expect(await prisma.notification.count()).toBe(0);
		});

		it("returns a validation error when the student does not exist", async () => {
			const res = await sendNotification({
				templateParams: { userName: "Placeholder" },
				studentId: "missing-student",
				scenarioId: "concession_approval"
			});

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Student not found");
		});

		it("blocks non-account scenarios for students that are not approved", async () => {
			const res = await sendNotification({
				templateParams: { userName: "Placeholder" },
				scenarioId: "concession_approval",
				studentId: pendingStudent.user.id
			});

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) expect(res.error.message).toBe("Student is not approved");
			expect(await prisma.notification.count({ where: { userId: pendingStudent.user.id } })).toBe(0);
		});

		it("allows student account scenarios for students that are not approved", async () => {
			const res = await sendNotification({
				templateParams: { userName: "Placeholder" },
				scenarioId: "student_rejection",
				studentId: pendingStudent.user.id
			});

			expect(res.isSuccess).toBe(true);
			expect(await prisma.notification.count({ where: { userId: pendingStudent.user.id } })).toBe(1);
		});

		it("persists an in-app notification with the scenario title, body, url and application id", async () => {
			const res = await sendNotification({
				templateParams: { userName: "Placeholder" },
				applicationId: "app-123",
				scenarioId: "concession_approval",
				studentId: approvedStudent.user.id,
				url: "/dashboard/student/apply-concession"
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) expect(res.data.inApp).toBe(true);

			const notifications = await prisma.notification.findMany({ where: { userId: approvedStudent.user.id } });
			expect(notifications).toHaveLength(1);
			expect(notifications[0]).toMatchObject({
				isRead: false,
				messageId: "app-123",
				url: "/dashboard/student/apply-concession",
				title: scenario("concession_approval").inApp.title,
				body: scenario("concession_approval").inApp.body
			});
		});

		it("defaults the in-app notification url to the student dashboard", async () => {
			await sendNotification({
				templateParams: { userName: "Placeholder" },
				scenarioId: "concession_approval",
				studentId: approvedStudent.user.id
			});

			const notification = await prisma.notification.findFirst({ where: { userId: approvedStudent.user.id } });
			expect(notification?.url).toBe("/dashboard/student");
		});

		it("sends an email to the student when email notifications are enabled", async () => {
			const res = await sendNotification({
				templateParams: { userName: "Placeholder" },
				scenarioId: "concession_approval",
				studentId: approvedStudent.user.id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) expect(res.data.email).toBe(true);
			expect(sendMail).toHaveBeenCalledTimes(1);
			expect(sendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					to: approvedStudent.user.email,
					subject: scenario("concession_approval").email.subject
				})
			);
		});

		it("does not send an email when email notifications are disabled", async () => {
			await setChannels(approvedStudent.user.id, { email: false, push: false });

			const res = await sendNotification({
				templateParams: { userName: "Placeholder" },
				scenarioId: "concession_approval",
				studentId: approvedStudent.user.id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).toEqual({ inApp: true });
			}
			expect(sendMail).not.toHaveBeenCalled();
			expect(sendEachForMulticast).not.toHaveBeenCalled();
		});

		it("sends a push notification to every registered token when push is enabled", async () => {
			await setChannels(approvedStudent.user.id, { email: false, push: true });
			await addFcmToken(approvedStudent.user.id, "token-a", "device-a");
			await addFcmToken(approvedStudent.user.id, "token-b", "device-b");

			const res = await sendNotification({
				templateParams: { shortId: 42, userName: "Placeholder" },
				scenarioId: "concession_approval",
				studentId: approvedStudent.user.id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) expect(res.data.push).toBe(true);
			expect(sendEachForMulticast).toHaveBeenCalledTimes(1);

			const message = sendEachForMulticast.mock.calls[0][0];
			expect(message.tokens.sort()).toEqual(["token-a", "token-b"]);
			expect(message.data).toEqual({
				title: scenario("concession_approval").push.title,
				url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/student`,
				body: `Concession #42: ${scenario("concession_approval").push.body}`
			});
		});

		it("reports a push failure but still succeeds when the student has no FCM tokens", async () => {
			await setChannels(approvedStudent.user.id, { email: false, push: true });

			const res = await sendNotification({
				templateParams: { userName: "Placeholder" },
				scenarioId: "concession_approval",
				studentId: approvedStudent.user.id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.inApp).toBe(true);
				expect(res.data.push).toBeUndefined();
				expect(res.data.errors).toEqual(["Push notification failed: No FCM tokens found for user"]);
			}
		});

		it("removes tokens that FCM reports as invalid or unregistered", async () => {
			await setChannels(approvedStudent.user.id, { email: false, push: true });
			await addFcmToken(approvedStudent.user.id, "token-valid", "device-1");
			await addFcmToken(approvedStudent.user.id, "token-invalid", "device-2");
			await addFcmToken(approvedStudent.user.id, "token-unregistered", "device-3");
			await addFcmToken(approvedStudent.user.id, "token-transient", "device-4");

			const failures: Record<string, string> = {
				"token-invalid": "messaging/invalid-registration-token",
				"token-unregistered": "messaging/registration-token-not-registered",
				"token-transient": "messaging/internal-error"
			};
			sendEachForMulticast.mockImplementation(async ({ tokens }: { tokens: string[] }) => ({
				successCount: 1,
				failureCount: 3,
				responses: tokens.map((token) =>
					failures[token] ? { success: false, error: { code: failures[token] } } : { success: true }
				)
			}));

			await sendNotification({
				templateParams: { userName: "Placeholder" },
				scenarioId: "concession_approval",
				studentId: approvedStudent.user.id
			});

			const remaining = await prisma.fcmToken.findMany({ where: { userId: approvedStudent.user.id } });
			expect(remaining.map((t) => t.token).sort()).toEqual(["token-transient", "token-valid"]);
		});

		it("still succeeds and reports the error when sending the email fails", async () => {
			await setChannels(approvedStudent.user.id, { email: true, push: false });
			sendMail.mockRejectedValue(new Error("SMTP down"));

			const res = await sendNotification({
				templateParams: { userName: "Placeholder" },
				scenarioId: "concession_approval",
				studentId: approvedStudent.user.id
			});

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.inApp).toBe(true);
				expect(res.data.email).toBeUndefined();
				expect(res.data.errors).toEqual(["Email notification failed: Failed to send email notification"]);
			}
		});
	});

	describe("scenario helpers", () => {
		it("sends the approval scenario for an approved new concession", async () => {
			const application = await createApplication(approvedStudent.user.id, "New");

			await sendConcessionNotification(approvedStudent.user.id, application.id, true, "New");

			const notification = await prisma.notification.findFirst({ where: { userId: approvedStudent.user.id } });
			expect(notification).toMatchObject({
				messageId: application.id,
				url: "/dashboard/student",
				title: scenario("concession_approval").inApp.title
			});
		});

		it("sends the renewal approval scenario for an approved renewal", async () => {
			const application = await createApplication(approvedStudent.user.id, "Renewal");

			await sendConcessionNotification(approvedStudent.user.id, application.id, true, "Renewal");

			const notification = await prisma.notification.findFirst({ where: { userId: approvedStudent.user.id } });
			expect(notification?.title).toBe(scenario("concession_renewal_approval").inApp.title);
		});

		it("sends the rejection scenario with the reason for a rejected concession", async () => {
			await setChannels(approvedStudent.user.id, { email: true, push: false });
			const application = await createApplication(approvedStudent.user.id);

			await sendConcessionNotification(approvedStudent.user.id, application.id, false, "New", "Blurry document");

			const notification = await prisma.notification.findFirst({ where: { userId: approvedStudent.user.id } });
			expect(notification?.title).toBe(scenario("concession_rejection").inApp.title);
			expect(sendMail.mock.calls[0][0].html).toContain("Blurry document");
		});

		it("returns undefined without notifying when the concession student does not exist", async () => {
			const res = await sendConcessionNotification("missing-student", "missing-app", true, "New");

			expect(res).toBeUndefined();
			expect(await prisma.notification.count()).toBe(0);
		});

		it.each([
			[true, "student_approval", "/dashboard/student"],
			[false, "student_rejection", "/onboarding"]
		])("sends the student account scenario when approved is %s", async (isApproved, scenarioId, expectedUrl) => {
			await sendStudentAccountNotification(pendingStudent.user.id, isApproved, "Invalid ID card", 2);

			const notification = await prisma.notification.findFirst({ where: { userId: pendingStudent.user.id } });
			expect(notification).toMatchObject({
				url: expectedUrl,
				title: scenario(scenarioId).inApp.title
			});
		});

		it.each([
			[true, "address_change_approval", "/dashboard/student/profile"],
			[false, "address_change_rejection", "/dashboard/student/change-address"]
		])("sends the address change scenario when approved is %s", async (isApproved, scenarioId, expectedUrl) => {
			await sendAddressChangeNotification(
				approvedStudent.user.id,
				"addr-1",
				isApproved,
				"Airoli",
				"Andheri",
				"Proof unclear"
			);

			const notification = await prisma.notification.findFirst({ where: { userId: approvedStudent.user.id } });
			expect(notification).toMatchObject({
				url: expectedUrl,
				messageId: "addr-1",
				title: scenario(scenarioId).inApp.title
			});
		});

		it.each([
			["student account", () => sendStudentAccountNotification("missing-student", true)],
			["address change", () => sendAddressChangeNotification("missing-student", "addr-1", true, "Airoli", "Andheri")]
		])("returns undefined without notifying when the %s student does not exist", async (_label, send) => {
			expect(await send()).toBeUndefined();
			expect(await prisma.notification.count()).toBe(0);
		});
	});
});
