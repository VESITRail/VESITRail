import {
	cn,
	toTitleCase,
	normalizeDob,
	calcAgeFromDob,
	sortByRomanKey,
	formatFieldName,
	capitalizeWords,
	getUserInitials,
	sortByYearOrder,
	formatSlipNumber,
	isValidErrorCode,
	formatDateOfBirth,
	formatDobForInput,
	calculatePassExpiry,
	calculateBookletStatus,
	calculateSerialEndNumber,
	calculateConcessionValidity
} from "@/lib/utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Utility Functions (src/lib/utils.ts)", () => {
	describe("cn", () => {
		it("merges string class names", () => {
			expect(cn("foo", "bar")).toBe("foo bar");
		});

		it("handles falsy, null, and undefined values", () => {
			expect(cn("foo", null, undefined, false, "", "bar")).toBe("foo bar");
		});

		it("handles object syntax for conditional classes", () => {
			expect(cn({ active: true, disabled: false })).toBe("active");
		});

		it("resolves Tailwind conflicts favoring later classes", () => {
			expect(cn("p-4", "p-6")).toBe("p-6");
			expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
		});
	});

	describe("normalizeDob", () => {
		it("returns null for null, undefined, or empty string", () => {
			expect(normalizeDob(null)).toBeNull();
			expect(normalizeDob(undefined)).toBeNull();
			expect(normalizeDob("")).toBeNull();
		});

		it("returns null for invalid date string", () => {
			expect(normalizeDob("invalid-date")).toBeNull();
		});

		it("parses yyyy-MM-dd string correctly", () => {
			const res = normalizeDob("2003-05-20");
			expect(res).not.toBeNull();
			expect(res?.getFullYear()).toBe(2003);
			expect(res?.getMonth()).toBe(4);
			expect(res?.getDate()).toBe(20);
		});

		it("handles Date object input", () => {
			const d = new Date(2001, 10, 15);
			const res = normalizeDob(d);
			expect(res).not.toBeNull();
		});

		it("handles UTC timezone offsets >= 12 hours correctly (IST shift)", () => {
			const iso = "2000-06-15T18:30:00.000Z";
			const res = normalizeDob(iso);
			expect(res).not.toBeNull();
			expect(res?.getDate()).toBe(16);
		});

		it("handles UTC timezone offsets < 12 hours correctly", () => {
			const iso = "2000-06-15T04:30:00.000Z";
			const res = normalizeDob(iso);
			expect(res).not.toBeNull();
			expect(res?.getDate()).toBe(15);
		});
	});

	describe("formatDateOfBirth & formatDobForInput", () => {
		it("formatDateOfBirth returns empty string for null input", () => {
			expect(formatDateOfBirth(null)).toBe("");
			expect(formatDateOfBirth(undefined)).toBe("");
		});

		it("formatDateOfBirth formats date in dd/MM/yyyy by default", () => {
			expect(formatDateOfBirth("2000-06-15")).toBe("15/06/2000");
		});

		it("formatDateOfBirth respects custom format string", () => {
			expect(formatDateOfBirth("2000-06-15", "yyyy-MM-dd")).toBe("2000-06-15");
		});

		it("formatDobForInput returns yyyy-MM-dd string", () => {
			expect(formatDobForInput("2000-06-15")).toBe("2000-06-15");
			expect(formatDobForInput(null)).toBe("");
		});
	});

	describe("calcAgeFromDob", () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2024, 5, 15));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("returns 0 years and 0 months for null input", () => {
			expect(calcAgeFromDob(null)).toEqual({ years: 0, months: 0 });
		});

		it("calculates exact age when birthday has passed this year", () => {
			const age = calcAgeFromDob("2004-03-10");
			expect(age.years).toBe(20);
			expect(age.months).toBe(3);
		});

		it("calculates exact age when birthday has not yet passed this year", () => {
			const age = calcAgeFromDob("2004-10-15");
			expect(age.years).toBe(19);
			expect(age.months).toBe(8);
		});
	});

	describe("formatFieldName", () => {
		it("converts camelCase to separated lowercase words", () => {
			expect(formatFieldName("firstName")).toBe("first name");
			expect(formatFieldName("dateOfBirth")).toBe("date of birth");
			expect(formatFieldName("mobileNumber")).toBe("mobile number");
		});

		it("leaves single lowercase word untouched", () => {
			expect(formatFieldName("id")).toBe("id");
			expect(formatFieldName("name")).toBe("name");
		});
	});

	describe("toTitleCase", () => {
		it("returns empty string for undefined or empty string", () => {
			expect(toTitleCase(undefined)).toBe("");
			expect(toTitleCase("")).toBe("");
		});

		it("capitalizes words separated by space", () => {
			expect(toTitleCase("jay kerkar")).toBe("Jay Kerkar");
			expect(toTitleCase("HELLO WORLD")).toBe("Hello World");
		});

		it("splits on hyphens as well as whitespace", () => {
			expect(toTitleCase("jay-balkrishna-kerkar")).toBe("Jay Balkrishna Kerkar");
		});
	});

	describe("capitalizeWords", () => {
		it("capitalizes space-separated words", () => {
			expect(capitalizeWords("hello world")).toBe("Hello World");
			expect(capitalizeWords("a b c")).toBe("A B C");
		});
	});

	describe("getUserInitials", () => {
		it("returns default initials when name is undefined", () => {
			expect(getUserInitials("Admin", undefined)).toBe("AD");
			expect(getUserInitials("Student", undefined)).toBe("ST");
		});

		it("extracts first two initials from multi-word name", () => {
			expect(getUserInitials("Admin", "Jay Kerkar")).toBe("JK");
			expect(getUserInitials("Student", "John Robert Doe")).toBe("JR");
		});

		it("handles single-word name", () => {
			expect(getUserInitials("Student", "Jay")).toBe("J");
		});
	});

	describe("calculateSerialEndNumber", () => {
		it("calculates numeric range preserving leading zeros", () => {
			expect(calculateSerialEndNumber("0807550", 50)).toBe("0807599");
		});

		it("handles alphanumeric prefix", () => {
			expect(calculateSerialEndNumber("A0807550", 10)).toBe("A0807559");
			expect(calculateSerialEndNumber("BK001", 5)).toBe("BK005");
		});

		it("handles single page booklet", () => {
			expect(calculateSerialEndNumber("100", 1)).toBe("100");
		});

		it("throws for invalid non-numeric format", () => {
			expect(() => calculateSerialEndNumber("INVALID", 50)).toThrow("Invalid serial number format");
			expect(() => calculateSerialEndNumber("", 50)).toThrow("Invalid serial number format");
		});
	});

	describe("calculatePassExpiry", () => {
		it("calculates standard pass expiry subtracting 1 day", () => {
			const issueDate = new Date(2024, 0, 15);
			const expiry = calculatePassExpiry(issueDate, 3);
			expect(expiry.getFullYear()).toBe(2024);
			expect(expiry.getMonth()).toBe(3);
			expect(expiry.getDate()).toBe(14);
		});

		it("handles month overflow to end of prior month in leap year", () => {
			const issueDate = new Date(2024, 0, 31);
			const expiry = calculatePassExpiry(issueDate, 1);
			expect(expiry.getFullYear()).toBe(2024);
			expect(expiry.getMonth()).toBe(1);
			expect(expiry.getDate()).toBe(29);
		});

		it("handles month overflow to end of prior month in non-leap year", () => {
			const issueDate = new Date(2023, 0, 31);
			const expiry = calculatePassExpiry(issueDate, 1);
			expect(expiry.getFullYear()).toBe(2023);
			expect(expiry.getMonth()).toBe(1);
			expect(expiry.getDate()).toBe(28);
		});
	});

	describe("calculateConcessionValidity", () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2024, 2, 1));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("returns valid and positive daysRemaining when not expired", () => {
			const approvedAt = new Date(2024, 1, 15);
			const validity = calculateConcessionValidity(approvedAt, 3);
			expect(validity.isValid).toBe(true);
			expect(validity.daysRemaining).toBeGreaterThan(0);
		});

		it("returns invalid and 0 daysRemaining when expired", () => {
			const approvedAt = new Date(2023, 5, 1);
			const validity = calculateConcessionValidity(approvedAt, 3);
			expect(validity.isValid).toBe(false);
			expect(validity.daysRemaining).toBe(0);
		});
	});

	describe("sortByRomanKey", () => {
		it("sorts array of objects by roman numeral values", () => {
			const items = [{ code: "III" }, { code: "I" }, { code: "X" }, { code: "IV" }, { code: "II" }];
			const sorted = sortByRomanKey(items, "code");
			expect(sorted.map((i) => i.code)).toEqual(["I", "II", "III", "IV", "X"]);
		});
	});

	describe("sortByYearOrder", () => {
		it("sorts college year codes (FE, SE, TE, BE) properly", () => {
			const items = [{ code: "BE" }, { code: "FE" }, { code: "TE" }, { code: "SE" }];
			const sorted = sortByYearOrder(items);
			expect(sorted.map((i) => i.code)).toEqual(["FE", "SE", "TE", "BE"]);
		});

		it("handles FY, SY, TY, LY codes", () => {
			const items = [{ code: "LY" }, { code: "FY" }, { code: "TY" }, { code: "SY" }];
			const sorted = sortByYearOrder(items);
			expect(sorted.map((i) => i.code)).toEqual(["FY", "SY", "TY", "LY"]);
		});

		it("handles numeric codes (1, 2, 3, 4)", () => {
			const items = [{ code: "4" }, { code: "1" }, { code: "3" }, { code: "2" }];
			const sorted = sortByYearOrder(items);
			expect(sorted.map((i) => i.code)).toEqual(["1", "2", "3", "4"]);
		});

		it("places unknown codes at the end", () => {
			const items = [{ code: "UNKNOWN" }, { code: "FE" }];
			const sorted = sortByYearOrder(items);
			expect(sorted.map((i) => i.code)).toEqual(["FE", "UNKNOWN"]);
		});
	});

	describe("calculateBookletStatus", () => {
		it("returns Available when application count is 0", () => {
			expect(calculateBookletStatus(0, 50, false)).toBe("Available");
		});

		it("returns InUse when applications are between 1 and totalPages - 1", () => {
			expect(calculateBookletStatus(1, 50, false)).toBe("InUse");
			expect(calculateBookletStatus(49, 50, false)).toBe("InUse");
		});

		it("returns Exhausted when applicationCount >= totalPages", () => {
			expect(calculateBookletStatus(50, 50, false)).toBe("Exhausted");
			expect(calculateBookletStatus(55, 50, false)).toBe("Exhausted");
		});

		it("returns Exhausted when isManuallyExhausted is true regardless of count", () => {
			expect(calculateBookletStatus(0, 50, true)).toBe("Exhausted");
		});

		it("returns Exhausted when maxOffset >= totalPages - 1", () => {
			expect(calculateBookletStatus(10, 50, false, 49)).toBe("Exhausted");
		});

		it("returns InUse when maxOffset < totalPages - 1 and applicationCount > 0", () => {
			expect(calculateBookletStatus(10, 50, false, 48)).toBe("InUse");
		});
	});

	describe("formatSlipNumber", () => {
		it("converts 0-based offset to 1-based slip number", () => {
			expect(formatSlipNumber(0)).toBe("1");
			expect(formatSlipNumber(49)).toBe("50");
		});
	});

	describe("isValidErrorCode", () => {
		it("identifies valid auth error code", () => {
			expect(isValidErrorCode("INVALID_EMAIL_DOMAIN")).toBe(true);
		});

		it("returns false for invalid code or empty string", () => {
			expect(isValidErrorCode("NON_EXISTENT")).toBe(false);
			expect(isValidErrorCode("")).toBe(false);
		});
	});
});
