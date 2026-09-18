import { describe, it, expect } from "vitest";
import AddressChangeSchema from "@/lib/validations/student/change-address";

describe("AddressChangeSchema (src/lib/validations/student/change-address.ts)", () => {
	const validAddressChange = {
		city: "Mumbai",
		pincode: "400071",
		building: "Flat 402, Building 7",
		newStationId: "station-uuid-1234",
		area: "Sindhi Society, Chembur East",
		verificationDocUrl: "https://r2.vesitrail.internal/documents/address-proof.pdf"
	};

	it("accepts a completely valid address change payload", () => {
		const result = AddressChangeSchema.safeParse(validAddressChange);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.building).toBe("Flat 402, Building 7");
			expect(result.data.area).toBe("Sindhi Society, Chembur East");
			expect(result.data.city).toBe("Mumbai");
			expect(result.data.pincode).toBe("400071");
			expect(result.data.newStationId).toBe("station-uuid-1234");
			expect(result.data.verificationDocUrl).toBe("https://r2.vesitrail.internal/documents/address-proof.pdf");
		}
	});

	describe("verificationDocUrl", () => {
		it("rejects non-URL string", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				verificationDocUrl: "invalid-url-format"
			});
			expect(result.success).toBe(false);
		});

		it("rejects empty string", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				verificationDocUrl: ""
			});
			expect(result.success).toBe(false);
		});

		it("rejects missing property", () => {
			const { verificationDocUrl: _, ...rest } = validAddressChange;
			const result = AddressChangeSchema.safeParse(rest);
			expect(result.success).toBe(false);
		});
	});

	describe("newStationId", () => {
		it("rejects empty station id", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				newStationId: ""
			});
			expect(result.success).toBe(false);
		});

		it("rejects missing station id", () => {
			const { newStationId: _, ...rest } = validAddressChange;
			const result = AddressChangeSchema.safeParse(rest);
			expect(result.success).toBe(false);
		});
	});

	describe("building", () => {
		it("rejects empty string", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				building: ""
			});
			expect(result.success).toBe(false);
		});

		it("rejects whitespace-only string", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				building: "     "
			});
			expect(result.success).toBe(false);
		});

		it("rejects string exceeding 100 characters", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				building: "A".repeat(101)
			});
			expect(result.success).toBe(false);
		});

		it("trims surrounding whitespace", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				building: "   A Wing 101   "
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.building).toBe("A Wing 101");
			}
		});
	});

	describe("area", () => {
		it("rejects empty string", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				area: ""
			});
			expect(result.success).toBe(false);
		});

		it("rejects whitespace-only string", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				area: "     "
			});
			expect(result.success).toBe(false);
		});

		it("rejects string exceeding 100 characters", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				area: "B".repeat(101)
			});
			expect(result.success).toBe(false);
		});

		it("trims surrounding whitespace", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				area: "   Collector Colony   "
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.area).toBe("Collector Colony");
			}
		});
	});

	describe("city", () => {
		it("rejects empty string", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				city: ""
			});
			expect(result.success).toBe(false);
		});

		it("rejects whitespace-only string", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				city: "     "
			});
			expect(result.success).toBe(false);
		});

		it("rejects string exceeding 50 characters", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				city: "C".repeat(51)
			});
			expect(result.success).toBe(false);
		});

		it("trims surrounding whitespace", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				city: "   Mumbai   "
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.city).toBe("Mumbai");
			}
		});
	});

	describe("pincode", () => {
		it("rejects fewer than 6 digits", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				pincode: "40007"
			});
			expect(result.success).toBe(false);
		});

		it("rejects more than 6 digits", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				pincode: "4000711"
			});
			expect(result.success).toBe(false);
		});

		it("rejects non-numeric characters", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				pincode: "40007A"
			});
			expect(result.success).toBe(false);
		});

		it("rejects spaces within pincode", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				pincode: "400 71"
			});
			expect(result.success).toBe(false);
		});

		it("accepts exactly 6 digits", () => {
			const result = AddressChangeSchema.safeParse({
				...validAddressChange,
				pincode: "400071"
			});
			expect(result.success).toBe(true);
		});
	});
});
