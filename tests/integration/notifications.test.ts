import {
	getTestPrisma,
	cleanAllTables,
	createTestUser,
	authenticateAs,
	unauthenticate,
	seedReferenceData
} from "./helpers";
import {
	getNotifications,
	markNotificationAsRead,
	markAllNotificationsAsRead,
	getUnreadNotificationCount
} from "@/actions/notifications";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { saveFcmToken, removeFcmTokenForDevice, disablePushNotifications } from "@/actions/fcm";

describe("Notifications Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let user: any;
	let notification1: any;
	let notification2: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		user = await createTestUser(prisma);

		notification1 = await prisma.notification.create({
			data: {
				isRead: false,
				body: "Body 1",
				userId: user.id,
				title: "Notification 1"
			}
		});

		notification2 = await prisma.notification.create({
			data: {
				isRead: false,
				body: "Body 2",
				userId: user.id,
				title: "Notification 2"
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

	describe("notification CRUD", () => {
		it("retrieves paginated notifications and unread count", async () => {
			await authenticateAs(user.id);
			const res = await getNotifications({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBe(2);
				expect(res.data.unreadCount).toBe(2);
			}
		});

		it("gets unread notification count", async () => {
			await authenticateAs(user.id);
			const res = await getUnreadNotificationCount();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.count).toBe(2);
			}
		});

		it("marks a single notification as read", async () => {
			await authenticateAs(user.id);
			const res = await markNotificationAsRead(notification1.id);
			expect(res.isSuccess).toBe(true);

			const countRes = await getUnreadNotificationCount();
			if (countRes.isSuccess) {
				expect(countRes.data.count).toBe(1);
			}
		});

		it("marks all notifications as read", async () => {
			await authenticateAs(user.id);
			const res = await markAllNotificationsAsRead();
			expect(res.isSuccess).toBe(true);

			const countRes = await getUnreadNotificationCount();
			if (countRes.isSuccess) {
				expect(countRes.data.count).toBe(0);
			}
		});
	});

	describe("FCM tokens", () => {
		it("saves an FCM token for a device", async () => {
			await authenticateAs(user.id);
			const res = await saveFcmToken({
				platform: "Web",
				deviceId: "device-xyz",
				token: "fcm-token-123456"
			});
			expect(res.isSuccess).toBe(true);

			const tokenRecord = await prisma.fcmToken.findFirst({
				where: { token: "fcm-token-123456" }
			});
			expect(tokenRecord).not.toBeNull();
		});

		it("removes FCM token for device", async () => {
			await authenticateAs(user.id);
			const res = await removeFcmTokenForDevice("device-xyz");
			expect(res.isSuccess).toBe(true);

			const tokenRecord = await prisma.fcmToken.findFirst({
				where: { token: "fcm-token-123456" }
			});
			expect(tokenRecord).toBeNull();
		});

		it("disables push notifications", async () => {
			await authenticateAs(user.id);
			const res = await disablePushNotifications();
			expect(res.isSuccess).toBe(true);

			const updatedUser = await prisma.user.findUnique({
				where: { id: user.id }
			});
			expect(updatedUser?.pushNotificationsEnabled).toBe(false);
		});
	});
});
