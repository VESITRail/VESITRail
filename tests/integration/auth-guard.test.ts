import {
	getTestPrisma,
	cleanAllTables,
	authenticateAs,
	unauthenticate,
	createTestAdmin,
	createTestStudent,
	seedReferenceData
} from "./helpers";
import { requireAuth, requireAdmin, requireStudent } from "@/lib/auth-guard";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Auth Guard Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let activeAdmin: any;
	let inactiveAdmin: any;
	let pendingStudent: any;
	let approvedStudent: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);
		activeAdmin = await createTestAdmin(prisma, { isActive: true });
		inactiveAdmin = await createTestAdmin(prisma, { isActive: false });
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

	describe("requireAuth", () => {
		it("returns UNAUTHORIZED when no session headers are present", async () => {
			const res = await requireAuth();
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.code).toBe("UNAUTHORIZED");
			}
		});

		it("returns user session when authenticated with Better Auth", async () => {
			await authenticateAs(approvedStudent.user.id);
			const res = await requireAuth();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.userId).toBe(approvedStudent.user.id);
				expect(res.data.email).toBe(approvedStudent.user.email);
			}
		});
	});

	describe("requireAdmin", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await requireAdmin();
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.code).toBe("UNAUTHORIZED");
			}
		});

		it("returns FORBIDDEN when user has no admin record", async () => {
			await authenticateAs(approvedStudent.user.id);
			const res = await requireAdmin();
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.code).toBe("FORBIDDEN");
			}
		});

		it("returns FORBIDDEN when admin is inactive", async () => {
			await authenticateAs(inactiveAdmin.user.id);
			const res = await requireAdmin();
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.code).toBe("FORBIDDEN");
			}
		});

		it("returns admin session when admin is active", async () => {
			await authenticateAs(activeAdmin.user.id);
			const res = await requireAdmin();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.userId).toBe(activeAdmin.user.id);
				expect(res.data.isActive).toBe(true);
			}
		});
	});

	describe("requireStudent", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await requireStudent();
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.code).toBe("UNAUTHORIZED");
			}
		});

		it("returns FORBIDDEN when user has no student record", async () => {
			await authenticateAs(activeAdmin.user.id);
			const res = await requireStudent();
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.code).toBe("FORBIDDEN");
			}
		});

		it("returns FORBIDDEN when student status is Pending", async () => {
			await authenticateAs(pendingStudent.user.id);
			const res = await requireStudent();
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.code).toBe("FORBIDDEN");
			}
		});

		it("returns student session when student is approved", async () => {
			await authenticateAs(approvedStudent.user.id);
			const res = await requireStudent();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.userId).toBe(approvedStudent.user.id);
				expect(res.data.studentId).toBe(approvedStudent.user.id);
			}
		});
	});
});
