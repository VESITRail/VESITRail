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
import { generateBookletPDF } from "@/actions/generate-booklet-pdf";
import { generateOverlayPDF } from "@/actions/generate-overlay-pdf";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { generateSampleOverlayPDF } from "@/actions/generate-sample-overlay-pdf";

const mockLayout = {
	left: {
		gender: { x: 10, y: 20 },
		class_left: { x: 10, y: 40 },
		period_left: { x: 10, y: 50 },
		to_station_left: { x: 10, y: 70 },
		from_station_left: { x: 10, y: 60 },
		student_name_left: { x: 10, y: 30 },
		date_of_issue_left: { x: 10, y: 110 },
		previous_certificate_number: { x: 10, y: 80 },
		last_season_ticket_held_upto_date: { x: 10, y: 90 },
		last_season_ticket_held_upto_year: { x: 10, y: 100 }
	},
	right: {
		age_years: { x: 200, y: 40 },
		age_months: { x: 200, y: 50 },
		class_right: { x: 200, y: 70 },
		period_right: { x: 200, y: 80 },
		date_of_birth: { x: 200, y: 60 },
		to_station_right: { x: 200, y: 100 },
		from_station_right: { x: 200, y: 90 },
		student_name_right: { x: 200, y: 30 },
		current_pass_class: { x: 200, y: 110 },
		date_of_issue_right: { x: 200, y: 170 },
		current_pass_to_station: { x: 200, y: 140 },
		current_pass_validity_to: { x: 200, y: 160 },
		current_pass_from_station: { x: 200, y: 130 },
		current_pass_validity_from: { x: 200, y: 150 },
		current_pass_season_ticket_number: { x: 200, y: 120 }
	}
};

describe("PDF Generation Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let booklet: any;
	let adminUser: any;
	let studentUser: any;
	let issuedApplication: any;
	let renewalApplication: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		studentUser = await createTestStudent(prisma, { status: "Approved" });

		booklet = await prisma.concessionBooklet.create({
			data: {
				anchorX: 0,
				anchorY: 0,
				totalPages: 50,
				status: "InUse",
				serialEndNumber: "0807599",
				serialStartNumber: "0807550"
			}
		});

		issuedApplication = await prisma.concessionApplication.create({
			data: {
				pageOffset: 0,
				status: "Issued",
				issuedAt: new Date(),
				applicationType: "New",
				reviewedAt: new Date(),
				studentId: studentUser.user.id,
				stationId: SEED.stations[0].id,
				concessionBookletId: booklet.id,
				reviewedById: adminUser.user.id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
			}
		});

		renewalApplication = await prisma.concessionApplication.create({
			data: {
				pageOffset: 1,
				status: "Issued",
				issuedAt: new Date(),
				reviewedAt: new Date(),
				applicationType: "Renewal",
				studentId: studentUser.user.id,
				stationId: SEED.stations[0].id,
				concessionBookletId: booklet.id,
				reviewedById: adminUser.user.id,
				previousApplicationId: issuedApplication.id,
				concessionClassId: SEED.concessionClasses[0].id,
				concessionPeriodId: SEED.concessionPeriods[0].id
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

	describe("generateBookletPDF", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await generateBookletPDF(booklet.id);
			expect(res.isSuccess).toBe(false);
		});

		it("returns error when booklet not found", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await generateBookletPDF("00000000-0000-0000-0000-000000000000");
			expect(res.isSuccess).toBe(false);
		});

		it("generates booklet report PDF data URI for admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await generateBookletPDF(booklet.id);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).toContain("data:application/pdf;base64,");
			}
		});
	});

	describe("generateOverlayPDF", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await generateOverlayPDF(issuedApplication.id);
			expect(res.isSuccess).toBe(false);
		});

		it("returns error when application not found", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await generateOverlayPDF("00000000-0000-0000-0000-000000000000");
			expect(res.isSuccess).toBe(false);
		});

		it("returns error when application has no booklet assigned", async () => {
			const unassignedApp = await prisma.concessionApplication.create({
				data: {
					status: "Approved",
					applicationType: "New",
					studentId: studentUser.user.id,
					stationId: SEED.stations[0].id,
					concessionClassId: SEED.concessionClasses[0].id,
					concessionPeriodId: SEED.concessionPeriods[0].id
				}
			});

			await authenticateAs(adminUser.user.id);
			const res = await generateOverlayPDF(unassignedApp.id);
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("booklet not assigned");
			}
		});

		it("returns error when form layout config is missing", async () => {
			await prisma.appConfig.deleteMany({ where: { key: "form_layout" } });

			await authenticateAs(adminUser.user.id);
			const res = await generateOverlayPDF(issuedApplication.id);
			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Form layout configuration not found");
			}
		});

		it("generates overlay PDF Uint8Array for new application when config exists", async () => {
			await prisma.appConfig.upsert({
				where: { key: "form_layout" },
				update: { value: mockLayout },
				create: { key: "form_layout", value: mockLayout }
			});

			await authenticateAs(adminUser.user.id);
			const res = await generateOverlayPDF(issuedApplication.id);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).toBeInstanceOf(Uint8Array);
				expect(res.data.length).toBeGreaterThan(0);
			}
		});

		it("generates overlay PDF Uint8Array for renewal application", async () => {
			await prisma.appConfig.upsert({
				where: { key: "form_layout" },
				update: { value: mockLayout },
				create: { key: "form_layout", value: mockLayout }
			});

			await authenticateAs(adminUser.user.id);
			const res = await generateOverlayPDF(renewalApplication.id);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).toBeInstanceOf(Uint8Array);
				expect(res.data.length).toBeGreaterThan(0);
			}
		});
	});

	describe("generateSampleOverlayPDF", () => {
		it("returns UNAUTHORIZED when not admin", async () => {
			await authenticateAs(studentUser.user.id);
			const res = await generateSampleOverlayPDF(0, 0);
			expect(res.isSuccess).toBe(false);
		});

		it("returns error when form layout config is missing", async () => {
			await prisma.appConfig.deleteMany({ where: { key: "form_layout" } });

			await authenticateAs(adminUser.user.id);
			const res = await generateSampleOverlayPDF(0, 0);
			expect(res.isSuccess).toBe(false);
		});

		it("generates sample overlay PDF data URI for admin", async () => {
			await prisma.appConfig.upsert({
				where: { key: "form_layout" },
				update: { value: mockLayout },
				create: { key: "form_layout", value: mockLayout }
			});

			await authenticateAs(adminUser.user.id);
			const res = await generateSampleOverlayPDF(5, 10);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data).toContain("data:application/pdf;base64,");
			}
		});
	});
});
