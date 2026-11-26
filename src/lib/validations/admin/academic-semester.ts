import { z } from "zod";
import { getAcademicYearDateRange, isDateInAcademicYear } from "@/lib/academic-semester-calendar";

const semesterDate = z
	.string("Enter a valid date")
	.trim()
	.pipe(z.iso.date({ error: "Enter a valid date", abort: true }))
	.refine((date) => !date.startsWith("0000-"), {
		error: "Enter a date with a year greater than zero",
		abort: true
	});

export const AcademicYearStartSchema = z
	.number("Enter a valid academic year start")
	.refine((year) => Number.isInteger(year) && year >= 1 && year <= 9998, {
		error: "Enter a whole year from 1 to 9998",
		abort: true
	});

export const AcademicSemesterInputSchema = z
	.strictObject({
		academicYearStart: AcademicYearStartSchema,
		term: z.enum(["Odd", "Even"], "Select Odd or Even"),
		startDate: semesterDate,
		endDate: semesterDate
	})
	.superRefine((semester, context) => {
		const range = getAcademicYearDateRange(semester.academicYearStart);
		for (const field of ["startDate", "endDate"] as const) {
			if (!isDateInAcademicYear(semester[field], range)) {
				context.addIssue({ code: "custom", path: [field], message: "Choose a date within the academic year" });
			}
		}
	})
	.refine(({ startDate, endDate }) => startDate <= endDate, {
		message: "End date must be on or after the start date",
		path: ["endDate"]
	});

export type AcademicSemesterInput = z.input<typeof AcademicSemesterInputSchema>;

export const AcademicSemesterIdSchema = z.string().trim().toLowerCase().pipe(z.uuidv4());
