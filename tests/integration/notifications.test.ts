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
import {
	saveFcmToken,
	removeFcmTokenForDevice,
	disablePushNotifications,
	updatePushNotificationStatus
} from "@/actions/fcm";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Notifications Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let user: any;
	let otherUser: any;
	let notification1: any;
	let notification2: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		user = await createTestUser(prisma);
		otherUser = await createTestUser(prisma);

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

	describe("Guards & Authorization", () => {
		it("rejects unauthenticated access for notification operations", async () => {
			const res1 = await getNotifications({ page: 1, pageSize: 10 });
			expect(res1.isSuccess).toBe(false);

			const res2 = await markNotificationAsRead(notification1.id);
			expect(res2.isSuccess).toBe(false);

			const res3 = await markAllNotificationsAsRead();
			expect(res3.isSuccess).toBe(false);

			const res4 = await getUnreadNotificationCount();
			expect(res4.isSuccess).toBe(false);

			const res5 = await updatePushNotificationStatus(true);
			expect(res5.isSuccess).toBe(false);
		});

		it("prevents marking someone else's notification as read", async () => {
			await authenticateAs(otherUser.id);
			const res = await markNotificationAsRead(notification1.id);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("not found");
			}
		});
	});

	describe("notification CRUD & pagination", () => {
		it("retrieves paginated notifications and unread count", async () => {
			await authenticateAs(user.id);
			const res = await getNotifications({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBe(2);
				expect(res.data.unreadCount).toBe(2);
			}
		});

		it("handles empty notifications for a user", async () => {
			await authenticateAs(otherUser.id);
			const res = await getNotifications({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBe(0);
				expect(res.data.unreadCount).toBe(0);
				expect(res.data.data).toHaveLength(0);
			}
		});

		it("handles out-of-range page requests gracefully", async () => {
			await authenticateAs(user.id);
			const res = await getNotifications({ page: 99, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.data).toHaveLength(0);
				expect(res.data.currentPage).toBe(99);
				expect(res.data.hasNextPage).toBe(false);
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

		it("allows marking an already-read notification as read without error", async () => {
			await authenticateAs(user.id);
			const res = await markNotificationAsRead(notification1.id);
			expect(res.isSuccess).toBe(true);
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

	describe("FCM tokens & Push status", () => {
		it("rejects FCM token save without token string", async () => {
			await authenticateAs(user.id);
			const res = await saveFcmToken({
				token: "   ",
				platform: "Web"
			});
			expect(res.isSuccess).toBe(false);
		});

		it("saves an FCM token for a device and enables push notifications", async () => {
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

			const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
			expect(dbUser?.pushNotificationsEnabled).toBe(true);
		});

		it("updates existing token on duplicate FCM token save for same device", async () => {
			await authenticateAs(user.id);
			const res = await saveFcmToken({
				platform: "Android",
				deviceId: "device-xyz",
				token: "fcm-token-updated-999"
			});
			expect(res.isSuccess).toBe(true);

			const tokens = await prisma.fcmToken.findMany({
				where: { userId: user.id, deviceId: "device-xyz" }
			});
			expect(tokens).toHaveLength(1);
			expect(tokens[0].token).toBe("fcm-token-updated-999");
			expect(tokens[0].platform).toBe("Android");
		});

		it("removes FCM token for device", async () => {
			await authenticateAs(user.id);
			const res = await removeFcmTokenForDevice("device-xyz");
			expect(res.isSuccess).toBe(true);

			const tokenRecord = await prisma.fcmToken.findFirst({
				where: { token: "fcm-token-updated-999" }
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

		it("updates push notification status explicitly via updatePushNotificationStatus", async () => {
			await authenticateAs(user.id);
			const enableRes = await updatePushNotificationStatus(true);
			expect(enableRes.isSuccess).toBe(true);

			let updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
			expect(updatedUser?.pushNotificationsEnabled).toBe(true);

			const disableRes = await updatePushNotificationStatus(false);
			expect(disableRes.isSuccess).toBe(true);

			updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
			expect(updatedUser?.pushNotificationsEnabled).toBe(false);
		});
	});
});
