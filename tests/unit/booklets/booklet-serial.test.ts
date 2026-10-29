import {
	getSlipRange,
	parseSerialNumber,
	formatSlipDisplay,
	slipInputToOffset,
	getBookletSerialNo,
	deriveCertificateNumber
} from "@/lib/booklet-serial";
import { describe, it, expect } from "vitest";

describe("Booklet Serial Helpers (src/lib/booklet-serial.ts)", () => {
	describe("parseSerialNumber", () => {
		it("parses a numeric-only serial", () => {
			expect(parseSerialNumber("0807550")).toEqual({ prefix: "", startNumber: 807550, digitLength: 7 });
		});

		it("parses a letter-prefixed serial", () => {
			expect(parseSerialNumber("A0807550")).toEqual({ prefix: "A", startNumber: 807550, digitLength: 7 });
			expect(parseSerialNumber("BK001")).toEqual({ prefix: "BK", startNumber: 1, digitLength: 3 });
		});

		it.each(["", "ABC", "12A", "   "])("returns null for serial without trailing digits: %j", (serial) => {
			expect(parseSerialNumber(serial)).toBeNull();
		});
	});

	describe("deriveCertificateNumber", () => {
		it.each([
			["0807550", 0, "0807550"],
			["0807550", 1, "0807551"],
			["0807550", 49, "0807599"],
			["A0807550", 3, "A0807553"],
			["BK001", 0, "BK001"],
			["0000001", 9, "0000010"],
			["999", 1, "1000"],
			["a0001", 2, "a0003"]
		])("derives certificate for serial %s at offset %i as %s", (serial, offset, expected) => {
			expect(deriveCertificateNumber(serial, offset)).toBe(expected);
		});

		it.each(["", "ABC"])("returns null when serial start %j has no trailing digits", (serial) => {
			expect(deriveCertificateNumber(serial, 5)).toBeNull();
		});
	});

	describe("getBookletSerialNo", () => {
		it.each([
			["0807501", 1],
			["0807525", 25],
			["0807550", 50],
			["0807551", 1],
			["0807600", 50],
			["A0807525", 25]
		])("maps certificate %s to Sr. No. %i", (certificateNo, expected) => {
			expect(getBookletSerialNo(certificateNo)).toBe(expected);
		});

		it.each(["Pending", "N/A", ""])("returns 0 for certificate %j without digits", (certificateNo) => {
			expect(getBookletSerialNo(certificateNo)).toBe(0);
		});
	});

	describe("formatSlipDisplay", () => {
		it.each([
			["0807501", 0, "01"],
			["0807501", 8, "09"],
			["0807501", 49, "50"],
			["0807550", 0, "50"],
			["0807550", 1, "51"],
			["0807550", 50, "100"],
			["0807550", 51, "01"],
			["0807551", 0, "51"],
			["0807551", 49, "100"],
			["0807500", 0, "100"],
			["0807500", 1, "1"],
			["A0807501", 0, "01"]
		])("formats slip for serial %s at offset %i as %s", (serial, offset, expected) => {
			expect(formatSlipDisplay(serial, offset)).toBe(expected);
		});

		it("treats a serial without digits as starting at zero", () => {
			expect(formatSlipDisplay("ABC", 5)).toBe("5");
		});
	});

	describe("getSlipRange", () => {
		it("returns padded range for a booklet starting in the lower half of a hundred", () => {
			expect(getSlipRange("0807501", 50)).toEqual({
				minSlip: "01",
				maxSlip: "50",
				maxInputLength: 2,
				placeholder: "Slip No.",
				rangeLabel: "01 to 50"
			});
		});

		it("returns range ending at 100 for a booklet starting in the upper half", () => {
			expect(getSlipRange("0807551", 50)).toEqual({
				minSlip: "51",
				maxSlip: "100",
				maxInputLength: 3,
				placeholder: "Slip No.",
				rangeLabel: "51 to 100"
			});
		});

		it("uses a minimum input length of 2 for single-page booklets", () => {
			expect(getSlipRange("0807500", 2).maxInputLength).toBe(3);
			expect(getSlipRange("0807502", 1)).toMatchObject({ minSlip: "02", maxSlip: "02", maxInputLength: 2 });
		});
	});

	describe("slipInputToOffset", () => {
		it.each([
			["01", 0],
			["1", 0],
			[" 5 ", 4],
			["50", 49]
		])("maps input %j to offset %i for booklet 0807501", (input, expected) => {
			expect(slipInputToOffset(input, "0807501", 50)).toBe(expected);
		});

		it.each([
			["51", 0],
			["100", 49],
			["0", 49],
			["00", 49]
		])("maps input %j to offset %i for booklet ending at a hundred", (input, expected) => {
			expect(slipInputToOffset(input, "0807551", 50)).toBe(expected);
		});

		it.each(["", "   ", "abc", "51", "0"])("returns null for invalid or out-of-range input %j", (input) => {
			expect(slipInputToOffset(input, "0807501", 50)).toBeNull();
		});

		it("treats a serial without digits as starting at zero", () => {
			expect(slipInputToOffset("5", "ABC", 10)).toBe(5);
		});
	});
});
