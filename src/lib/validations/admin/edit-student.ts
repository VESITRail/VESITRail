import { z } from "zod";
import PersonalInfoSchema from "@/lib/validations/onboarding/personal-info";
import AcademicInfoSchema from "@/lib/validations/onboarding/academic-info";

export const EditStudentSchema = PersonalInfoSchema.omit({ address: true }).merge(AcademicInfoSchema);

export type EditStudentInput = z.infer<typeof EditStudentSchema>;

export const UpdateStudentActionSchema = EditStudentSchema.extend({
	studentId: z.string().min(1, "Student ID is required")
});

export type UpdateStudentActionInput = z.infer<typeof UpdateStudentActionSchema>;
