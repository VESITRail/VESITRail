import {
	getTestPrisma,
	cleanAllTables,
	authenticateAs,
	unauthenticate,
	createTestAdmin,
	createTestStudent,
	seedReferenceData
} from "./helpers";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createBooklet, getBooklets, deleteBooklet } from "@/actions/booklets";

describe("Booklets Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: any;
	let studentUser: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		studentUser = await createTestStudent(prisma, { status: "Approved" });
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	beforeEach(() => {
		unauthenticate();
	});

	describe("createBooklet", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await createBooklet({
				anchorX: 10,
				anchorY: 15,
				serialStartNumber: "0900000"
			});
			expect(res.isSuccess).toBe(false);
		});

		it("creates a booklet and computes serialEndNumber", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await createBooklet({
				anchorX: 10,
				anchorY: 15,
				serialStartNumber: "0900000"
			});
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.serialStartNumber).toBe("0900000");
				expect(res.data.serialEndNumber).toBe("0900049");
				expect(res.data.status).toBe("Available");
			}
		});

		it("returns error for duplicate serialStartNumber", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await createBooklet({
				anchorX: 10,
				anchorY: 15,
				serialStartNumber: "0900000"
			});
			expect(res.isSuccess).toBe(false);
		});
	});

	describe("getBooklets", () => {
		it("fetches paginated booklets for admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getBooklets({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBeGreaterThanOrEqual(1);
			}
		});
	});

	describe("deleteBooklet", () => {
		it("deletes an unused booklet", async () => {
			await authenticateAs(adminUser.user.id);
			const created = await createBooklet({
				anchorX: 5,
				anchorY: 5,
				serialStartNumber: "0950000"
			});
			expect(created.isSuccess).toBe(true);

			if (created.isSuccess) {
				const delRes = await deleteBooklet(created.data.id);
				expect(delRes.isSuccess).toBe(true);
			}
		});
	});
});
