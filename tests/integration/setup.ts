import { vi, afterEach } from "vitest";
import { getActiveHeaders, clearTestHeaders } from "./headers-state";

vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => ({
		get: vi.fn(),
		set: vi.fn(),
		delete: vi.fn()
	})),
	headers: vi.fn(async () => getActiveHeaders())
}));

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
	revalidatePath: vi.fn(),
	unstable_cache: vi.fn((fn: Function) => fn)
}));

vi.mock("better-auth/cookies", () => ({
	getSessionCookie: vi.fn(() => "mock-session-cookie")
}));

vi.mock("@aws-sdk/client-s3", () => {
	const mockSend = vi.fn().mockResolvedValue({});
	return {
		PutObjectCommand: vi.fn(),
		DeleteObjectCommand: vi.fn(),
		S3Client: vi.fn(() => ({ send: mockSend }))
	};
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
	getSignedUrl: vi.fn().mockResolvedValue("https://test-presigned-url.example.com/test-key.pdf")
}));

vi.mock("firebase-admin/app", () => ({
	cert: vi.fn(),
	initializeApp: vi.fn(),
	getApps: vi.fn(() => [{ name: "test" }])
}));

vi.mock("firebase-admin/messaging", () => ({
	getMessaging: vi.fn(() => ({
		send: vi.fn().mockResolvedValue("mock-message-id"),
		sendEachForMulticast: vi.fn().mockResolvedValue({
			successCount: 1,
			failureCount: 0,
			responses: [{ success: true, messageId: "mock-msg-id" }]
		})
	}))
}));

vi.mock("nodemailer", () => ({
	default: {
		createTransport: vi.fn(() => ({
			sendMail: vi.fn().mockResolvedValue({ messageId: "mock-email-id" })
		}))
	},
	createTransport: vi.fn(() => ({
		sendMail: vi.fn().mockResolvedValue({ messageId: "mock-email-id" })
	}))
}));

vi.mock("@/lib/notifications", () => ({
	sendConcessionNotification: vi.fn().mockResolvedValue(undefined),
	sendAddressChangeNotification: vi.fn().mockResolvedValue(undefined),
	sendStudentAccountNotification: vi.fn().mockResolvedValue(undefined),
	sendNotification: vi.fn().mockResolvedValue({ isSuccess: true, data: { push: true, email: true, inApp: true } })
}));

afterEach(() => {
	clearTestHeaders();
	vi.clearAllMocks();
});
