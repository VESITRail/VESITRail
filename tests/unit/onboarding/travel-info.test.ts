import { describe, it, expect } from "vitest";
import TravelInfoSchema from "@/lib/validations/onboarding/travel-info";

describe("TravelInfoSchema", () => {
	const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
	const validUUID2 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
	const validUUID3 = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

	const baseValidInput = {
		station: validUUID1,
		preferredConcessionClass: validUUID2,
		preferredConcessionPeriod: validUUID3
	};

	it("accepts valid travel info input with UUIDs", () => {
		const res = TravelInfoSchema.safeParse(baseValidInput);
		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data).toEqual(baseValidInput);
		}
	});

	it("rejects non-UUID station", () => {
		const res = TravelInfoSchema.safeParse({ ...baseValidInput, station: "Kurla" });
		expect(res.success).toBe(false);
	});

	it("rejects non-UUID preferredConcessionClass", () => {
		const res = TravelInfoSchema.safeParse({ ...baseValidInput, preferredConcessionClass: "FirstClass" });
		expect(res.success).toBe(false);
	});

	it("rejects non-UUID preferredConcessionPeriod", () => {
		const res = TravelInfoSchema.safeParse({ ...baseValidInput, preferredConcessionPeriod: "Quarterly" });
		expect(res.success).toBe(false);
	});

	it("rejects missing station", () => {
		const { station: _, ...rest } = baseValidInput;
		const res = TravelInfoSchema.safeParse(rest);
		expect(res.success).toBe(false);
	});

	it("rejects missing preferredConcessionClass", () => {
		const { preferredConcessionClass: _, ...rest } = baseValidInput;
		const res = TravelInfoSchema.safeParse(rest);
		expect(res.success).toBe(false);
	});

	it("rejects missing preferredConcessionPeriod", () => {
		const { preferredConcessionPeriod: _, ...rest } = baseValidInput;
		const res = TravelInfoSchema.safeParse(rest);
		expect(res.success).toBe(false);
	});
});
