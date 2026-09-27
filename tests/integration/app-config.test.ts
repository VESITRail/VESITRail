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
import { getFormLayoutConfig, updateFormLayoutConfig } from "@/actions/app-config";

describe("App Config Integration", () => {
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

	describe("getFormLayoutConfig", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await getFormLayoutConfig();
			expect(res.isSuccess).toBe(false);
		});

		it("returns empty object when no config exists", async () => {
			await prisma.appConfig.deleteMany({ where: { key: "form_layout" } });

			await authenticateAs(studentUser.user.id);
			const res = await getFormLayoutConfig();

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).toEqual({});
			}
		});

		it("returns existing form layout config for authenticated user", async () => {
			const mockConfig = {
				left: { gender: { x: 10, y: 20 } },
				right: { date_of_birth: { x: 30, y: 40 } }
			};

			await prisma.appConfig.upsert({
				where: { key: "form_layout" },
				create: { key: "form_layout", value: mockConfig },
				update: { value: mockConfig }
			});

			await authenticateAs(adminUser.user.id);
			const res = await getFormLayoutConfig();

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).toEqual(mockConfig);
			}
		});
	});

	describe("updateFormLayoutConfig", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await updateFormLayoutConfig({ test: true });
			expect(res.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when called by a student", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await updateFormLayoutConfig({ test: true });
			expect(res.isSuccess).toBe(false);
		});

		it("allows admin to create or update form layout configuration", async () => {
			await authenticateAs(adminUser.user.id);

			const newLayout = {
				left: { student_name_left: { x: 15, y: 25 } },
				right: { student_name_right: { x: 35, y: 45 } }
			};

			const updateRes = await updateFormLayoutConfig(newLayout);
			expect(updateRes.isSuccess).toBe(true);

			const getRes = await getFormLayoutConfig();
			expect(getRes.isSuccess).toBe(true);
			if (getRes.isSuccess) {
				expect(getRes.data).toEqual(newLayout);
			}
		});
	});
});
