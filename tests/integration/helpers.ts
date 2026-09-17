import dotenv from "dotenv";
dotenv.config({ path: ".env.test", override: true });

import pg from "pg";
import { auth } from "@/lib/auth";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { setTestHeaders, clearTestHeaders } from "./headers-state";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/vesitrail_test";

export function getTestPrisma() {
	const pool = new pg.Pool({ connectionString: DATABASE_URL });
	const adapter = new PrismaPg(pool);
	const prisma = new PrismaClient({ adapter });
	return { prisma, pool };
}

export const SEED = {
	stations: [
		{ id: "0141348f-13a6-4b12-b1cb-90621f283eed", code: "AIRL", name: "Airoli" },
		{ id: "1b796995-984c-40a2-be29-3b8d3cb2e154", code: "ABY", name: "Ambivli" },
		{ id: "6e441be3-1668-4de5-9fa2-93044c312692", code: "ADH", name: "Andheri" },
		{ id: "a1ffed51-1460-4004-bbeb-8f283430a5e7", code: "ASO", name: "Asangaon" },
		{ id: "15fb23b1-3fb8-4db3-a747-55ea64ba1ac5", code: "ABH", name: "Ambarnath" }
	],
	branches: [
		{ id: "b73383d7-d749-4137-9462-dbeac95da439", code: "CMPN", name: "Computer Engineering" },
		{ id: "a6b3b1b0-3a8e-49f1-889b-bee554e0443e", code: "INFT", name: "Information Technology" },
		{ id: "5bb1d8dc-4843-417c-be2c-209f7b75e65e", code: "AURO", name: "Automation and Robotics Engineering" },
		{ id: "9bc156f2-1890-4fff-9b43-bde3c698577f", code: "AIDS", name: "Artificial Intelligence and Data Science" },
		{ id: "d815ded8-eeed-486c-bf0f-4f741092a210", code: "EXTC", name: "Electronics and Telecommunication Engineering" }
	],
	years: [
		{ id: "a38b05b9-bfe7-4d8e-afa9-ccc02a16835b", code: "FY", name: "First Year" },
		{ id: "08159e5b-0b14-4ce1-984c-18b6e9aee023", code: "TY", name: "Third Year" },
		{ id: "8cf8075f-788b-492a-8590-f537e21c056c", code: "LY", name: "Fourth Year" },
		{ id: "cfae4099-10d7-4dcf-b459-1fac77967258", code: "SY", name: "Second Year" }
	],
	classes: [
		{
			code: "D1",
			id: "4057a512-a5e9-49fc-b8b8-b0892a67d102",
			yearId: "a38b05b9-bfe7-4d8e-afa9-ccc02a16835b",
			branchId: "a6b3b1b0-3a8e-49f1-889b-bee554e0443e"
		},
		{
			code: "D10A",
			id: "0712b86c-27ed-4c91-8f7a-f5fcc4902705",
			yearId: "cfae4099-10d7-4dcf-b459-1fac77967258",
			branchId: "d815ded8-eeed-486c-bf0f-4f741092a210"
		},
		{
			code: "D10B",
			id: "c83341c8-80fd-4f27-a445-f28c0247d9e5",
			yearId: "cfae4099-10d7-4dcf-b459-1fac77967258",
			branchId: "d815ded8-eeed-486c-bf0f-4f741092a210"
		},
		{
			code: "D10C",
			id: "b27af7c5-348e-449b-a50d-4190d1141c6c",
			yearId: "cfae4099-10d7-4dcf-b459-1fac77967258",
			branchId: "d815ded8-eeed-486c-bf0f-4f741092a210"
		},
		{
			code: "D11",
			id: "88b57934-5cd1-4797-8478-22929142ba86",
			yearId: "08159e5b-0b14-4ce1-984c-18b6e9aee023",
			branchId: "a6b3b1b0-3a8e-49f1-889b-bee554e0443e"
		}
	],
	concessionClasses: [
		{ id: "2accf9a2-a9a9-4467-b909-551989b2cb3a", code: "I", name: "First" },
		{ id: "a2bbb8b3-24df-4877-b85e-f2d81a70f8a2", code: "II", name: "Second" }
	],
	concessionPeriods: [
		{ id: "1a7cb8cb-f8d0-4079-b65c-f6c977b1fa0b", name: "Monthly", duration: 1 },
		{ id: "5ebd847c-abde-45d7-b1b3-cd3336e9aa7f", name: "Quarterly", duration: 3 }
	]
} as const;

export async function seedReferenceData(prisma: PrismaClient) {
	const now = new Date();

	await prisma.station.createMany({
		data: SEED.stations.map((s) => ({ ...s, isActive: true, createdAt: now, updatedAt: now })),
		skipDuplicates: true
	});

	await prisma.branch.createMany({
		data: SEED.branches.map((b) => ({ ...b, isActive: true, createdAt: now, updatedAt: now })),
		skipDuplicates: true
	});

	await prisma.year.createMany({
		data: SEED.years.map((y) => ({ ...y, isActive: true, createdAt: now, updatedAt: now })),
		skipDuplicates: true
	});

	await prisma.class.createMany({
		data: SEED.classes.map((c) => ({ ...c, isActive: true, createdAt: now, updatedAt: now })),
		skipDuplicates: true
	});

	await prisma.concessionClass.createMany({
		data: SEED.concessionClasses.map((cc) => ({ ...cc, isActive: true, createdAt: now, updatedAt: now })),
		skipDuplicates: true
	});

	await prisma.concessionPeriod.createMany({
		data: SEED.concessionPeriods.map((cp) => ({ ...cp, isActive: true, createdAt: now, updatedAt: now })),
		skipDuplicates: true
	});
}

export async function cleanAllTables(prisma: PrismaClient) {
	await prisma.notification.deleteMany();
	await prisma.fcmToken.deleteMany();
	await prisma.concessionApplication.deleteMany();
	await prisma.concessionBooklet.deleteMany();
	await prisma.addressChange.deleteMany();
	await prisma.legacyStudent.deleteMany();
	await prisma.student.deleteMany();
	await prisma.admin.deleteMany();
	await prisma.appConfig.deleteMany();
	await prisma.verification.deleteMany();
	await prisma.account.deleteMany();
	await prisma.session.deleteMany();
	await prisma.user.deleteMany();
}

let userCounter = 0;

export async function createTestUser(
	prisma: PrismaClient,
	overrides: { id?: string; name?: string; email?: string } = {}
) {
	userCounter++;
	const ctx = await auth.$context;
	const test = (ctx as any).test;

	const id = overrides.id || `test-user-${userCounter}-${Date.now()}`;
	const email = overrides.email || `vesitrail.testuser${userCounter}@ves.ac.in`;
	const name = overrides.name || `Test User ${userCounter}`;

	const userObj = test.createUser({
		id,
		name,
		email,
		emailVerified: true
	});

	const savedUser = await test.saveUser(userObj);
	return savedUser;
}

export async function authenticateAs(userId: string) {
	const ctx = await auth.$context;
	const test = (ctx as any).test;
	const { headers } = await test.login({ userId });
	setTestHeaders(headers);
}

export function unauthenticate() {
	clearTestHeaders();
}

export async function createTestAdmin(
	prisma: PrismaClient,
	overrides: { userId?: string; isActive?: boolean; name?: string; email?: string } = {}
) {
	const user = await createTestUser(prisma, {
		id: overrides.userId,
		name: overrides.name || "Test Admin",
		email: overrides.email || `vesitrail.testadmin${++userCounter}@ves.ac.in`
	});

	const admin = await prisma.admin.create({
		data: {
			userId: user.id,
			isActive: overrides.isActive ?? true
		}
	});

	return { user, admin };
}

export async function createTestStudent(
	prisma: PrismaClient,
	overrides: {
		name?: string;
		email?: string;
		userId?: string;
		classId?: string;
		stationId?: string;
		concessionClassId?: string;
		concessionPeriodId?: string;
		status?: "Pending" | "Approved" | "Rejected";
	} = {}
) {
	const user = await createTestUser(prisma, {
		id: overrides.userId,
		name: overrides.name || "Test Student",
		email: overrides.email || `vesitrail.teststudent${++userCounter}@ves.ac.in`
	});

	const student = await prisma.student.create({
		data: {
			gender: "Male",
			userId: user.id,
			firstName: "Test",
			submissionCount: 1,
			lastName: "Student",
			mobileNumber: "9876543210",
			dateOfBirth: new Date("2003-01-15"),
			address: "Test Address, Mumbai 400001",
			status: overrides.status ?? "Approved",
			classId: overrides.classId || SEED.classes[0].id,
			stationId: overrides.stationId || SEED.stations[0].id,
			verificationDocUrl: "https://test-r2.example.com/test-doc.pdf",
			preferredConcessionClassId: overrides.concessionClassId || SEED.concessionClasses[0].id,
			preferredConcessionPeriodId: overrides.concessionPeriodId || SEED.concessionPeriods[0].id
		}
	});

	return { user, student };
}
