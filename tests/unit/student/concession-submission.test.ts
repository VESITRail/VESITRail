import { describe, expect, it } from "vitest";
import * as submission from "@/lib/validations/student/concession-submission";

const id = "0141348f-13a6-4b12-b1cb-90621f283eed";
const options = { stationId: id, concessionClassId: id, concessionPeriodId: id, expectedSemesterId: id };

describe("ConcessionSubmissionSchema", () => {
	it("retains only writable details and the expected semester", () => {
		const result = submission.ConcessionSubmissionSchema.safeParse({
			...options,
			studentId: id,
			semesterId: id,
			previousApplicationId: id,
			applicationType: "Renewal"
		});

		expect(result).toEqual({ success: true, data: { ...options, expectedSemesterId: id } });
	});

	it("rejects submissions without the semester shown on the form", () => {
		const { expectedSemesterId: _expectedSemesterId, ...payload } = options;
		const result = submission.ConcessionSubmissionSchema.safeParse(payload);
		expect(result).toMatchObject({ success: false, error: { issues: [{ path: ["expectedSemesterId"] }] } });
	});

	it.each([
		["stationId", ""],
		["concessionClassId", " "],
		["concessionPeriodId", undefined],
		["expectedSemesterId", null],
		["expectedSemesterId", "invalid"]
	])("rejects invalid %s", (field, value) => {
		const result = submission.ConcessionSubmissionSchema.safeParse({ ...options, [field as string]: value });
		expect(result.success).toBe(false);
	});

	it.each([null, undefined, ""])("rejects invalid submission %s", (value) => {
		expect(submission.ConcessionSubmissionSchema.safeParse(value).success).toBe(false);
	});
});

describe("ConcessionApplicationIdSchema", () => {
	it("accepts an application UUID", () => {
		expect(submission.ConcessionApplicationIdSchema.safeParse(id)).toEqual({ success: true, data: id });
	});

	it.each(["", " ", null, undefined, "invalid"])("rejects invalid application ID %s", (value) => {
		expect(submission.ConcessionApplicationIdSchema.safeParse(value).success).toBe(false);
	});
});
