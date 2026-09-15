import { describe, it, expect } from "vitest";
import { OnboardingSchema } from "@/lib/validations/onboarding";

describe("OnboardingSchema", () => {
	const getDobForAge = (age: number): string => {
		const now = new Date();
		const d = new Date(now.getFullYear() - age, now.getMonth(), now.getDate());
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
	const validUUID2 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
	const validUUID3 = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

	const baseValidOnboarding = {
		firstName: "Jay",
		lastName: "Kerkar",
		gender: "Male" as const,
		middleName: "Balkrishna",
		mobileNumber: "9876543210",
		dateOfBirth: getDobForAge(20),
		address: "Hashu Adwani Memorial Complex, Collector Colony, Chembur, Mumbai, Maharashtra 400074",

		year: validUUID1,
		class: validUUID2,
		branch: validUUID3,

		station: validUUID1,
		preferredConcessionClass: validUUID2,
		preferredConcessionPeriod: validUUID3,

		verificationDocUrl: "https://example.com/id-card.pdf"
	};

	it("accepts a fully valid composite onboarding payload", () => {
		const res = OnboardingSchema.safeParse(baseValidOnboarding);
		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data.firstName).toBe("Jay");
			expect(res.data.year).toBe(validUUID1);
			expect(res.data.station).toBe(validUUID1);
			expect(res.data.verificationDocUrl).toBe("https://example.com/id-card.pdf");
		}
	});

	it("rejects when firstName fails (PersonalInfo validation)", () => {
		const res = OnboardingSchema.safeParse({ ...baseValidOnboarding, firstName: "" });
		expect(res.success).toBe(false);
	});

	it("rejects when year fails (AcademicInfo validation)", () => {
		const res = OnboardingSchema.safeParse({ ...baseValidOnboarding, year: "non-uuid" });
		expect(res.success).toBe(false);
	});

	it("rejects when station is missing (TravelInfo validation)", () => {
		const { station: _, ...rest } = baseValidOnboarding;
		const res = OnboardingSchema.safeParse(rest);
		expect(res.success).toBe(false);
	});

	it("rejects when verificationDocUrl is invalid (Document validation)", () => {
		const res = OnboardingSchema.safeParse({
			...baseValidOnboarding,
			verificationDocUrl: "not-a-url"
		});
		expect(res.success).toBe(false);
	});
});
