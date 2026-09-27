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

	it("omits info box when concession approval has no matching info fields", () => {
		const result = generateEmailTemplate(concessionApproval, {
			userName: "Jay Kerkar"
		});

		expect(result.html).not.toContain('class="mobile-info-box"');
	});

	it("omits info box when address change approval has neither fromStation nor toStation", () => {
		const result = generateEmailTemplate(addressApproval, {
			userName: "Jay Kerkar"
		});

		expect(result.html).not.toContain('class="mobile-info-box"');
		expect(result.html).not.toContain("Your journey details have been updated");
	});

	it("renders single station info item when only one station is provided in address change", () => {
		const fromOnly = generateEmailTemplate(addressApproval, {
			userName: "Jay Kerkar",
			fromStation: "Kurla"
		});

		expect(fromOnly.html).toContain("Previous Station");
		expect(fromOnly.html).toContain("Kurla");
		expect(fromOnly.html).not.toContain("New Station");
		expect(fromOnly.html).not.toContain("Your journey details have been updated");

		const toOnly = generateEmailTemplate(addressApproval, {
			userName: "Jay Kerkar",
			toStation: "Chembur"
		});

		expect(toOnly.html).not.toContain("Previous Station");
		expect(toOnly.html).toContain("New Station");
		expect(toOnly.html).toContain("Chembur");
		expect(toOnly.html).not.toContain("Your journey details have been updated");
	});

	it("renders rejection template without rejection reason box when reason is undefined", () => {
		const result = generateEmailTemplate(concessionRejection, {
			userName: "Jay Kerkar"
		});

		expect(result.html).not.toContain("Rejection Reason:");
		expect(result.html).not.toContain("Reason: undefined");
	});

	it("handles unused optional parameters in params without breaking", () => {
		const result = generateEmailTemplate(studentApproval, {
			shortId: 101,
			submissionCount: 3,
			studentId: "stu_123",
			userName: "Jay Kerkar",
			additionalInfo: "Extra notes"
		});

		expect(result.html).toContain("#101");
		expect(result.html).toContain("Hello Jay Kerkar!");
	});

	it("handles extremely long string values in parameters without crashing", () => {
		const longName = "A".repeat(1000);
		const longReason = "B".repeat(2000);
		const longAppId = "C".repeat(500);
		const result = generateEmailTemplate(concessionRejection, {
			userName: longName,
			applicationId: longAppId,
			rejectionReason: longReason
		});

		expect(result.html).toContain(longName);
		expect(result.html).toContain(longReason);
		expect(result.html).toContain(longAppId);
		expect(result.html).toContain("word-break: break-word");
	});

	it("interpolates raw HTML-special characters in parameters", () => {
		const xssPayload = '<script>alert("xss")</script>';
		const specialReason = "Reason with & < > \" ' chars";
		const result = generateEmailTemplate(concessionRejection, {
			userName: xssPayload,
			rejectionReason: specialReason
		});

		expect(result.html).toContain(xssPayload);
		expect(result.html).toContain(specialReason);
	});

	it("handles malformed scenario with unknown type and category gracefully", () => {
		const malformedScenario = {
			name: "Custom",
			id: "custom_scenario",
			type: "other" as unknown as "approval",
			category: "custom" as unknown as "student",
			push: { title: "Push", body: "Push body" },
			inApp: { title: "InApp", body: "InApp body" },
			email: {
				subject: "Custom Subject",
				heading: "Custom Heading",
				description: "Custom Description"
			}
		};

		const result = generateEmailTemplate(malformedScenario, {
			shortId: 55,
			userName: "Jay Kerkar"
		});

		expect(result.subject).toBe("Custom Subject");
		expect(result.html).toContain("Action Required");
		expect(result.html).toContain("⚠️");
		expect(result.html).toContain("#55");
	});

	it("handles scenario with empty string email fields", () => {
		const emptyScenario = {
			...studentApproval,
			email: {
				subject: "",
				heading: "",
				description: ""
			}
		};

		const result = generateEmailTemplate(emptyScenario, {
			userName: "Jay Kerkar"
		});

		expect(result.subject).toBe("");
		expect(result.html).toContain("<title></title>");
	});
});
