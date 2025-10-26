import { z } from "zod";

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
		.min(1, "Middle name is required")
		.min(2, "Middle name must be at least 2 characters")
		.max(50, "Middle name cannot exceed 50 characters")
		.regex(/^[a-zA-Z\s]+$/, "Only letters and spaces are allowed")
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, "Middle name cannot be empty after trimming"),

	lastName: z
		.string()
		.min(1, "Last name is required")
		.min(2, "Last name must be at least 2 characters")
		.max(50, "Last name cannot exceed 50 characters")
		.regex(/^[a-zA-Z\s]+$/, "Only letters and spaces are allowed")
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, "Last name cannot be empty after trimming"),

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
			const date = new Date(val);
			return !isNaN(date.getTime());
		}, "Please enter a valid date")
		.refine((val) => {
			const today = new Date();
			const birthDate = new Date(val);
			const age = today.getFullYear() - birthDate.getFullYear();
			const monthDiff = today.getMonth() - birthDate.getMonth();

			const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

			return actualAge >= 17;
		}, "You must be at least 17 years old")
		.refine((val) => {
			const today = new Date();
			const birthDate = new Date(val);
			const age = today.getFullYear() - birthDate.getFullYear();
			const monthDiff = today.getMonth() - birthDate.getMonth();

			const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

			return actualAge <= 25;
		}, "Age cannot exceed 25 years")
		.refine((val) => {
			const today = new Date();
			const birthDate = new Date(val);
			return birthDate <= today;
		}, "Date of birth cannot be in the future")
		.transform((val) => new Date(val).toISOString().split("T")[0])
});

export default PersonalInfoSchema;
