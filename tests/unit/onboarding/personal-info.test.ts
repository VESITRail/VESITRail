import { describe, it, expect } from "vitest";
import PersonalInfoSchema, { MobileNumberSchema } from "@/lib/validations/onboarding/personal-info";

describe("PersonalInfoSchema", () => {
	const getDobForAge = (age: number, monthOffset = 0, dayOffset = 0): string => {
		const now = new Date();
		const d = new Date(now.getFullYear() - age, now.getMonth() + monthOffset, now.getDate() + dayOffset);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	const baseValidInput = {
		firstName: "Jay",
		lastName: "Kerkar",
		gender: "Male" as const,
		middleName: "Balkrishna",
		mobileNumber: "9876543210",
		dateOfBirth: getDobForAge(20),
		address: "Hashu Adwani Memorial Complex, Collector Colony, Chembur, Mumbai, Maharashtra 400074"
	};

	it("accepts a completely valid input", () => {
		const result = PersonalInfoSchema.safeParse(baseValidInput);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.firstName).toBe("Jay");
			expect(result.data.middleName).toBe("Balkrishna");
			expect(result.data.lastName).toBe("Kerkar");
			expect(result.data.mobileNumber).toBe("9876543210");
			expect(result.data.gender).toBe("Male");
			expect(result.data.address).toBe(
				"Hashu Adwani Memorial Complex, Collector Colony, Chembur, Mumbai, Maharashtra 400074"
			);
		}
	});

	describe("firstName", () => {
		it("rejects empty string", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, firstName: "" });
			expect(res.success).toBe(false);
		});

		it("rejects single character", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, firstName: "A" });
			expect(res.success).toBe(false);
		});

		it("rejects string longer than 50 characters", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, firstName: "A".repeat(51) });
			expect(res.success).toBe(false);
		});

		it("rejects numbers in firstName", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, firstName: "Jay1" });
			expect(res.success).toBe(false);
		});

		it("rejects special characters in firstName", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, firstName: "Jay@" });
			expect(res.success).toBe(false);
		});

		it("accepts letters with spaces", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, firstName: "Jay Balkrishna" });
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.firstName).toBe("Jay Balkrishna");
			}
		});

		it("trims surrounding whitespace", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, firstName: "  Jay  " });
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.firstName).toBe("Jay");
			}
		});

		it("rejects whitespace-only firstName", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, firstName: "   " });
			expect(res.success).toBe(false);
		});
	});

	describe("middleName", () => {
		it("accepts empty string", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, middleName: "" });
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.middleName).toBe("");
			}
		});

		it("accepts undefined", () => {
			const { middleName: _, ...withoutMiddle } = baseValidInput;
			const res = PersonalInfoSchema.safeParse(withoutMiddle);
			expect(res.success).toBe(true);
		});

		it("rejects single character", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, middleName: "A" });
			expect(res.success).toBe(false);
		});

		it("rejects longer than 50 characters", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, middleName: "A".repeat(51) });
			expect(res.success).toBe(false);
		});

		it("rejects numbers in middleName", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, middleName: "Middle1" });
			expect(res.success).toBe(false);
		});

		it("trims whitespace", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, middleName: "  Balkrishna  " });
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.middleName).toBe("Balkrishna");
			}
		});
	});

	describe("lastName", () => {
		it("accepts empty string", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, lastName: "" });
			expect(res.success).toBe(true);
		});

		it("accepts undefined", () => {
			const { lastName: _, ...withoutLast } = baseValidInput;
			const res = PersonalInfoSchema.safeParse(withoutLast);
			expect(res.success).toBe(true);
		});

		it("rejects single character", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, lastName: "K" });
			expect(res.success).toBe(false);
		});

		it("rejects longer than 50 characters", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, lastName: "K".repeat(51) });
			expect(res.success).toBe(false);
		});

		it("rejects numbers", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, lastName: "Last1" });
			expect(res.success).toBe(false);
		});

		it("trims whitespace", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, lastName: "  Kerkar  " });
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.lastName).toBe("Kerkar");
			}
		});
	});

	describe("mobileNumber", () => {
		it("rejects empty string", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, mobileNumber: "" });
			expect(res.success).toBe(false);
		});

		it("rejects 9-digit number", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, mobileNumber: "987654321" });
			expect(res.success).toBe(false);
		});

		it("rejects 11-digit number", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, mobileNumber: "98765432100" });
			expect(res.success).toBe(false);
		});

		it("rejects number starting with digits under 6", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, mobileNumber: "5123456789" });
			expect(res.success).toBe(false);
		});

		it("rejects non-digits", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, mobileNumber: "98765abcde" });
			expect(res.success).toBe(false);
		});

		it("accepts valid Indian number starting with 6", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, mobileNumber: "6000000000" });
			expect(res.success).toBe(true);
		});

		it("accepts valid Indian number starting with 9", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, mobileNumber: "9876543210" });
			expect(res.success).toBe(true);
		});

		it("trims whitespace around mobile number", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, mobileNumber: "  9876543210  " });
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.mobileNumber).toBe("9876543210");
			}
		});
	});

	describe("gender", () => {
		it("accepts Male", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, gender: "Male" });
			expect(res.success).toBe(true);
		});

		it("accepts Female", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, gender: "Female" });
			expect(res.success).toBe(true);
		});

		it("rejects lowercase male", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, gender: "male" });
			expect(res.success).toBe(false);
		});

		it("rejects other gender options", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, gender: "Other" });
			expect(res.success).toBe(false);
		});
	});

	describe("address", () => {
		it("rejects empty string", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, address: "" });
			expect(res.success).toBe(false);
		});

		it("rejects fewer than 10 characters", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, address: "Short Adr" });
			expect(res.success).toBe(false);
		});

		it("rejects longer than 500 characters", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, address: "A".repeat(501) });
			expect(res.success).toBe(false);
		});

		it("accepts exactly 10 characters", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, address: "1234567890" });
			expect(res.success).toBe(true);
		});

		it("rejects address that becomes shorter than 10 characters after trim", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, address: "     Short     " });
			expect(res.success).toBe(false);
		});

		it("accepts and trims valid address", () => {
			const res = PersonalInfoSchema.safeParse({
				...baseValidInput,
				address: "  Hashu Adwani Memorial Complex, Collector Colony, Chembur, Mumbai, Maharashtra 400074  "
			});
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.address).toBe(
					"Hashu Adwani Memorial Complex, Collector Colony, Chembur, Mumbai, Maharashtra 400074"
				);
			}
		});
	});

	describe("dateOfBirth", () => {
		it("rejects empty string", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, dateOfBirth: "" });
			expect(res.success).toBe(false);
		});

		it("rejects invalid date string", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, dateOfBirth: "not-a-date" });
			expect(res.success).toBe(false);
		});

		it("rejects under 17 years old (age 16)", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, dateOfBirth: getDobForAge(16) });
			expect(res.success).toBe(false);
		});

		it("accepts age 17 boundary", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, dateOfBirth: getDobForAge(17) });
			expect(res.success).toBe(true);
		});

		it("accepts age 25 boundary", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, dateOfBirth: getDobForAge(25) });
			expect(res.success).toBe(true);
		});

		it("rejects over 25 years old (age 26)", () => {
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, dateOfBirth: getDobForAge(26) });
			expect(res.success).toBe(false);
		});

		it("rejects future date", () => {
			const futureDate = getDobForAge(-1);
			const res = PersonalInfoSchema.safeParse({ ...baseValidInput, dateOfBirth: futureDate });
			expect(res.success).toBe(false);
		});

		it("transforms parsed date to yyyy-MM-dd format", () => {
			const res = PersonalInfoSchema.safeParse(baseValidInput);
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			}
		});
	});

	describe("MobileNumberSchema", () => {
		it("accepts valid mobile number object", () => {
			const res = MobileNumberSchema.safeParse({ mobileNumber: "9876543210" });
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data).toEqual({ mobileNumber: "9876543210" });
			}
		});

		it("rejects empty mobile number", () => {
			const res = MobileNumberSchema.safeParse({ mobileNumber: "" });
			expect(res.success).toBe(false);
		});
	});
});
