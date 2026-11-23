import {
	getAcademicSemester,
	getAcademicSemesters,
	updateAcademicSemester,
	deleteAcademicSemester,
	createAcademicSemester
} from "@/actions/academic-semester";
import {
	getTestPrisma,
	authenticateAs,
	cleanAllTables,
	unauthenticate,
	createTestAdmin,
	createTestStudent,
	seedReferenceData,
	createTestApplication
} from "./helpers";
import { unwrap } from "@/lib/result";
import type { AcademicSemesterInput } from "@/lib/validations/admin/academic-semester";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const evenSemester: AcademicSemesterInput = {
	term: "Even",
	endDate: "2027-07-24",
	academicYearStart: 2026,
	startDate: "2027-01-11"
};

const oddSemester: AcademicSemesterInput = {
	term: "Odd",
	endDate: "2027-12-15",
	academicYearStart: 2027,
	startDate: "2027-08-01"
};

const missingId = "550e8400-e29b-41d4-a716-446655440000";

describe("Academic semester actions", () => {
	const { prisma, pool } = getTestPrisma();

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);
	});

	beforeEach(async () => {
		const { user } = await createTestAdmin(prisma);
		await authenticateAs(user.id);
	});

	afterEach(async () => {
		unauthenticate();
		await cleanAllTables(prisma);
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	it.each([
		["unauthenticated", "UNAUTHORIZED"],
		["student", "FORBIDDEN"],
		["inactive admin", "FORBIDDEN"]
	] as const)("rejects every calendar operation for caller type %s", async (role, code) => {
		const semester = unwrap(await createAcademicSemester(evenSemester));
		unauthenticate();

		if (role === "student") {
			const { user } = await createTestStudent(prisma);
			await authenticateAs(user.id);
		}
		if (role === "inactive admin") {
			const { user } = await createTestAdmin(prisma, { isActive: false });
			await authenticateAs(user.id);
		}

		const error = { isSuccess: false, error: { type: "AUTH_ERROR", code } };
		expect(await getAcademicSemesters()).toMatchObject(error);
		expect(await getAcademicSemester(semester.id)).toMatchObject(error);
		expect(await createAcademicSemester(oddSemester)).toMatchObject(error);
		expect(await updateAcademicSemester(semester.id, oddSemester)).toMatchObject(error);
		expect(await updateAcademicSemester("invalid-id", oddSemester)).toMatchObject(error);
		expect(await deleteAcademicSemester(semester.id)).toMatchObject(error);
		expect(await prisma.academicSemester.findMany()).toMatchObject([semester]);
	});

	it("lists an empty calendar", async () => {
		expect(await getAcademicSemesters()).toEqual({ isSuccess: true, data: [] });
	});

	it("creates and reads semesters from different academic years in the same calendar year", async () => {
		const even = unwrap(await createAcademicSemester(evenSemester));
		const odd = unwrap(await createAcademicSemester(oddSemester));

		expect(even).toEqual({
			term: "Even",
			id: expect.any(String),
			academicYearStart: 2026,
			endDate: new Date("2027-07-24"),
			startDate: new Date("2027-01-11")
		});
		expect(unwrap(await getAcademicSemester(even.id))).toEqual(even);
		expect(unwrap(await getAcademicSemesters())).toEqual([odd, even]);
	});

	it("rejects invalid dates and properties before persisting a semester", async () => {
		const extraProperty = { ...evenSemester, id: missingId };
		const invalidDates = { ...evenSemester, endDate: "2027-01-10" };

		expect(await createAcademicSemester(invalidDates)).toMatchObject({
			isSuccess: false,
			error: { type: "VALIDATION_ERROR", field: "endDate" }
		});
		expect(await createAcademicSemester(extraProperty)).toMatchObject({
			isSuccess: false,
			error: { type: "VALIDATION_ERROR" }
		});
		expect(await prisma.academicSemester.count()).toBe(0);
	});

	it("leaves an existing semester unchanged after an invalid update payload", async () => {
		const invalidInput = { ...oddSemester, id: missingId };
		const semester = unwrap(await createAcademicSemester(evenSemester));

		expect(await updateAcademicSemester(semester.id, invalidInput)).toMatchObject({
			isSuccess: false,
			error: { type: "VALIDATION_ERROR" }
		});
		expect(unwrap(await getAcademicSemesters())).toEqual([semester]);
	});

	it("rejects duplicate academic year and term even when dates do not overlap", async () => {
		unwrap(await createAcademicSemester(evenSemester));
		const duplicate = { ...evenSemester, startDate: "2027-08-01", endDate: "2027-12-15" };

		expect(await createAcademicSemester(duplicate)).toMatchObject({
			isSuccess: false,
			error: { type: "VALIDATION_ERROR", message: "A semester already exists for this academic year and term" }
		});
		expect(await prisma.academicSemester.count()).toBe(1);
	});

	it.each(["2027-07-25", "2027-08-01"])("rejects a new window when the prior semester ends on %s", async (endDate) => {
		unwrap(await createAcademicSemester({ ...evenSemester, endDate }));

		expect(await createAcademicSemester(oddSemester)).toMatchObject({
			isSuccess: false,
			error: { type: "VALIDATION_ERROR", message: "The application window overlaps another academic semester" }
		});
		expect(await prisma.academicSemester.count()).toBe(1);
	});

	it("checks adjacency and overlap when the later semester is entered first", async () => {
		const odd = unwrap(await createAcademicSemester(oddSemester));
		expect(await createAcademicSemester({ ...evenSemester, endDate: "2027-07-25" })).toMatchObject({
			isSuccess: false,
			error: { type: "VALIDATION_ERROR", message: "The application window overlaps another academic semester" }
		});
		const even = unwrap(await createAcademicSemester(evenSemester));
		expect(unwrap(await getAcademicSemesters())).toEqual([odd, even]);
	});

	it.each([
		{ startDate: "2028-01-02", priorEndDate: "2027-12-25", overlaps: false },
		{ startDate: "2028-01-02", priorEndDate: "2027-12-26", overlaps: true },
		{ startDate: "2028-03-07", priorEndDate: "2028-02-28", overlaps: false },
		{ startDate: "2028-03-07", priorEndDate: "2028-02-29", overlaps: true }
	])(
		"checks the early window starting $startDate against a semester ending $priorEndDate",
		async ({ startDate, priorEndDate, overlaps }) => {
			unwrap(await createAcademicSemester({ ...oddSemester, endDate: priorEndDate }));
			const next = { ...evenSemester, academicYearStart: 2027, startDate, endDate: "2028-06-15" };

			const result = await createAcademicSemester(next);
			if (overlaps) {
				expect(result).toMatchObject({
					isSuccess: false,
					error: { type: "VALIDATION_ERROR", message: "The application window overlaps another academic semester" }
				});
			} else {
				expect(unwrap(result)).toMatchObject({ startDate: new Date(startDate), endDate: new Date(next.endDate) });
			}
			expect(await prisma.academicSemester.count()).toBe(overlaps ? 1 : 2);
		}
	);

	it("rejects a window contained entirely within an existing semester", async () => {
		const containingSemester = unwrap(await createAcademicSemester(evenSemester));
		const containedSemester = { ...oddSemester, startDate: "2027-02-01", endDate: "2027-02-01" };

		expect(await createAcademicSemester(containedSemester)).toMatchObject({
			isSuccess: false,
			error: { type: "VALIDATION_ERROR", message: "The application window overlaps another academic semester" }
		});
		expect(unwrap(await getAcademicSemesters())).toEqual([containingSemester]);
	});

	it("persists a semester that starts and ends on the same leap day", async () => {
		const leapDay = "2028-02-29";
		const semester = unwrap(
			await createAcademicSemester({ ...evenSemester, academicYearStart: 2027, startDate: leapDay, endDate: leapDay })
		);
		expect(unwrap(await getAcademicSemester(semester.id))).toMatchObject({
			startDate: new Date(leapDay),
			endDate: new Date(leapDay)
		});
	});

	it.each(["0001-01-01", "9999-12-31"])("persists the supported calendar boundary %s", async (date) => {
		const semester = unwrap(
			await createAcademicSemester({
				...evenSemester,
				endDate: date,
				startDate: date,
				academicYearStart: Number(date.slice(0, 4))
			})
		);
		expect(unwrap(await getAcademicSemester(semester.id))).toMatchObject({
			endDate: new Date(date),
			startDate: new Date(date)
		});
	});

	it("persists only one of two concurrent overlapping creates", async () => {
		const results = await Promise.all([
			createAcademicSemester({ ...evenSemester, endDate: "2027-07-25" }),
			createAcademicSemester(oddSemester)
		]);

		expect(results.filter((result) => result.isSuccess)).toHaveLength(1);
		expect(results.find((result) => !result.isSuccess)).toMatchObject({
			error: { type: "VALIDATION_ERROR", message: "The application window overlaps another academic semester" }
		});
		expect(await prisma.academicSemester.count()).toBe(1);
	});

	it("updates a semester in place when its new window is valid", async () => {
		const original = unwrap(await createAcademicSemester(evenSemester));
		const updated = unwrap(await updateAcademicSemester(original.id, { ...evenSemester, startDate: "2027-01-12" }));

		expect(updated).toEqual({ ...original, startDate: new Date("2027-01-12") });
		expect(unwrap(await getAcademicSemester(original.id))).toEqual(updated);
	});

	it("leaves a semester unchanged if an update introduces an overlap or duplicate term", async () => {
		const even = unwrap(await createAcademicSemester(evenSemester));
		unwrap(await createAcademicSemester(oddSemester));

		expect(await updateAcademicSemester(even.id, { ...evenSemester, endDate: "2027-07-25" })).toMatchObject({
			isSuccess: false,
			error: { type: "VALIDATION_ERROR", message: "The application window overlaps another academic semester" }
		});
		expect(
			await updateAcademicSemester(even.id, { ...oddSemester, startDate: "2028-08-01", endDate: "2028-12-15" })
		).toMatchObject({
			isSuccess: false,
			error: { type: "VALIDATION_ERROR", message: "A semester already exists for this academic year and term" }
		});
		expect(unwrap(await getAcademicSemester(even.id))).toEqual(even);
	});

	it("persists only one of two concurrent updates to overlapping windows", async () => {
		const odd = unwrap(await createAcademicSemester(oddSemester));
		const even = unwrap(await createAcademicSemester(evenSemester));
		const newWindow = { startDate: "2028-01-10", endDate: "2028-03-31" };

		const results = await Promise.all([
			updateAcademicSemester(even.id, { ...evenSemester, ...newWindow }),
			updateAcademicSemester(odd.id, { ...oddSemester, ...newWindow })
		]);

		expect(results.filter((result) => result.isSuccess)).toHaveLength(1);
		expect(results.find((result) => !result.isSuccess)).toMatchObject({
			error: { type: "VALIDATION_ERROR", message: "The application window overlaps another academic semester" }
		});
		const semesters = unwrap(await getAcademicSemesters());
		expect(semesters).toHaveLength(2);
		expect(semesters[0].startDate).toEqual(new Date(newWindow.startDate));
		expect(semesters[1]).toEqual(semesters[0].id === even.id ? odd : even);
	});

	it.each(["", "invalid-id", undefined])("rejects invalid semester ID %j for every record operation", async (id) => {
		const invalidId = id as string;
		const error = { isSuccess: false, error: { type: "VALIDATION_ERROR", field: "id" } };
		expect(await getAcademicSemester(invalidId)).toMatchObject(error);
		expect(await updateAcademicSemester(invalidId, evenSemester)).toMatchObject(error);
		expect(await deleteAcademicSemester(invalidId)).toMatchObject(error);
		expect(await prisma.academicSemester.count()).toBe(0);
	});

	it("reports a missing semester for reads, updates, and deletes", async () => {
		const error = { isSuccess: false, error: { type: "VALIDATION_ERROR", message: "Academic semester not found" } };
		expect(await getAcademicSemester(missingId)).toMatchObject(error);
		expect(await updateAcademicSemester(missingId, evenSemester)).toMatchObject(error);
		expect(await deleteAcademicSemester(missingId)).toMatchObject(error);
	});

	it("deletes an unreferenced semester", async () => {
		const semester = unwrap(await createAcademicSemester(evenSemester));

		expect(unwrap(await deleteAcademicSemester(semester.id))).toEqual({ id: semester.id });
		expect(await prisma.academicSemester.findUnique({ where: { id: semester.id } })).toBeNull();
		expect(await deleteAcademicSemester(semester.id)).toMatchObject({
			isSuccess: false,
			error: { type: "VALIDATION_ERROR", message: "Academic semester not found" }
		});
	});

	it("preserves a semester referenced by an application", async () => {
		const semester = unwrap(await createAcademicSemester(evenSemester));
		const { student } = await createTestStudent(prisma);
		const application = await createTestApplication(prisma, { studentId: student.userId, semesterId: semester.id });

		expect(await deleteAcademicSemester(semester.id)).toMatchObject({
			isSuccess: false,
			error: { type: "VALIDATION_ERROR", message: "This semester cannot be deleted because it has applications" }
		});
		expect(unwrap(await getAcademicSemester(semester.id))).toEqual(semester);
		expect(await prisma.concessionApplication.findUnique({ where: { id: application.id } })).toMatchObject({
			semesterId: semester.id
		});
	});

	it("preserves existing application links when an admin corrects semester dates", async () => {
		const semester = unwrap(await createAcademicSemester(evenSemester));
		const { student } = await createTestStudent(prisma);
		const application = await createTestApplication(prisma, { studentId: student.userId, semesterId: semester.id });
		const endDate = "2027-07-23";
		const updated = unwrap(await updateAcademicSemester(semester.id, { ...evenSemester, endDate }));

		expect(updated).toEqual({ ...semester, endDate: new Date(endDate) });
		expect(await prisma.concessionApplication.findUnique({ where: { id: application.id } })).toMatchObject({
			semesterId: semester.id
		});
	});
});
