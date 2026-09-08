import { z } from "zod";
import PersonalInfoSchema from "@/lib/validations/onboarding/personal-info";
import AcademicInfoSchema from "@/lib/validations/onboarding/academic-info";

export const EditStudentSchema = PersonalInfoSchema.omit({ address: true, mobileNumber: true })
	.extend({
		mobileNumber: z
			.string()
			.trim()
			.refine((val) => val === "" || /^\d+$/.test(val), "Mobile number must contain only digits")
			.refine((val) => val === "" || val.length === 10, "Mobile number must be exactly 10 digits")
			.refine((val) => val === "" || /^[6-9]\d{9}$/.test(val), "Please enter a valid Indian mobile number")
			.optional()
			.nullable()
			.or(z.literal(""))
	})
	.merge(AcademicInfoSchema);

export type EditStudentInput = z.infer<typeof EditStudentSchema>;

export const UpdateStudentActionSchema = EditStudentSchema.extend({
	studentId: z.string().min(1, "Student ID is required")
});

export type UpdateStudentActionInput = z.infer<typeof UpdateStudentActionSchema>;
