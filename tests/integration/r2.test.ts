import {
	getTestPrisma,
	cleanAllTables,
	authenticateAs,
	unauthenticate,
	createTestAdmin,
	createTestStudent,
	seedReferenceData
} from "./helpers";
import { getUploadUrl, deleteR2File } from "@/actions/r2";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("R2 Storage Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: any;
	let studentUserA: any;
	let studentUserB: any;
	const studentBKey = "student_b_verification.pdf";

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		studentUserA = await createTestStudent(prisma, { status: "Approved" });
		studentUserB = await createTestStudent(prisma, { status: "Approved" });

		await prisma.student.update({
			where: { userId: studentUserB.user.id },
			data: {
				verificationDocUrl: `https://test-r2.example.com/${studentBKey}`
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

	describe("getUploadUrl", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await getUploadUrl("application/pdf");
			expect(res.isSuccess).toBe(false);
		});

		it("returns validation error for non-PDF files", async () => {
			await authenticateAs(studentUserA.user.id);
			const res = await getUploadUrl("image/png");
			expect(res.isSuccess).toBe(false);
		});

		it("returns presigned upload URL for valid PDF", async () => {
			await authenticateAs(studentUserA.user.id);
			const res = await getUploadUrl("application/pdf");
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.uploadUrl).toBeDefined();
				expect(res.data.key.endsWith(".pdf")).toBe(true);
			}
		});
	});

	describe("deleteR2File", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await deleteR2File("document_123.pdf");
			expect(res.isSuccess).toBe(false);
		});

		it("returns validation error for invalid key format", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await deleteR2File("invalid/key/path");
			expect(res.isSuccess).toBe(false);
		});

		it("prevents student from deleting another student's document (cross-user authorization)", async () => {
			await authenticateAs(studentUserA.user.id);
			const res = await deleteR2File(studentBKey);

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("do not have permission to delete this file");
			}
		});

		it("allows admin to delete another student's document key", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await deleteR2File(studentBKey);
			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.message).toBe("File deleted successfully");
			}
		});

		it("allows student to delete own document key", async () => {
			await authenticateAs(studentUserA.user.id);
			const res = await deleteR2File("my_doc_456.pdf");
			expect(res.isSuccess).toBe(true);
		});
	});
});
