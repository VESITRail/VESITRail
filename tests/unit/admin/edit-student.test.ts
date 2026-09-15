import { describe, it, expect } from "vitest";
import { EditStudentSchema, UpdateStudentActionSchema } from "@/lib/validations/admin/edit-student";

describe("EditStudentSchema & UpdateStudentActionSchema", () => {
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

	const baseValidEditStudent = {
		year: validUUID1,
		firstName: "Jay",
		class: validUUID2,
		branch: validUUID3,
		lastName: "Kerkar",
		gender: "Male" as const,
		middleName: "Balkrishna",
		mobileNumber: "9876543210",
		dateOfBirth: getDobForAge(20)
	};

	describe("EditStudentSchema", () => {
		it("accepts valid input with all fields", () => {
			const res = EditStudentSchema.safeParse(baseValidEditStudent);
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.firstName).toBe("Jay");
				expect(res.data.mobileNumber).toBe("9876543210");
			}
		});

		it("does not require address field (address is omitted)", () => {
			const res = EditStudentSchema.safeParse(baseValidEditStudent);
			expect(res.success).toBe(true);
			const withAddress = { ...baseValidEditStudent, address: "Some long address here" };
			const resWithAddress = EditStudentSchema.safeParse(withAddress);
			expect(resWithAddress.success).toBe(true);
			if (resWithAddress.success) {
				expect((resWithAddress.data as Record<string, unknown>).address).toBeUndefined();
			}
		});

		it("allows empty string mobileNumber", () => {
			const res = EditStudentSchema.safeParse({ ...baseValidEditStudent, mobileNumber: "" });
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.mobileNumber).toBe("");
			}
		});

		it("allows null mobileNumber", () => {
			const res = EditStudentSchema.safeParse({ ...baseValidEditStudent, mobileNumber: null });
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.mobileNumber).toBeNull();
			}
		});

		it("allows undefined mobileNumber", () => {
			const { mobileNumber: _, ...withoutMobile } = baseValidEditStudent;
			const res = EditStudentSchema.safeParse(withoutMobile);
			expect(res.success).toBe(true);
		});

		it("rejects 9-digit mobileNumber", () => {
			const res = EditStudentSchema.safeParse({ ...baseValidEditStudent, mobileNumber: "987654321" });
			expect(res.success).toBe(false);
		});

		it("rejects mobileNumber starting with invalid digit (e.g. 5)", () => {
			const res = EditStudentSchema.safeParse({ ...baseValidEditStudent, mobileNumber: "5123456789" });
			expect(res.success).toBe(false);
		});

		it("rejects non-digit mobileNumber", () => {
			const res = EditStudentSchema.safeParse({ ...baseValidEditStudent, mobileNumber: "98765abcde" });
			expect(res.success).toBe(false);
		});

		it("requires valid academic UUIDs", () => {
			const res = EditStudentSchema.safeParse({ ...baseValidEditStudent, year: "bad-uuid" });
			expect(res.success).toBe(false);
		});
	});

	describe("UpdateStudentActionSchema", () => {
		it("accepts valid input with studentId", () => {
			const res = UpdateStudentActionSchema.safeParse({
				...baseValidEditStudent,
				studentId: "student-123"
			});
			expect(res.success).toBe(true);
			if (res.success) {
				expect(res.data.studentId).toBe("student-123");
			}
		});

		it("rejects empty studentId", () => {
			const res = UpdateStudentActionSchema.safeParse({
				...baseValidEditStudent,
				studentId: ""
			});
			expect(res.success).toBe(false);
		});

		it("rejects missing studentId", () => {
			const res = UpdateStudentActionSchema.safeParse(baseValidEditStudent);
			expect(res.success).toBe(false);
		});
	});
});
