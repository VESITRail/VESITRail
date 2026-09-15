import {
	getScenariosByType,
	notificationScenarios,
	getScenariosByCategory,
	getNotificationScenario
} from "@/lib/notifications/scenarios";
import { describe, it, expect } from "vitest";

describe("Notification Scenarios (src/lib/notifications/scenarios.ts)", () => {
	describe("Data Integrity", () => {
		it("contains exactly 6 configured scenarios", () => {
			expect(notificationScenarios).toHaveLength(6);
		});

		it("ensures every scenario has non-empty identifiers and required content", () => {
			for (const s of notificationScenarios) {
				expect(s.id).toBeTruthy();
				expect(s.name).toBeTruthy();
				expect(["approval", "rejection"]).toContain(s.type);
				expect(["student", "concession", "address_change"]).toContain(s.category);

				expect(s.push.title).toBeTruthy();
				expect(s.push.body).toBeTruthy();

				expect(s.inApp.title).toBeTruthy();
				expect(s.inApp.body).toBeTruthy();

				expect(s.email.subject).toBeTruthy();
				expect(s.email.heading).toBeTruthy();
				expect(s.email.description).toBeTruthy();
			}
		});

		it("ensures all scenario IDs are unique", () => {
			const ids = notificationScenarios.map((s) => s.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});
	});

	describe("getNotificationScenario", () => {
		it("returns matching scenario by id", () => {
			const studentApp = getNotificationScenario("student_approval");
			expect(studentApp).toBeDefined();
			expect(studentApp?.name).toBe("Student Account Approved");
			expect(studentApp?.type).toBe("approval");
			expect(studentApp?.category).toBe("student");
		});

		it("returns undefined for unknown scenario id", () => {
			expect(getNotificationScenario("unknown_scenario")).toBeUndefined();
		});
	});

	describe("getScenariosByCategory", () => {
		it("filters student scenarios", () => {
			const studentScenarios = getScenariosByCategory("student");
			expect(studentScenarios).toHaveLength(2);
			expect(studentScenarios.every((s) => s.category === "student")).toBe(true);
		});

		it("filters concession scenarios", () => {
			const concessionScenarios = getScenariosByCategory("concession");
			expect(concessionScenarios).toHaveLength(2);
			expect(concessionScenarios.every((s) => s.category === "concession")).toBe(true);
		});

		it("filters address_change scenarios", () => {
			const addressScenarios = getScenariosByCategory("address_change");
			expect(addressScenarios).toHaveLength(2);
			expect(addressScenarios.every((s) => s.category === "address_change")).toBe(true);
		});
	});

	describe("getScenariosByType", () => {
		it("filters approval scenarios (3 total)", () => {
			const approvals = getScenariosByType("approval");
			expect(approvals).toHaveLength(3);
			expect(approvals.every((s) => s.type === "approval")).toBe(true);
		});

		it("filters rejection scenarios (3 total)", () => {
			const rejections = getScenariosByType("rejection");
			expect(rejections).toHaveLength(3);
			expect(rejections.every((s) => s.type === "rejection")).toBe(true);
		});
	});
});
