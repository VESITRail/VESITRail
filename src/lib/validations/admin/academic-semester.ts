import { z } from "zod";

const semesterDate = z
	.string()
	.trim()
	.pipe(z.iso.date({ error: "Enter a valid date in YYYY-MM-DD format", abort: true }))
	.refine((date) => !date.startsWith("0000-"), {
		error: "Enter a date with a year greater than zero",
		abort: true
	});

export const AcademicSemesterInputSchema = z
	.strictObject({
		academicYearStart: z.int32().positive("Academic year start must be a positive integer"),
		term: z.enum(["Odd", "Even"]),
		startDate: semesterDate,
		endDate: semesterDate
	})
	.refine(({ startDate, endDate }) => startDate <= endDate, {
		message: "End date must be on or after the start date",
		path: ["endDate"]
	});

export type AcademicSemesterInput = z.input<typeof AcademicSemesterInputSchema>;

export const AcademicSemesterIdSchema = z.string().trim().toLowerCase().pipe(z.uuidv4());
