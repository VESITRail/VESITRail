import {
	getTestPrisma,
	cleanAllTables,
	createTestUser,
	authenticateAs,
	unauthenticate,
	createTestAdmin,
	createTestStudent,
	seedReferenceData
} from "./helpers";
import { checkUserRole, checkAllUserRoles } from "@/actions/check-role";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Check Role Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let plainUser: any;
	let activeAdmin: any;
	let inactiveAdmin: any;
	let pendingStudent: any;
	let approvedStudent: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		plainUser = await createTestUser(prisma);
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

	describe("checkUserRole", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await checkUserRole();
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.code).toBe("UNAUTHORIZED");
			}
		});

		it("returns admin role with Active status for active admin", async () => {
			await authenticateAs(activeAdmin.user.id);
			const res = await checkUserRole();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.role).toBe("admin");
				expect(res.data.status).toBe("Active");
			}
		});

		it("returns admin role with Inactive status for inactive admin", async () => {
			await authenticateAs(inactiveAdmin.user.id);
			const res = await checkUserRole();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.role).toBe("admin");
				expect(res.data.status).toBe("Inactive");
			}
		});

		it("returns student role with Approved status for approved student", async () => {
			await authenticateAs(approvedStudent.user.id);
			const res = await checkUserRole();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.role).toBe("student");
				expect(res.data.status).toBe("Approved");
			}
		});

		it("returns student role with Pending status for pending student", async () => {
			await authenticateAs(pendingStudent.user.id);
			const res = await checkUserRole();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.role).toBe("student");
				expect(res.data.status).toBe("Pending");
			}
		});

		it("returns student role with NeedsOnboarding for plain user without student profile", async () => {
			await authenticateAs(plainUser.id);
			const res = await checkUserRole();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.role).toBe("student");
				expect(res.data.status).toBe("NeedsOnboarding");
			}
		});
	});

	describe("checkAllUserRoles", () => {
		it("returns admin status for admin user", async () => {
			await authenticateAs(activeAdmin.user.id);
			const res = await checkAllUserRoles();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.admin?.status).toBe("Active");
			}
		});

		it("returns student status for student user", async () => {
			await authenticateAs(approvedStudent.user.id);
			const res = await checkAllUserRoles();
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.student?.status).toBe("Approved");
			}
		});
	});
});
