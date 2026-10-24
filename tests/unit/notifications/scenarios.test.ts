import {
	getPushBody,
	getScenariosByType,
	notificationScenarios,
	getScenariosByCategory,
	getNotificationScenario,
	getConcessionScenarioId
} from "@/lib/notifications/scenarios";
import { describe, it, expect } from "vitest";

describe("Notification Scenarios (src/lib/notifications/scenarios.ts)", () => {
	describe("Data Integrity", () => {
		it("contains exactly 7 configured scenarios", () => {
			expect(notificationScenarios).toHaveLength(7);
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
			expect(concessionScenarios).toHaveLength(3);
			expect(concessionScenarios.every((s) => s.category === "concession")).toBe(true);
		});

		it("filters address_change scenarios", () => {
			const addressScenarios = getScenariosByCategory("address_change");
			expect(addressScenarios).toHaveLength(2);
			expect(addressScenarios.every((s) => s.category === "address_change")).toBe(true);
		});

		it("returns empty array for unknown category string", () => {
			const unknownScenarios = getScenariosByCategory("unknown_category" as unknown as "student");
			expect(unknownScenarios).toEqual([]);
		});
	});

	describe("getScenariosByType", () => {
		it("filters approval scenarios (4 total)", () => {
			const approvals = getScenariosByType("approval");
			expect(approvals).toHaveLength(4);
			expect(approvals.every((s) => s.type === "approval")).toBe(true);
		});

		it("filters rejection scenarios (3 total)", () => {
			const rejections = getScenariosByType("rejection");
			expect(rejections).toHaveLength(3);
			expect(rejections.every((s) => s.type === "rejection")).toBe(true);
		});

		it("returns empty array for invalid or unsupported type value", () => {
			const invalidType = getScenariosByType("pending" as unknown as "approval");
			expect(invalidType).toEqual([]);
		});
	});

	describe("concession approval instructions", () => {
		it("asks for the college ID card on every channel of the new concession approval", () => {
			const scenario = getNotificationScenario("concession_approval")!;

			expect(scenario.push.body).toContain("college ID card");
			expect(scenario.inApp.body).toContain("college ID card");
			expect(scenario.email.description).toContain("college ID card");
		});

		it("asks for the existing pass and the college ID card on every channel of the renewal approval", () => {
			const scenario = getNotificationScenario("concession_renewal_approval")!;

			expect(scenario.type).toBe("approval");
			expect(scenario.category).toBe("concession");
			expect(scenario.push.body).toContain("existing pass");
			expect(scenario.push.body).toContain("college ID card");
			expect(scenario.inApp.body).toContain("existing pass");
			expect(scenario.inApp.body).toContain("college ID card");
			expect(scenario.email.description).toContain("existing pass");
			expect(scenario.email.description).toContain("college ID card");
		});

		it("does not ask for an existing pass on the new concession approval", () => {
			const scenario = getNotificationScenario("concession_approval")!;

			expect(scenario.push.body).not.toContain("existing pass");
			expect(scenario.inApp.body).not.toContain("existing pass");
			expect(scenario.email.description).not.toContain("existing pass");
		});
	});

	describe("getConcessionScenarioId", () => {
		it("selects the renewal approval scenario for approved renewals", () => {
			expect(getConcessionScenarioId(true, "Renewal")).toBe("concession_renewal_approval");
		});

		it("selects the standard approval scenario for approved new applications", () => {
			expect(getConcessionScenarioId(true, "New")).toBe("concession_approval");
		});

		it("selects the rejection scenario for rejected applications regardless of type", () => {
			expect(getConcessionScenarioId(false, "Renewal")).toBe("concession_rejection");
			expect(getConcessionScenarioId(false, "New")).toBe("concession_rejection");
		});

		it("resolves to existing scenarios", () => {
			for (const type of ["New", "Renewal"]) {
				expect(getNotificationScenario(getConcessionScenarioId(true, type))).toBeDefined();
			}
		});
	});

	describe("getPushBody", () => {
		it("appends the concession ID for concession scenarios", () => {
			const scenario = getNotificationScenario("concession_approval")!;

			expect(getPushBody(scenario, 42)).toBe(`Concession #42: ${scenario.push.body}`);
		});

		it("returns the plain body when no shortId is provided", () => {
			const scenario = getNotificationScenario("concession_rejection")!;

			expect(getPushBody(scenario)).toBe(scenario.push.body);
		});

		it("does not append an ID for non-concession scenarios", () => {
			const scenario = getNotificationScenario("address_change_approval")!;

			expect(getPushBody(scenario, 42)).toBe(scenario.push.body);
		});
	});
});
