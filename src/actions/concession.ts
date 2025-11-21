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
import type { Prisma } from "@/generated/prisma";
import { calculateBookletStatus } from "@/lib/utils";
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
	studentId: string,
	params: PaginationParams
): Promise<Result<PaginatedResult<Concession>, AuthError | DatabaseError>> => {
	try {
		const student = await prisma.student.findUnique({
			select: { status: true },
			where: { userId: studentId }
		});

		if (!student) {
			return failure(authError("Student not found"));
		}

		if (student.status !== "Approved") {
			return failure(authError("Student is not approved"));
		}

		const whereClause: Prisma.ConcessionApplicationWhereInput = { studentId };

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

export const getLastApplication = async (studentId: string): Promise<Result<Concession, AuthError | DatabaseError>> => {
	try {
		const student = await prisma.student.findUnique({
			select: { status: true },
			where: { userId: studentId }
		});

		if (!student) {
			return failure(authError("Student not found"));
		}

		if (student.status !== "Approved") {
			return failure(authError("Student is not approved"));
		}

		const lastApplication = await prisma.concessionApplication.findFirst({
			where: { studentId },
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
	"id" | "status" | "shortId" | "createdAt" | "reviewedAt" | "applicationType" | "rejectionReason" | "submissionCount"
> & {
	student: {
		lastName: string;
		firstName: string;
		middleName: string;
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
	try {
		const admin = await prisma.admin.findUnique({
			select: { isActive: true },
			where: { userId: adminId }
		});

		if (!admin) {
			return failure(authError("Admin not found"));
		}

		if (!admin.isActive) {
			return failure(authError("Admin is not active"));
		}

		const whereClause: Prisma.ConcessionApplicationWhereInput = {};

		if (params.statusFilter && params.statusFilter !== "all") {
			whereClause.status = params.statusFilter;
		}

		if (params.typeFilter && params.typeFilter !== "all") {
			whereClause.applicationType = params.typeFilter;
		}

		if (params.searchQuery && params.searchQuery.trim()) {
			const searchTerm = params.searchQuery.trim();
			if (/^\d+$/.test(searchTerm)) {
				whereClause.shortId = parseInt(searchTerm);
			}
		}

		const totalCount = await prisma.concessionApplication.count({
			where: whereClause
		});

		const totalPages = Math.ceil(totalCount / params.pageSize);
		const skip = (params.page - 1) * params.pageSize;
		const hasNextPage = params.page < totalPages;
		const hasPreviousPage = params.page > 1;

		const applications = await prisma.concessionApplication.findMany({
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

		const result: PaginatedResult<AdminApplication> = {
			totalCount,
			totalPages,
			hasNextPage,
			hasPreviousPage,
			data: applications,
			currentPage: params.page
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
	try {
		const student = await prisma.student.findUnique({
			select: { status: true },
			where: { userId: data.studentId }
		});

		if (!student) {
			return failure(authError("Student not found"));
		}

		if (student.status !== "Approved") {
			return failure(authError("Student is not approved"));
		}

		const existingApplication = await prisma.concessionApplication.findFirst({
			where: {
				studentId: data.studentId
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
					studentId: data.studentId,
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
	try {
		const existingApplication = await prisma.concessionApplication.findUnique({
			where: { id: applicationId },
			include: { student: true }
		});

		if (!existingApplication) {
			return failure(validationError("Application not found", "applicationId"));
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
	adminId: string,
	status: "Approved" | "Rejected",
	rejectionReason?: string
): Promise<Result<ConcessionApplication, DatabaseError | ValidationError | AuthError>> => {
	try {
		if (status === "Rejected" && (!rejectionReason || !rejectionReason.trim())) {
			return failure(validationError("Rejection reason is required when rejecting", "rejectionReason"));
		}

		const admin = await prisma.admin.findUnique({
			where: { userId: adminId },
			select: { isActive: true }
		});

		if (!admin) {
			return failure(authError("Admin not found"));
		}

		if (!admin.isActive) {
			return failure(authError("Admin account is not active"));
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
				reviewedById: adminId,
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

export const approveConcessionWithBooklet = async (
	applicationId: string,
	adminId: string,
	bookletId: string
): Promise<Result<ConcessionApplication, DatabaseError | ValidationError | AuthError>> => {
	try {
		const admin = await prisma.admin.findUnique({
			where: { userId: adminId },
			select: { isActive: true }
		});

		if (!admin) {
			return failure(authError("Admin not found"));
		}

		if (!admin.isActive) {
			return failure(authError("Admin account is not active"));
		}
		const application = await prisma.concessionApplication.findUnique({
			where: { id: applicationId }
		});

		if (!application) {
			throw new Error("Application not found");
		}

		if (application.status !== "Pending") {
			throw new Error("Application has already been reviewed");
		}

		const result = await prisma.$transaction(async (tx) => {
			const booklet = await tx.concessionBooklet.findUnique({
				where: { id: bookletId },
				include: {
					_count: {
						select: {
							applications: true
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

			const currentApplicationCount = booklet._count.applications;
			const damagedPages = Array.isArray(booklet.damagedPages) ? booklet.damagedPages : [];

			let nextPage = currentApplicationCount;
			while (damagedPages.includes(nextPage) && nextPage < booklet.totalPages) {
				nextPage++;
			}

			if (nextPage >= booklet.totalPages) {
				throw new Error("Booklet is full");
			}

			const updatedApplication = await tx.concessionApplication.update({
				where: { id: applicationId },
				data: {
					status: "Approved",
					pageOffset: nextPage,
					reviewedById: adminId,
					reviewedAt: new Date(),
					concessionBookletId: bookletId
				}
			});

			const newApplicationCount = currentApplicationCount + 1;
			const damagedPagesCount = damagedPages.length;
			const isManuallyDamaged = booklet.status === "Damaged";

			const newBookletStatus = calculateBookletStatus(
				newApplicationCount,
				damagedPagesCount,
				booklet.totalPages,
				isManuallyDamaged
			);

			await tx.concessionBooklet.update({
				where: { id: bookletId },
				data: {
					status: newBookletStatus
				}
			});

			return updatedApplication;
		});

		sendConcessionNotification(result.studentId, applicationId, true, application.applicationType, undefined).catch(
			(error) => {
				console.error("Failed to send concession approval notification:", error);
			}
		);

		revalidatePath("/dashboard/admin");
		return success(result);
	} catch (error) {
		console.error("Error approving concession with booklet:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to approve application";

		if (errorMessage.includes("not found")) {
			return failure(validationError(errorMessage, "applicationId"));
		}
		if (errorMessage.includes("already been reviewed")) {
			return failure(validationError(errorMessage, "status"));
		}
		if (errorMessage.includes("not available") || errorMessage.includes("full")) {
			return failure(validationError(errorMessage, "bookletId"));
		}

		return failure(databaseError("Failed to approve application"));
	}
};

export const getConcessionApplicationDetails = async (
	applicationId: string
): Promise<
	Result<
		AdminApplication & {
			rejectionReason: string | null;
			submissionCount: number;
		},
		DatabaseError | ValidationError
	>
> => {
	try {
		const application = await prisma.concessionApplication.findUnique({
			where: { id: applicationId },
			select: {
				id: true,
				status: true,
				shortId: true,
				createdAt: true,
				reviewedAt: true,
				applicationType: true,
				rejectionReason: true,
				submissionCount: true,
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
