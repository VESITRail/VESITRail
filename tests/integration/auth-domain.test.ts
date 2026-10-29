import { auth } from "./test-auth";
import { getTestPrisma, cleanAllTables } from "./helpers";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("Auth Email Domain Restriction Integration", () => {
	const { prisma, pool } = getTestPrisma();

	const saveUser = async (email: string, name = "Domain Tester") => {
		const ctx = await auth.$context;
		const test = (ctx as any).test;
		return test.saveUser(test.createUser({ email, name, emailVerified: true }));
	};

	beforeAll(async () => {
		await cleanAllTables(prisma);
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	it("creates a user with a ves.ac.in email", async () => {
		const user = await saveUser("vesitrail.domain.valid@ves.ac.in");

		const stored = await prisma.user.findUnique({ where: { id: user.id } });
		expect(stored?.email).toBe("vesitrail.domain.valid@ves.ac.in");
	});

	it("title-cases and trims the name on creation", async () => {
		const user = await saveUser("vesitrail.domain.name@ves.ac.in", "  jay   kerkar ");

		const stored = await prisma.user.findUnique({ where: { id: user.id } });
		expect(stored?.name).toBe("Jay Kerkar");
	});

	it("accepts an uppercase ves.ac.in email and stores it lowercased", async () => {
		const user = await saveUser("VESITRAIL.DOMAIN.UPPER@VES.AC.IN");

		const stored = await prisma.user.findUnique({ where: { id: user.id } });
		expect(stored?.email).toBe("vesitrail.domain.upper@ves.ac.in");
	});

	it.each([
		"student@gmail.com",
		"student@ves.ac.in.evil.com",
		"ves.ac.in@gmail.com",
		"student@sub.ves.ac.in",
		"student@vesac.in",
		"student@",
		"student"
	])("rejects %s with INVALID_EMAIL_DOMAIN and does not persist the user", async (email) => {
		await expect(saveUser(email)).rejects.toMatchObject({
			body: { code: "INVALID_EMAIL_DOMAIN" }
		});

		const stored = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
		expect(stored).toBeNull();
	});
});
