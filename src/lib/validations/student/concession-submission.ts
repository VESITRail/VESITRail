import { z } from "zod";

export const ConcessionApplicationIdSchema = z.uuid();

export const ConcessionSubmissionSchema = z.object({
	stationId: z.uuid("Select a valid home station"),
	concessionClassId: z.uuid("Select a valid concession class"),
	concessionPeriodId: z.uuid("Select a valid concession period"),
	expectedSemesterId: z.uuid("Reload the form to get the current academic semester")
});

export type ConcessionSubmission = z.input<typeof ConcessionSubmissionSchema>;
