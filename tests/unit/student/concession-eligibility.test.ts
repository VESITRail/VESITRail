import * as eligibility from "@/lib/concession-eligibility";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const semesterId = "current";
const makeApplication = (
	id: string,
	status: "Issued" | "Rejected" | "Pending" | "Approved",
	semester: string | null = semesterId,
	issuedAt: Date | null = null,
	reviewedAt: Date | null = null
) => ({
	id,
	status,
	issuedAt,
	reviewedAt,
	semesterId: semester,
	applicationType: "New" as const,
	concessionPeriod: { duration: 1 }
});

describe("getConcessionEligibility", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2027-08-08T12:00:00Z"));
	});

	afterEach(() => vi.useRealTimers());

	it("allows a new application with no history", () => {
		expect(eligibility.getConcessionEligibility([], semesterId)).toEqual({
			blocker: null,
			correction: null,
			previousPass: null
		});
	});

	it.each([null, "past"])("ignores expired passes and rejections from semester %s for classification", (semester) => {
		const rejected = makeApplication("rejected", "Rejected", semester);
		const issued = makeApplication("issued", "Issued", semester, new Date("2027-06-10"));

		expect(eligibility.getConcessionEligibility([rejected, issued], semesterId)).toEqual({
			blocker: null,
			correction: null,
			previousPass: null
		});
	});

	it("selects the current rejection and the latest issued pass in its semester", () => {
		const rejected = makeApplication("rejected", "Rejected");
		const past = makeApplication("past", "Issued", "past", new Date("2027-06-15"));
		const older = makeApplication("older", "Issued", semesterId, new Date("2027-05-01"));
		const issued = makeApplication("issued", "Issued", semesterId, new Date("2027-06-10"));

		expect(eligibility.getConcessionEligibility([rejected, past, issued, older], semesterId)).toEqual({
			blocker: null,
			correction: rejected,
			previousPass: issued
		});
	});

	it("selects an issued pass without reopening an older same-semester rejection", () => {
		const rejected = makeApplication("rejected", "Rejected");
		const issued = makeApplication("issued", "Issued", semesterId, new Date("2027-06-10"));

		expect(eligibility.getConcessionEligibility([issued, rejected], semesterId)).toEqual({
			blocker: null,
			correction: null,
			previousPass: issued
		});
	});

	it("allows a rejected first application to be corrected as new", () => {
		const rejected = makeApplication("rejected", "Rejected");

		expect(eligibility.getConcessionEligibility([rejected], semesterId)).toEqual({
			blocker: null,
			correction: rejected,
			previousPass: null
		});
	});

	it.each(["Pending", "Approved"] as const)("blocks a %s application from a prior semester", (status) => {
		const rejected = makeApplication("rejected", "Rejected");
		const queued = makeApplication("queued", status, "past");

		expect(eligibility.getConcessionEligibility([rejected, queued], semesterId).blocker).toMatchObject({ status });
	});

	it("blocks an older pass that is still active, using the review date when necessary", () => {
		const latest = makeApplication("latest", "Issued", semesterId, new Date("2027-06-01"));
		const active = makeApplication("active", "Issued", "past", null, new Date("2027-08-01T12:00:00Z"));

		expect(eligibility.getConcessionEligibility([latest, active], semesterId).blocker).toMatchObject({
			status: "ActivePass",
			daysRemaining: 24
		});
	});

	it("requires verification when an issued pass has no dates", () => {
		const issued = makeApplication("issued", "Issued");
		expect(eligibility.getConcessionEligibility([issued], semesterId).blocker).toEqual({
			status: "UnverifiedPass"
		});
	});

	it("keeps correction and renewal unavailable when the semester is closed", () => {
		const rejected = makeApplication("rejected", "Rejected", null);
		const issued = makeApplication("issued", "Issued", null, new Date("2027-06-10"));

		expect(eligibility.getConcessionEligibility([rejected, issued], null)).toEqual({
			blocker: null,
			correction: null,
			previousPass: null
		});
	});
});
