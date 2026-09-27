import {
	SEED,
	getTestPrisma,
	cleanAllTables,
	authenticateAs,
	unauthenticate,
	createTestAdmin,
	createTestStudent,
	seedReferenceData
} from "./helpers";
import {
	getAddressChangeRequests,
	reviewAddressChangeRequest,
	getAddressChangeRequestDetails
} from "@/actions/address-change-requests";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

describe("Address Change Requests (Admin) Integration", () => {
	const { prisma, pool } = getTestPrisma();

	let adminUser: any;
	let studentUser: any;
	let pendingRequest: any;

	beforeAll(async () => {
		await cleanAllTables(prisma);
		await seedReferenceData(prisma);

		adminUser = await createTestAdmin(prisma, { isActive: true });
		studentUser = await createTestStudent(prisma, {
			status: "Approved",
			name: "Rahul Sharma",
			stationId: SEED.stations[0].id
		});

		pendingRequest = await prisma.addressChange.create({
			data: {
				status: "Pending",
				submissionCount: 1,
				studentId: studentUser.user.id,
				newStationId: SEED.stations[1].id,
				newAddress: "New Address Ghatkopar",
				currentAddress: "Old Address Chembur",
				currentStationId: SEED.stations[0].id,
				verificationDocUrl: "https://test-r2.example.com/address-doc.pdf"
			}
		});
	});

	afterAll(async () => {
		await cleanAllTables(prisma);
		await prisma.$disconnect();
		await pool.end();
	});

	beforeEach(() => {
		unauthenticate();
	});

	describe("Authorization Guards", () => {
		it("returns UNAUTHORIZED when unauthenticated", async () => {
			const res = await getAddressChangeRequests({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(false);

			const detailsRes = await getAddressChangeRequestDetails(pendingRequest.id);
			expect(detailsRes.isSuccess).toBe(false);

			const reviewRes = await reviewAddressChangeRequest(pendingRequest.id, "Approved");
			expect(reviewRes.isSuccess).toBe(false);
		});

		it("returns FORBIDDEN when called by student", async () => {
			await authenticateAs(studentUser.user.id);

			const res = await getAddressChangeRequests({ page: 1, pageSize: 10 });
			expect(res.isSuccess).toBe(false);

			const detailsRes = await getAddressChangeRequestDetails(pendingRequest.id);
			expect(detailsRes.isSuccess).toBe(false);

			const reviewRes = await reviewAddressChangeRequest(pendingRequest.id, "Approved");
			expect(reviewRes.isSuccess).toBe(false);
		});
	});

	describe("getAddressChangeRequests", () => {
		it("lists address change requests with pagination for admin", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAddressChangeRequests({ page: 1, pageSize: 10 });

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.totalCount).toBeGreaterThanOrEqual(1);
				expect(res.data.currentPage).toBe(1);
				expect(res.data.data.some((r) => r.id === pendingRequest.id)).toBe(true);
			}
		});

		it("filters requests by status", async () => {
			await authenticateAs(adminUser.user.id);

			const pendingRes = await getAddressChangeRequests({
				page: 1,
				pageSize: 10,
				statusFilter: "Pending"
			});
			expect(pendingRes.isSuccess).toBe(true);
			if (pendingRes.isSuccess) {
				expect(pendingRes.data.data.every((r) => r.status === "Pending")).toBe(true);
			}

			const approvedRes = await getAddressChangeRequests({
				page: 1,
				pageSize: 10,
				statusFilter: "Approved"
			});
			expect(approvedRes.isSuccess).toBe(true);
			if (approvedRes.isSuccess) {
				expect(approvedRes.data.data.every((r) => r.status === "Approved")).toBe(true);
			}
		});

		it("filters requests by search query (address, student, station)", async () => {
			await authenticateAs(adminUser.user.id);

			const searchAddress = await getAddressChangeRequests({
				page: 1,
				pageSize: 10,
				searchQuery: "Ghatkopar"
			});
			expect(searchAddress.isSuccess).toBe(true);
			if (searchAddress.isSuccess) {
				expect(searchAddress.data.totalCount).toBeGreaterThanOrEqual(1);
			}

			const searchNonexistent = await getAddressChangeRequests({
				page: 1,
				pageSize: 10,
				searchQuery: "NonexistentLocationOrStudent"
			});
			expect(searchNonexistent.isSuccess).toBe(true);
			if (searchNonexistent.isSuccess) {
				expect(searchNonexistent.data.totalCount).toBe(0);
				expect(searchNonexistent.data.data).toHaveLength(0);
			}
		});

		it("handles pagination boundaries", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAddressChangeRequests({ page: 1, pageSize: 1 });

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.data.length).toBeLessThanOrEqual(1);
				expect(res.data.currentPage).toBe(1);
			}
		});
	});

	describe("getAddressChangeRequestDetails", () => {
		it("returns request details for existing request", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAddressChangeRequestDetails(pendingRequest.id);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.id).toBe(pendingRequest.id);
				expect(res.data.student.userId).toBe(studentUser.user.id);
				expect(res.data.currentStation).toBeDefined();
				expect(res.data.newStation).toBeDefined();
			}
		});

		it("returns validation error when request not found", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await getAddressChangeRequestDetails("00000000-0000-0000-0000-000000000000");

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("not found");
			}
		});
	});

	describe("reviewAddressChangeRequest", () => {
		it("requires rejectionReason when rejecting", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reviewAddressChangeRequest(pendingRequest.id, "Rejected", "");

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("Rejection reason is required");
			}
		});

		it("returns error when request not found", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reviewAddressChangeRequest("00000000-0000-0000-0000-000000000000", "Approved");

			expect(res.isSuccess).toBe(false);
			if (!res.isSuccess) {
				expect(res.error.message).toContain("not found");
			}
		});

		it("approves pending request, updates student profile address and station", async () => {
			await authenticateAs(adminUser.user.id);
			const res = await reviewAddressChangeRequest(pendingRequest.id, "Approved");

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Approved");
				expect(res.data.reviewedById).toBe(adminUser.user.id);
				expect(res.data.reviewedAt).not.toBeNull();
			}

			const updatedStudent = await prisma.student.findUnique({
				where: { userId: studentUser.user.id }
			});
			expect(updatedStudent?.address).toBe("New Address Ghatkopar");
			expect(updatedStudent?.stationId).toBe(SEED.stations[1].id);
		});

		it("prevents re-reviewing an already reviewed request (state-transition race)", async () => {
			await authenticateAs(adminUser.user.id);

			const reApproveRes = await reviewAddressChangeRequest(pendingRequest.id, "Approved");
			expect(reApproveRes.isSuccess).toBe(false);
			if (!reApproveRes.isSuccess) {
				expect(reApproveRes.error.message).toContain("already been reviewed");
			}

			const reRejectRes = await reviewAddressChangeRequest(pendingRequest.id, "Rejected", "Belated rejection");
			expect(reRejectRes.isSuccess).toBe(false);
			if (!reRejectRes.isSuccess) {
				expect(reRejectRes.error.message).toContain("already been reviewed");
			}
		});

		it("rejects a pending request when valid rejection reason is provided", async () => {
			const anotherRequest = await prisma.addressChange.create({
				data: {
					status: "Pending",
					submissionCount: 1,
					newAddress: "Address B",
					currentAddress: "Address A",
					studentId: studentUser.user.id,
					newStationId: SEED.stations[1].id,
					currentStationId: SEED.stations[0].id,
					verificationDocUrl: "https://test-r2.example.com/doc-b.pdf"
				}
			});

			await authenticateAs(adminUser.user.id);
			const res = await reviewAddressChangeRequest(
				anotherRequest.id,
				"Rejected",
				"Electricity bill is older than 3 months"
			);

			expect(res.isSuccess).toBe(true);
			if (res.isSuccess) {
				expect(res.data.status).toBe("Rejected");
				expect(res.data.rejectionReason).toBe("Electricity bill is older than 3 months");
			}

			const reReviewRes = await reviewAddressChangeRequest(anotherRequest.id, "Approved");
			expect(reReviewRes.isSuccess).toBe(false);
			if (!reReviewRes.isSuccess) {
				expect(reReviewRes.error.message).toContain("already been reviewed");
			}
		});
	});
});
