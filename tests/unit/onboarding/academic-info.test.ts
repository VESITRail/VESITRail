import { describe, it, expect } from "vitest";
import AcademicInfoSchema from "@/lib/validations/onboarding/academic-info";

describe("AcademicInfoSchema", () => {
	const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
	const validUUID2 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
	const validUUID3 = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

	const baseValidInput = {
		year: validUUID1,
		class: validUUID2,
		branch: validUUID3
	};

	it("accepts valid input with proper UUIDs", () => {
		const res = AcademicInfoSchema.safeParse(baseValidInput);
		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data).toEqual(baseValidInput);
		}
	});

	it("rejects non-UUID year", () => {
		const res = AcademicInfoSchema.safeParse({ ...baseValidInput, year: "not-a-uuid" });
		expect(res.success).toBe(false);
	});

	it("rejects empty string year", () => {
		const res = AcademicInfoSchema.safeParse({ ...baseValidInput, year: "" });
		expect(res.success).toBe(false);
	});

	it("rejects non-UUID class", () => {
		const res = AcademicInfoSchema.safeParse({ ...baseValidInput, class: "invalid-uuid" });
		expect(res.success).toBe(false);
	});

	it("rejects non-UUID branch", () => {
		const res = AcademicInfoSchema.safeParse({ ...baseValidInput, branch: "12345" });
		expect(res.success).toBe(false);
	});

	it("rejects when year is missing", () => {
		const { year: _, ...rest } = baseValidInput;
		const res = AcademicInfoSchema.safeParse(rest);
		expect(res.success).toBe(false);
	});

	it("rejects when class is missing", () => {
		const { class: _, ...rest } = baseValidInput;
		const res = AcademicInfoSchema.safeParse(rest);
		expect(res.success).toBe(false);
	});

	it("rejects when branch is missing", () => {
		const { branch: _, ...rest } = baseValidInput;
		const res = AcademicInfoSchema.safeParse(rest);
		expect(res.success).toBe(false);
	});
});
