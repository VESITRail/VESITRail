import { describe, it, expect } from "vitest";
import { generateEmailTemplate } from "@/lib/notifications/email-templates";
import { getNotificationScenario, type NotificationScenario } from "@/lib/notifications/scenarios";

describe("Email Templates (src/lib/notifications/email-templates.ts)", () => {
	const studentApproval = getNotificationScenario("student_approval")!;
	const concessionApproval = getNotificationScenario("concession_approval")!;
	const addressApproval = getNotificationScenario("address_change_approval")!;
	const concessionRejection = getNotificationScenario("concession_rejection")!;
	const addressRejection = getNotificationScenario("address_change_rejection")!;

	it("generates student approval email template correctly", () => {
		const result = generateEmailTemplate(studentApproval, {
			userName: "Jay Kerkar"
		});

		expect(result.subject).toBe("Your VESITRail Account Has Been Approved!");
		expect(result.html).toContain("Hello Jay Kerkar!");
		expect(result.html).toContain("Welcome to VESITRail!");
		expect(result.html).toContain("Access Dashboard");
		expect(result.html).toContain("Approved");
	});

	it("includes shortId and concessionType in info box for concession approval", () => {
		const result = generateEmailTemplate(concessionApproval, {
			shortId: 42,
			userName: "Jay Kerkar",
			concessionType: "First Class"
		});

		expect(result.subject).toBe("Your Concession Application Has Been Approved!");
		expect(result.html).toContain("Application ID");
		expect(result.html).toContain("#42");
		expect(result.html).toContain("Concession Type");
		expect(result.html).toContain("First Class");
	});

	it("includes applicationId fallback when shortId is not provided", () => {
		const result = generateEmailTemplate(concessionApproval, {
			userName: "Jay Kerkar",
			applicationId: "app-uuid-999"
		});

		expect(result.html).toContain("Application ID");
		expect(result.html).toContain("app-uuid-999");
	});

	it("handles rejection scenario with rejection reason correctly", () => {
		const result = generateEmailTemplate(concessionRejection, {
			userName: "Jay Kerkar",
			rejectionReason: "ID card image is blurry"
		});

		expect(result.subject).toBe("Concession Application Update");
		expect(result.html).toContain("Action Required");
		expect(result.html).toContain("Rejection Reason:");
		expect(result.html).toContain("ID card image is blurry");
		expect(result.html).toContain("Review Application");
	});

	it("appends journey update details for address change approval", () => {
		const result = generateEmailTemplate(addressApproval, {
			toStation: "Chembur",
			fromStation: "Kurla",
			userName: "Jay Kerkar"
		});

		expect(result.subject).toBe("Address Change Request Approved");
		expect(result.html).toContain("Your journey details have been updated from Kurla to Chembur.");
		expect(result.html).toContain("Previous Station");
		expect(result.html).toContain("Kurla");
		expect(result.html).toContain("New Station");
		expect(result.html).toContain("Chembur");
	});

	it("renders requested and current station in address change rejection", () => {
		const result = generateEmailTemplate(addressRejection, {
			toStation: "Chembur",
			fromStation: "Kurla",
			userName: "Jay Kerkar",
			rejectionReason: "Address proof mismatch"
		});

		expect(result.subject).toBe("Address Change Request Requires Review");
		expect(result.html).toContain("Current Station");
		expect(result.html).toContain("Kurla");
		expect(result.html).toContain("Requested Station");
		expect(result.html).toContain("Chembur");
		expect(result.html).toContain("Address proof mismatch");
	});

	it("renders template without cta button when cta is omitted", () => {
		const scenarioWithoutCta: NotificationScenario = {
			...studentApproval,
			email: {
				subject: "Notice",
				heading: "Informational Notice",
				description: "Simple notification without action button."
			}
		};

		const result = generateEmailTemplate(scenarioWithoutCta, {
			userName: "Jay Kerkar"
		});

		expect(result.subject).toBe("Notice");
		expect(result.html).toContain("Informational Notice");
		expect(result.html).not.toContain('class="mobile-cta-padding"');
	});

	it("renders template without info box when no info items exist", () => {
		const result = generateEmailTemplate(studentApproval, {
			userName: "Jay Kerkar"
		});

		expect(result.html).not.toContain('class="mobile-info-box"');
	});
});
