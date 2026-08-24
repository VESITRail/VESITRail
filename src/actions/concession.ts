"use server";

import {
	Station,
	ConcessionClass,
	ConcessionPeriod,
	ConcessionApplication,
	ConcessionApplicationTypeType,
	ConcessionApplicationStatusType
} from "@/generated/zod";
import {
	Result,
	success,
	failure,
	AuthError,
	authError,
	databaseError,
	DatabaseError,
	validationError,
	ValidationError
} from "@/lib/result";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin, requireStudent } from "@/lib/auth-guard";
import { sendConcessionNotification } from "@/lib/notifications";

export type Concession =
	| (Pick<
			ConcessionApplication,
			| "id"
			| "status"
			| "shortId"
			| "createdAt"
			| "reviewedAt"
			| "applicationType"
			| "rejectionReason"
			| "submissionCount"
	  > & {
			previousApplication?: Concession;
			station: Pick<Station, "id" | "code" | "name">;
			concessionClass: Pick<ConcessionClass, "id" | "code" | "name">;
			concessionPeriod: Pick<ConcessionPeriod, "id" | "name" | "duration">;
	  })
	| null;

export type ConcessionApplicationData = Pick<
	ConcessionApplication,
	"studentId" | "stationId" | "applicationType" | "concessionClassId" | "concessionPeriodId" | "previousApplicationId"
>;

export type PaginationParams = {
	page: number;
	pageSize: number;
	statusFilter?: ConcessionApplicationStatusType | "all";
	typeFilter?: ConcessionApplicationTypeType | "all";
};

export type PaginatedResult<T> = {
	data: T[];
	totalCount: number;
	totalPages: number;
	currentPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
};

export const getConcessions = async (
	params: PaginationParams
): Promise<Result<PaginatedResult<Concession>, AuthError | DatabaseError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const targetStudentId = studentResult.data.studentId;
		const whereClause: Prisma.ConcessionApplicationWhereInput = { studentId: targetStudentId };

		if (params.statusFilter && params.statusFilter !== "all") {
			whereClause.status = params.statusFilter;
		}

		if (params.typeFilter && params.typeFilter !== "all") {
			whereClause.applicationType = params.typeFilter;
		}

		const totalCount = await prisma.concessionApplication.count({
			where: whereClause
		});

		const totalPages = Math.ceil(totalCount / params.pageSize);
		const skip = (params.page - 1) * params.pageSize;
		const hasNextPage = params.page < totalPages;
		const hasPreviousPage = params.page > 1;

		const concessions = await prisma.concessionApplication.findMany({
			skip,
			where: whereClause,
			take: params.pageSize,
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				status: true,
				shortId: true,
				createdAt: true,
				reviewedAt: true,
				applicationType: true,
				rejectionReason: true,
				submissionCount: true,
				station: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionClass: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionPeriod: {
					select: {
						id: true,
						name: true,
						duration: true
					}
				},
				previousApplication: {
					select: {
						id: true,
						status: true,
						shortId: true,
						createdAt: true,
						reviewedAt: true,
						applicationType: true,
						rejectionReason: true,
						submissionCount: true,
						station: {
							select: {
								id: true,
								code: true,
								name: true
							}
						},
						concessionClass: {
							select: {
								id: true,
								code: true,
								name: true
							}
						},
						concessionPeriod: {
							select: {
								id: true,
								name: true,
								duration: true
							}
						}
					}
				}
			}
		});

		const result: PaginatedResult<Concession> = {
			totalCount,
			totalPages,
			hasNextPage,
			hasPreviousPage,
			data: concessions,
			currentPage: params.page
		};

		return success(result);
	} catch (error) {
		console.error("Error while fetching concessions:", error);
		return failure(databaseError("Failed to fetch concessions"));
	}
};

export const getLastApplication = async (): Promise<Result<Concession, AuthError | DatabaseError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const targetStudentId = studentResult.data.studentId;

		const lastApplication = await prisma.concessionApplication.findFirst({
			where: { studentId: targetStudentId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				status: true,
				shortId: true,
				createdAt: true,
				reviewedAt: true,
				applicationType: true,
				rejectionReason: true,
				submissionCount: true,
				station: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionClass: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionPeriod: {
					select: {
						id: true,
						name: true,
						duration: true
					}
				}
			}
		});

		return success(lastApplication);
	} catch (error) {
		console.error("Error while fetching application:", error);
		return failure(databaseError("Failed to fetch application"));
	}
};

export type AdminApplicationParams = {
	page: number;
	pageSize: number;
	searchQuery?: string;
	typeFilter?: ConcessionApplicationTypeType | "all";
	statusFilter?: ConcessionApplicationStatusType | "all";
};

export type AdminApplication = Pick<
	ConcessionApplication,
	| "id"
	| "status"
	| "shortId"
	| "createdAt"
	| "reviewedAt"
	| "pageOffset"
	| "applicationType"
	| "rejectionReason"
	| "submissionCount"
	| "concessionBookletId"
> & {
	student: {
		firstName: string;
		lastName: string | null;
		middleName: string | null;
		user: {
			email: string;
		};
	};
	station: Pick<Station, "id" | "code" | "name">;
	concessionClass: Pick<ConcessionClass, "id" | "code" | "name">;
	concessionPeriod: Pick<ConcessionPeriod, "id" | "name" | "duration">;
};

export const getAllApplications = async (
	adminId: string,
	params: AdminApplicationParams
): Promise<Result<PaginatedResult<AdminApplication>, AuthError | DatabaseError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const whereClause: Prisma.ConcessionApplicationWhereInput = {};

		if (params.statusFilter && params.statusFilter !== "all") {
			whereClause.status = params.statusFilter;
		}

		if (params.typeFilter && params.typeFilter !== "all") {
			whereClause.applicationType = params.typeFilter;
		}

		if (params.searchQuery && params.searchQuery.trim()) {
			const searchTerm = params.searchQuery.trim();
			const isNumeric = /^\d+$/.test(searchTerm);

			const orConditions: Prisma.ConcessionApplicationWhereInput[] = [
				{
					student: {
						firstName: { contains: searchTerm, mode: "insensitive" }
					}
				},
				{
					student: {
						middleName: { contains: searchTerm, mode: "insensitive" }
					}
				},
				{
					student: {
						lastName: { contains: searchTerm, mode: "insensitive" }
					}
				},
				{
					student: {
						user: {
							email: { contains: searchTerm, mode: "insensitive" }
						}
					}
				},
				{
					station: {
						name: { contains: searchTerm, mode: "insensitive" }
					}
				},
				{
					station: {
						code: { contains: searchTerm, mode: "insensitive" }
					}
				},
				{
					concessionClass: {
						name: { contains: searchTerm, mode: "insensitive" }
					}
				},
				{
					concessionClass: {
						code: { contains: searchTerm, mode: "insensitive" }
					}
				},
				{
					concessionPeriod: {
						name: { contains: searchTerm, mode: "insensitive" }
					}
				}
			];

			if (isNumeric) {
				orConditions.push({ shortId: parseInt(searchTerm, 10) });
			}

			const nameParts = searchTerm.split(/\s+/).filter(Boolean);
			if (nameParts.length > 1) {
				orConditions.push({
					AND: [
						{
							student: {
								firstName: { contains: nameParts[0], mode: "insensitive" }
							}
						},
						{
							student: {
								lastName: { contains: nameParts[nameParts.length - 1], mode: "insensitive" }
							}
						}
					]
				});
			}

			whereClause.OR = orConditions;
		}

		const applications = await prisma.concessionApplication.findMany({
			where: whereClause,
			select: {
				id: true,
				status: true,
				shortId: true,
				createdAt: true,
				reviewedAt: true,
				pageOffset: true,
				applicationType: true,
				rejectionReason: true,
				submissionCount: true,
				concessionBookletId: true,
				student: {
					select: {
						lastName: true,
						firstName: true,
						middleName: true,
						user: {
							select: {
								email: true
							}
						}
					}
				},
				station: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionClass: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionPeriod: {
					select: {
						id: true,
						name: true,
						duration: true
					}
				}
			}
		});

		const totalCount = applications.length;

		const getStatusRank = (status: ConcessionApplicationStatusType): number => {
			switch (status) {
				case "Pending":
					return 1;
				case "Approved":
					return 2;
				case "Rejected":
					return 3;
				default:
					return 4;
			}
		};

		const sortedApplications = applications.sort((a, b) => {
			const rankA = getStatusRank(a.status);
			const rankB = getStatusRank(b.status);

			if (rankA !== rankB) {
				return rankA - rankB;
			}

			const timeA = new Date(a.createdAt).getTime();
			const timeB = new Date(b.createdAt).getTime();

			if (a.status === "Pending") {
				if (timeA !== timeB) {
					return timeA - timeB;
				}
				return a.shortId - b.shortId;
			}

			if (timeA !== timeB) {
				return timeB - timeA;
			}

			return b.shortId - a.shortId;
		});

		const totalPages = Math.ceil(totalCount / params.pageSize);
		const skip = (params.page - 1) * params.pageSize;
		const hasNextPage = params.page < totalPages;
		const hasPreviousPage = params.page > 1;

		const paginatedApplications = sortedApplications.slice(skip, skip + params.pageSize);

		const result: PaginatedResult<AdminApplication> = {
			totalCount,
			totalPages,
			hasNextPage,
			hasPreviousPage,
			currentPage: params.page,
			data: paginatedApplications
		};

		return success(result);
	} catch (error) {
		console.error("Error while fetching applications:", error);
		return failure(databaseError("Failed to fetch applications"));
	}
};

export const submitConcessionApplication = async (
	data: ConcessionApplicationData
): Promise<Result<Concession, AuthError | DatabaseError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const targetStudentId = studentResult.data.studentId;

		const existingApplication = await prisma.concessionApplication.findFirst({
			where: {
				studentId: targetStudentId
			},
			orderBy: {
				createdAt: "desc"
			}
		});

		let application: Concession;

		if (!existingApplication || existingApplication.status === "Approved") {
			application = await prisma.concessionApplication.create({
				data: {
					status: "Pending",
					submissionCount: 1,
					studentId: targetStudentId,
					stationId: data.stationId,
					applicationType: data.applicationType,
					concessionClassId: data.concessionClassId,
					concessionPeriodId: data.concessionPeriodId,
					previousApplicationId: data.previousApplicationId
				},
				select: {
					id: true,
					status: true,
					shortId: true,
					createdAt: true,
					reviewedAt: true,
					applicationType: true,
					rejectionReason: true,
					submissionCount: true,
					station: {
						select: {
							id: true,
							code: true,
							name: true
						}
					},
					concessionClass: {
						select: {
							id: true,
							code: true,
							name: true
						}
					},
					concessionPeriod: {
						select: {
							id: true,
							name: true,
							duration: true
						}
					},
					previousApplication: {
						select: {
							id: true,
							status: true,
							shortId: true,
							createdAt: true,
							reviewedAt: true,
							applicationType: true,
							rejectionReason: true,
							submissionCount: true,
							station: {
								select: {
									id: true,
									code: true,
									name: true
								}
							},
							concessionClass: {
								select: {
									id: true,
									code: true,
									name: true
								}
							},
							concessionPeriod: {
								select: {
									id: true,
									name: true,
									duration: true
								}
							}
						}
					}
				}
			});
		} else {
			application = await prisma.concessionApplication.update({
				where: {
					id: existingApplication.id
				},
				data: {
					status: "Pending",
					reviewedAt: null,
					reviewedById: null,
					rejectionReason: null,
					stationId: data.stationId,
					concessionClassId: data.concessionClassId,
					concessionPeriodId: data.concessionPeriodId,
					submissionCount: { increment: 1 }
				},
				select: {
					id: true,
					status: true,
					shortId: true,
					createdAt: true,
					reviewedAt: true,
					applicationType: true,
					rejectionReason: true,
					submissionCount: true,
					station: {
						select: {
							id: true,
							code: true,
							name: true
						}
					},
					concessionClass: {
						select: {
							id: true,
							code: true,
							name: true
						}
					},
					concessionPeriod: {
						select: {
							id: true,
							name: true,
							duration: true
						}
					},
					previousApplication: {
						select: {
							id: true,
							status: true,
							shortId: true,
							createdAt: true,
							reviewedAt: true,
							applicationType: true,
							rejectionReason: true,
							submissionCount: true,
							station: {
								select: {
									id: true,
									code: true,
									name: true
								}
							},
							concessionClass: {
								select: {
									id: true,
									code: true,
									name: true
								}
							},
							concessionPeriod: {
								select: {
									id: true,
									name: true,
									duration: true
								}
							}
						}
					}
				}
			});
		}

		revalidatePath("/dashboard/student");

		return success(application);
	} catch (error) {
		console.error("Error while submitting application:", error);
		return failure(databaseError("Failed to submit application"));
	}
};

export const submitConcessionResubmission = async (
	applicationId: string,
	data: Omit<ConcessionApplicationData, "studentId">
): Promise<Result<Concession, AuthError | DatabaseError | ValidationError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const existingApplication = await prisma.concessionApplication.findUnique({
			where: { id: applicationId },
			include: { student: true }
		});

		if (!existingApplication) {
			return failure(validationError("Application not found", "applicationId"));
		}

		if (existingApplication.studentId !== studentResult.data.studentId) {
			return failure(authError("Unauthorized access to application", "FORBIDDEN"));
		}

		if (existingApplication.status !== "Rejected") {
			return failure(validationError("Only rejected applications can be resubmitted", "status"));
		}

		if (existingApplication.student.status !== "Approved") {
			return failure(authError("Student is not approved"));
		}

		const updatedApplication = await prisma.concessionApplication.update({
			where: { id: applicationId },
			data: {
				status: "Pending",
				reviewedAt: null,
				reviewedById: null,
				rejectionReason: null,
				stationId: data.stationId,
				submissionCount: { increment: 1 },
				concessionClassId: data.concessionClassId,
				concessionPeriodId: data.concessionPeriodId
			},
			select: {
				id: true,
				status: true,
				shortId: true,
				createdAt: true,
				reviewedAt: true,
				applicationType: true,
				rejectionReason: true,
				submissionCount: true,
				station: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionClass: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionPeriod: {
					select: {
						id: true,
						name: true,
						duration: true
					}
				},
				previousApplication: {
					select: {
						id: true,
						status: true,
						shortId: true,
						createdAt: true,
						reviewedAt: true,
						applicationType: true,
						rejectionReason: true,
						submissionCount: true,
						station: {
							select: {
								id: true,
								code: true,
								name: true
							}
						},
						concessionClass: {
							select: {
								id: true,
								code: true,
								name: true
							}
						},
						concessionPeriod: {
							select: {
								id: true,
								name: true,
								duration: true
							}
						}
					}
				}
			}
		});

		revalidatePath("/dashboard/student");

		return success(updatedApplication);
	} catch (error) {
		console.error("Error while resubmitting application:", error);
		return failure(databaseError("Failed to resubmit application"));
	}
};

export const reviewConcessionApplication = async (
	applicationId: string,
	status: "Approved" | "Rejected",
	rejectionReason?: string
): Promise<Result<ConcessionApplication, DatabaseError | ValidationError | AuthError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		if (status === "Rejected" && (!rejectionReason || !rejectionReason.trim())) {
			return failure(validationError("Rejection reason is required when rejecting", "rejectionReason"));
		}

		const application = await prisma.concessionApplication.findUnique({
			where: { id: applicationId }
		});

		if (!application) {
			return failure(validationError("Application not found", "applicationId"));
		}

		if (application.status !== "Pending") {
			return failure(validationError("Application has already been reviewed", "status"));
		}

		const updatedApplication = await prisma.concessionApplication.update({
			where: { id: applicationId },
			data: {
				status,
				reviewedById: adminResult.data.userId,
				reviewedAt: new Date(),
				rejectionReason: status === "Rejected" ? rejectionReason?.trim() : null
			}
		});

		sendConcessionNotification(
			application.studentId,
			applicationId,
			status === "Approved",
			application.applicationType,
			rejectionReason
		).catch((error) => {
			console.error("Failed to send concession notification:", error);
		});

		revalidatePath("/dashboard/admin");

		return success(updatedApplication);
	} catch (error) {
		console.error("Error reviewing concession application:", error);
		return failure(databaseError("Failed to review application"));
	}
};

export const assignBookletToConcession = async (
	applicationId: string,
	bookletId: string,
	pageOffset: number
): Promise<Result<ConcessionApplication, DatabaseError | ValidationError | AuthError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const verifiedAdminId = adminResult.data.userId;

		const result = await prisma.$transaction(async (tx) => {
			const application = await tx.concessionApplication.findUnique({
				where: { id: applicationId }
			});

			if (!application) {
				throw new Error("Application not found");
			}

			if (application.status !== "Approved" && application.status !== "Pending") {
				throw new Error("Only approved applications can be assigned a booklet");
			}

			if (application.concessionBookletId) {
				throw new Error("Booklet is already assigned to this application");
			}

			const booklet = await tx.concessionBooklet.findUnique({
				where: { id: bookletId },
				include: {
					applications: {
						select: {
							pageOffset: true
						}
					}
				}
			});

			if (!booklet) {
				throw new Error("Booklet not found");
			}

			if (!["InUse", "Available"].includes(booklet.status)) {
				throw new Error("Booklet is not available for use");
			}

			if (pageOffset < 0 || pageOffset >= booklet.totalPages) {
				throw new Error(`Page offset must be between 0 and ${booklet.totalPages - 1}`);
			}

			const assignedOffsets = new Set<number>();
			for (const app of booklet.applications) {
				if (app.pageOffset !== null && app.pageOffset !== undefined) {
					assignedOffsets.add(app.pageOffset);
				}
			}

			if (assignedOffsets.has(pageOffset)) {
				throw new Error("Slip number is already assigned in this booklet");
			}

			const updatedApplication = await tx.concessionApplication.update({
				where: { id: applicationId },
				data: {
					status: "Approved",
					reviewedAt: new Date(),
					pageOffset: pageOffset,
					reviewedById: verifiedAdminId,
					concessionBookletId: bookletId
				}
			});

			const newAssignedCount = assignedOffsets.size + 1;
			const newBookletStatus = newAssignedCount >= booklet.totalPages ? "Exhausted" : "InUse";

			await tx.concessionBooklet.update({
				where: { id: bookletId },
				data: {
					status: newBookletStatus
				}
			});

			return updatedApplication;
		});

		revalidatePath("/dashboard/admin");
		revalidatePath(`/dashboard/admin/booklets/${bookletId}`);

		return success(result);
	} catch (error) {
		console.error("Error assigning booklet to concession:", error);

		if (error instanceof Error) {
			const errorMessage = error.message;

			if (
				errorMessage.includes("already assigned") ||
				errorMessage.includes("already been reviewed") ||
				errorMessage.includes("exhausted") ||
				errorMessage.includes("out of bounds")
			) {
				return failure(validationError(errorMessage, "pageOffset"));
			}

			if (errorMessage.includes("not found")) {
				return failure(validationError(errorMessage, "applicationId"));
			}
		}

		if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
			const errorMessage = `Page offset ${pageOffset} is already assigned in this booklet`;
			return failure(validationError(errorMessage, "pageOffset"));
		}

		return failure(databaseError("Failed to assign booklet"));
	}
};

export const approveConcessionWithBooklet = async (
	applicationId: string,
	bookletId: string,
	pageOffset: number
): Promise<Result<ConcessionApplication, DatabaseError | ValidationError | AuthError>> => {
	return assignBookletToConcession(applicationId, bookletId, pageOffset);
};

export const getConcessionApplicationDetails = async (
	applicationId: string
): Promise<
	Result<
		AdminApplication & {
			rejectionReason: string | null;
			submissionCount: number;
		},
		AuthError | DatabaseError | ValidationError
	>
> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const application = await prisma.concessionApplication.findUnique({
			where: { id: applicationId },
			select: {
				id: true,
				status: true,
				shortId: true,
				createdAt: true,
				reviewedAt: true,
				pageOffset: true,
				applicationType: true,
				rejectionReason: true,
				submissionCount: true,
				concessionBookletId: true,
				student: {
					select: {
						lastName: true,
						firstName: true,
						middleName: true,
						user: {
							select: {
								email: true
							}
						}
					}
				},
				station: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionClass: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionPeriod: {
					select: {
						id: true,
						name: true,
						duration: true
					}
				},
				reviewedBy: {
					select: {
						user: {
							select: {
								name: true
							}
						}
					}
				}
			}
		});

		if (!application) {
			return failure(validationError("Application not found", "applicationId"));
		}

		return success(application);
	} catch (error) {
		console.error("Error fetching application details:", error);
		return failure(databaseError("Failed to fetch application details"));
	}
};

export type StudentConcessionHistoryItem = Pick<
	ConcessionApplication,
	| "id"
	| "status"
	| "shortId"
	| "createdAt"
	| "reviewedAt"
	| "pageOffset"
	| "applicationType"
	| "rejectionReason"
	| "submissionCount"
> & {
	derivedCertificateNo?: string;
	station: Pick<Station, "id" | "code" | "name">;
	concessionClass: Pick<ConcessionClass, "id" | "code" | "name">;
	concessionPeriod: Pick<ConcessionPeriod, "id" | "name" | "duration">;
	concessionBooklet?: {
		serialStartNumber: string;
	} | null;
	reviewedBy?: {
		user: {
			name: string | null;
		};
	} | null;
};

export const getStudentConcessionHistory = async (
	adminId: string,
	studentUserId: string
): Promise<Result<StudentConcessionHistoryItem[], AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const applications = await prisma.concessionApplication.findMany({
			where: { studentId: studentUserId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				status: true,
				shortId: true,
				createdAt: true,
				reviewedAt: true,
				pageOffset: true,
				applicationType: true,
				rejectionReason: true,
				submissionCount: true,
				station: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionClass: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				concessionPeriod: {
					select: {
						id: true,
						name: true,
						duration: true
					}
				},
				concessionBooklet: {
					select: {
						serialStartNumber: true
					}
				},
				reviewedBy: {
					select: {
						user: {
							select: {
								name: true
							}
						}
					}
				}
			}
		});

		const itemsWithCertificate: StudentConcessionHistoryItem[] = applications.map((app) => {
			let derivedCertificateNo: string | undefined;

			if (app.concessionBooklet && app.pageOffset !== null && app.pageOffset !== undefined) {
				const serialStart = app.concessionBooklet.serialStartNumber;
				const prefix = serialStart.replace(/\d+$/, "");
				const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
				const certificateNum = startNum + app.pageOffset;
				derivedCertificateNo = `${prefix}${certificateNum
					.toString()
					.padStart(serialStart.match(/\d+$/)?.[0]?.length || 3, "0")}`;
			}

			return {
				...app,
				derivedCertificateNo
			};
		});

		return success(itemsWithCertificate);
	} catch (error) {
		console.error("Error fetching student concession history:", error);
		return failure(databaseError("Failed to fetch student concession history"));
	}
};
