import { z } from "zod";
import { normalizeDob, formatDobForInput, calcAgeFromDob } from "@/lib/utils";

const PersonalInfoSchema = z.object({
	firstName: z
		.string()
		.min(1, "First name is required")
		.min(2, "First name must be at least 2 characters")
		.max(50, "First name cannot exceed 50 characters")
		.regex(/^[a-zA-Z\s]+$/, "Only letters and spaces are allowed")
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, "First name cannot be empty after trimming"),

	middleName: z
		.string()
		.transform((val) => val.trim())
		.refine(
			(val) => val === "" || (val.length >= 2 && val.length <= 50),
			"Middle name must be between 2 and 50 characters"
		)
		.refine((val) => val === "" || /^[a-zA-Z\s]+$/.test(val), "Only letters and spaces are allowed")
		.optional()
		.or(z.literal("")),

	lastName: z
		.string()
		.transform((val) => val.trim())
		.refine(
			(val) => val === "" || (val.length >= 2 && val.length <= 50),
			"Last name must be between 2 and 50 characters"
		)
		.refine((val) => val === "" || /^[a-zA-Z\s]+$/.test(val), "Only letters and spaces are allowed")
		.optional()
		.or(z.literal("")),

	gender: z.enum(["Male", "Female"], {
		message: "Please select a valid gender"
	}),

	address: z
		.string()
		.min(1, "Address is required")
		.min(10, "Address must be at least 10 characters")
		.max(500, "Address cannot exceed 500 characters")
		.transform((val) => val.trim())
		.refine((val) => val.length >= 10, "Address must be at least 10 characters after trimming"),

	dateOfBirth: z
		.string()
		.min(1, "Date of birth is required")
		.refine((val) => {
			const date = normalizeDob(val);
			return date !== null;
		}, "Please enter a valid date")
		.refine((val) => {
			const birthDate = normalizeDob(val);
			if (!birthDate) return false;
			const { years } = calcAgeFromDob(birthDate);
			return years >= 17;
		}, "You must be at least 17 years old")
		.refine((val) => {
			const birthDate = normalizeDob(val);
			if (!birthDate) return false;
			const { years } = calcAgeFromDob(birthDate);
			return years <= 25;
		}, "Age cannot exceed 25 years")
		.refine((val) => {
			const birthDate = normalizeDob(val);
			if (!birthDate) return false;
			const today = new Date();
			today.setHours(23, 59, 59, 999);
			return birthDate <= today;
		}, "Date of birth cannot be in the future")
		.transform((val) => formatDobForInput(val))
});

export default PersonalInfoSchema;
