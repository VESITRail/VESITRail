"use server";

import {
	Student,
	Station,
	ConcessionPeriod,
	ConcessionBooklet,
	ConcessionApplication,
	ConcessionBookletStatusType
} from "@/generated/zod";
import {
	Result,
	success,
	failure,
	AuthError,
	databaseError,
	DatabaseError,
	validationError,
	ValidationError
} from "@/lib/result";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import type { Prisma } from "@/generated/prisma/client";
import { calculateSerialEndNumber, calculateBookletStatus } from "@/lib/utils";

export type CreateBookletInput = {
	anchorX: number;
	anchorY: number;
	serialStartNumber: string;
};

export type UpdateBookletInput = {
	anchorX: number;
	anchorY: number;
	isExhausted: boolean;
	serialStartNumber: string;
};

export type BookletItem = ConcessionBooklet & {
	_count: {
		applications: number;
	};
};

export type PaginatedBookletsResult = {
	totalCount: number;
	totalPages: number;
	currentPage: number;
	data: BookletItem[];
	hasNextPage: boolean;
	hasPreviousPage: boolean;
};

export type BookletPaginationParams = {
	page: number;
	pageSize: number;
	searchQuery?: string;
	statusFilter?: ConcessionBookletStatusType | "all";
};

export type BookletApplicationItem = Pick<
	ConcessionApplication,
	"id" | "createdAt" | "status" | "applicationType" | "pageOffset"
> & {
	derivedSerialNumber?: number;
	derivedCertificateNo?: string;
	station: Pick<Station, "name" | "code">;
	concessionPeriod: Pick<ConcessionPeriod, "name" | "duration">;
	student: Pick<Student, "gender" | "address" | "lastName" | "firstName" | "middleName" | "dateOfBirth">;
	previousApplication?:
		| (Pick<ConcessionApplication, "id" | "pageOffset"> & {
				concessionBooklet?: Pick<ConcessionBooklet, "serialStartNumber"> | null;
		  })
		| null;
};

export type DamagedPageItem = {
	id: string;
	isDamaged: true;
	pageNumber: number;
	serialNumber: string;
};

export type BookletTableItem = BookletApplicationItem | DamagedPageItem;

export type BookletApplicationsResult = {
	totalCount: number;
	data: BookletTableItem[];
	booklet: Pick<
		ConcessionBooklet,
		"id" | "status" | "totalPages" | "bookletNumber" | "serialEndNumber" | "serialStartNumber"
	> & {
		_count: {
			applications: number;
		};
	};
};

export type PaginatedBookletApplicationsResult = BookletApplicationsResult;

export type AvailableBooklet = Pick<
	ConcessionBooklet,
	"id" | "status" | "totalPages" | "bookletNumber" | "serialStartNumber" | "serialEndNumber"
> & {
	_count: {
		applications: number;
	};
	lastUsedAt?: Date | null;
};

export const createBooklet = async (
	data: CreateBookletInput
): Promise<Result<BookletItem, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const serialStartNumber = data.serialStartNumber.toUpperCase().replace(/\s+/g, "");

		if (!serialStartNumber) {
			return failure(validationError("Serial start number is required"));
		}

		if (!/^[A-Z]+\d+$/.test(serialStartNumber)) {
			return failure(validationError("Serial number must contain letters followed by numbers (e.g., A0807550)"));
		}

		const existingBooklet = await prisma.concessionBooklet.findFirst({
			where: {
				serialStartNumber
			}
		});

		if (existingBooklet) {
			return failure(validationError("A booklet with this serial start number already exists"));
		}

		const totalPages = 50;
		const serialEndNumber = calculateSerialEndNumber(serialStartNumber, totalPages);

		const booklet = await prisma.concessionBooklet.create({
			data: {
				totalPages,
				serialEndNumber,
				serialStartNumber,
				status: "Available",
				anchorX: data.anchorX,
				anchorY: data.anchorY
			},
			include: {
				_count: {
					select: {
						applications: true
					}
				}
			}
		});

		revalidatePath("/dashboard/admin/booklets");
		return success(booklet);
	} catch (error) {
		console.error("Error creating booklet:", error);
		return failure(databaseError("Failed to create booklet"));
	}
};

export const getBooklets = async (
	params: BookletPaginationParams
): Promise<Result<PaginatedBookletsResult, AuthError | DatabaseError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const { page, pageSize, statusFilter, searchQuery } = params;
		const skip = (page - 1) * pageSize;

		const whereClause: Prisma.ConcessionBookletWhereInput = {};

		if (statusFilter && statusFilter !== "all") {
			whereClause.status = statusFilter;
		}

		if (searchQuery && searchQuery.trim()) {
			const searchTerm = searchQuery.trim();
			whereClause.OR = [
				{
					serialStartNumber: {
						contains: searchTerm,
						mode: "insensitive" as const
					}
				},
				{
					serialEndNumber: {
						contains: searchTerm,
						mode: "insensitive" as const
					}
				},
				{
					bookletNumber: isNaN(Number(searchTerm))
						? undefined
						: {
								equals: Number(searchTerm)
							}
				}
			].filter(Boolean);
		}

		const booklets = await prisma.concessionBooklet.findMany({
			where: whereClause,
			include: {
				_count: {
					select: {
						applications: true
					}
				},
				applications: {
					select: {
						createdAt: true
					},
					orderBy: {
						createdAt: "desc"
					},
					take: 1
				}
			}
		});

		const totalCount = booklets.length;

		const getStatusRank = (status: ConcessionBookletStatusType): number => {
			switch (status) {
				case "InUse":
					return 1;
				case "Available":
					return 2;
				case "Exhausted":
					return 3;
				default:
					return 5;
			}
		};

		const sortedBooklets = booklets.sort((a, b) => {
			const rankA = getStatusRank(a.status);
			const rankB = getStatusRank(b.status);

			if (rankA !== rankB) {
				return rankA - rankB;
			}

			const lastUsedA = a.applications[0]?.createdAt
				? new Date(a.applications[0].createdAt).getTime()
				: new Date(a.updatedAt).getTime();
			const lastUsedB = b.applications[0]?.createdAt
				? new Date(b.applications[0].createdAt).getTime()
				: new Date(b.updatedAt).getTime();

			if (a.status === "InUse" || a.status === "Exhausted") {
				if (lastUsedA !== lastUsedB) {
					return lastUsedB - lastUsedA;
				}
				return b.bookletNumber - a.bookletNumber;
			}

			return b.bookletNumber - a.bookletNumber;
		});

		const totalPages = Math.ceil(totalCount / pageSize);
		const hasNextPage = page < totalPages;
		const hasPreviousPage = page > 1;

		const paginatedBooklets = sortedBooklets.slice(skip, skip + pageSize).map(({ applications, ...rest }) => ({
			...rest,
			lastUsedAt: applications[0]?.createdAt || null
		}));

		return success({
			totalCount,
			totalPages,
			hasNextPage,
			hasPreviousPage,
			currentPage: page,
			data: paginatedBooklets
		});
	} catch (error) {
		console.error("Error fetching booklets:", error);
		return failure(databaseError("Failed to fetch booklets"));
	}
};

export const deleteBooklet = async (
	bookletId: string
): Promise<Result<{ success: boolean }, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const booklet = await prisma.concessionBooklet.findUnique({
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
			return failure(validationError("Booklet not found"));
		}

		if (booklet._count.applications > 0) {
			return failure(validationError("Cannot delete booklet that has applications"));
		}

		await prisma.concessionBooklet.delete({
			where: { id: bookletId }
		});

		revalidatePath("/dashboard/admin/booklets");
		return success({ success: true });
	} catch (error) {
		console.error("Error deleting booklet:", error);
		return failure(databaseError("Failed to delete booklet"));
	}
};

export const updateBooklet = async (
	bookletId: string,
	data: UpdateBookletInput
): Promise<Result<BookletItem, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const existingBooklet = await prisma.concessionBooklet.findUnique({
			where: { id: bookletId },
			include: {
				_count: {
					select: {
						applications: true
					}
				}
			}
		});

		if (!existingBooklet) {
			return failure(validationError("Booklet not found"));
		}

		const serialPattern = /^[A-Z]\d+$/;
		if (!serialPattern.test(data.serialStartNumber)) {
			return failure(validationError("Invalid serial format. Use one letter followed by numbers (e.g., A0807551)"));
		}

		const serialEndNumber = calculateSerialEndNumber(data.serialStartNumber, 50);

		const duplicateBooklet = await prisma.concessionBooklet.findFirst({
			where: {
				AND: [
					{ id: { not: bookletId } },
					{
						OR: [
							{ serialEndNumber: serialEndNumber },
							{ serialStartNumber: data.serialStartNumber },
							{
								AND: [
									{ serialEndNumber: { gte: data.serialStartNumber } },
									{ serialStartNumber: { lte: data.serialStartNumber } }
								]
							},
							{
								AND: [{ serialEndNumber: { gte: serialEndNumber } }, { serialStartNumber: { lte: serialEndNumber } }]
							}
						]
					}
				]
			}
		});

		if (duplicateBooklet) {
			return failure(validationError("Serial number range overlaps with existing booklet"));
		}

		const updatedBooklet = await prisma.$transaction(async (tx) => {
			const remainingAppCount = await tx.concessionApplication.count({
				where: { concessionBookletId: bookletId }
			});

			const isAutoExhausted = remainingAppCount >= 50;
			const newStatus = calculateBookletStatus(remainingAppCount, 50, data.isExhausted || isAutoExhausted);

			const updateData: Prisma.ConcessionBookletUpdateInput = {
				status: newStatus,
				anchorX: data.anchorX,
				anchorY: data.anchorY,
				serialEndNumber: serialEndNumber,
				serialStartNumber: data.serialStartNumber
			};

			return await tx.concessionBooklet.update({
				data: updateData,
				where: { id: bookletId },
				include: {
					_count: {
						select: {
							applications: true
						}
					}
				}
			});
		});

		revalidatePath("/dashboard/admin/booklets");
		revalidatePath("/dashboard/admin");
		return success(updatedBooklet);
	} catch (error) {
		console.error("Error updating booklet:", error);
		return failure(databaseError("Failed to update booklet"));
	}
};

export const getBooklet = async (
	bookletId: string
): Promise<Result<BookletItem, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const booklet = await prisma.concessionBooklet.findUnique({
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
			return failure(validationError("Booklet not found"));
		}

		return success(booklet);
	} catch (error) {
		console.error("Error fetching booklet:", error);
		return failure(databaseError("Failed to fetch booklet"));
	}
};

export const getBookletApplications = async (
	bookletId: string
): Promise<Result<BookletApplicationsResult, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const booklet = await prisma.concessionBooklet.findUnique({
			where: { id: bookletId },
			select: {
				id: true,
				status: true,
				totalPages: true,
				bookletNumber: true,
				serialEndNumber: true,
				serialStartNumber: true,
				_count: {
					select: {
						applications: true
					}
				}
			}
		});

		if (!booklet) {
			return failure(validationError("Booklet not found"));
		}

		const whereClause = {
			concessionBookletId: bookletId
		};

		const applications = await prisma.concessionApplication.findMany({
			where: whereClause,
			orderBy: { createdAt: "asc" },
			select: {
				id: true,
				status: true,
				createdAt: true,
				pageOffset: true,
				applicationType: true,
				student: {
					select: {
						gender: true,
						address: true,
						lastName: true,
						firstName: true,
						middleName: true,
						dateOfBirth: true
					}
				},
				station: {
					select: {
						name: true,
						code: true
					}
				},
				concessionPeriod: {
					select: {
						name: true,
						duration: true
					}
				},
				previousApplication: {
					select: {
						id: true,
						pageOffset: true,
						concessionBooklet: {
							select: {
								serialStartNumber: true
							}
						}
					}
				}
			}
		});

		const applicationsWithDerivedData: BookletApplicationItem[] = applications.map((app) => {
			const actualPageOffset = app.pageOffset ?? 0;

			const serialStart = booklet.serialStartNumber;
			const prefix = serialStart.replace(/\d+$/, "");
			const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
			const certificateNum = startNum + actualPageOffset;
			const derivedCertificateNo = `${prefix}${certificateNum
				.toString()
				.padStart(serialStart.match(/\d+$/)?.[0]?.length || 3, "0")}`;

			return {
				id: app.id,
				status: app.status,
				station: app.station,
				derivedCertificateNo,
				student: app.student,
				createdAt: app.createdAt,
				pageOffset: app.pageOffset,
				applicationType: app.applicationType,
				concessionPeriod: app.concessionPeriod,
				derivedSerialNumber: actualPageOffset + 1,
				previousApplication: app.previousApplication
			};
		});

		const assignedOffsets = new Set(
			applicationsWithDerivedData
				.filter((app) => app.pageOffset !== null && app.pageOffset !== undefined)
				.map((app) => app.pageOffset!)
		);

		const isExhausted = booklet.status === "Exhausted";
		const maxAssignedOffset = assignedOffsets.size > 0 ? Math.max(...assignedOffsets) : -1;

		const upperBound = isExhausted ? booklet.totalPages - 1 : maxAssignedOffset;

		const damagedPageItems: DamagedPageItem[] = [];
		for (let i = 0; i <= upperBound; i++) {
			if (!assignedOffsets.has(i)) {
				const serialStart = booklet.serialStartNumber;
				const prefix = serialStart.replace(/\d+$/, "");
				const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
				const certificateNum = startNum + i;
				const serialNumber = `${prefix}${certificateNum
					.toString()
					.padStart(serialStart.match(/\d+$/)?.[0]?.length || 3, "0")}`;

				damagedPageItems.push({
					serialNumber,
					pageNumber: i + 1,
					isDamaged: true as const,
					id: `damaged-${booklet.id}-${i}`
				});
			}
		}

		const allItems: BookletTableItem[] = [...applicationsWithDerivedData, ...damagedPageItems].sort((a, b) => {
			const pageA = "derivedSerialNumber" in a ? a.derivedSerialNumber || 0 : "pageNumber" in a ? a.pageNumber : 0;
			const pageB = "derivedSerialNumber" in b ? b.derivedSerialNumber || 0 : "pageNumber" in b ? b.pageNumber : 0;
			return pageA - pageB;
		});

		return success({
			booklet,
			data: allItems,
			totalCount: allItems.length
		});
	} catch (error) {
		console.error("Error fetching booklet applications:", error);
		return failure(databaseError("Failed to fetch booklet applications"));
	}
};

export const getAvailableBooklets = async (): Promise<Result<AvailableBooklet[], AuthError | DatabaseError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const booklets = await prisma.concessionBooklet.findMany({
			where: {
				status: {
					in: ["InUse", "Available"]
				}
			},
			select: {
				id: true,
				status: true,
				totalPages: true,
				bookletNumber: true,
				serialEndNumber: true,
				serialStartNumber: true,
				_count: {
					select: {
						applications: true
					}
				},
				applications: {
					select: {
						createdAt: true
					},
					orderBy: {
						createdAt: "desc"
					},
					take: 1
				}
			}
		});

		const sortedBooklets = booklets.sort((a, b) => {
			if (a.status === "InUse" && b.status === "Available") return -1;
			if (a.status === "Available" && b.status === "InUse") return 1;

			if (a.status === "InUse") {
				const lastUsedA = a.applications[0]?.createdAt ? new Date(a.applications[0].createdAt).getTime() : 0;
				const lastUsedB = b.applications[0]?.createdAt ? new Date(b.applications[0].createdAt).getTime() : 0;
				if (lastUsedA !== lastUsedB) {
					return lastUsedB - lastUsedA;
				}
			}

			if (a._count.applications !== b._count.applications) {
				return b._count.applications - a._count.applications;
			}

			return b.bookletNumber - a.bookletNumber;
		});

		const availableBooklets: AvailableBooklet[] = sortedBooklets.map((booklet) => ({
			id: booklet.id,
			status: booklet.status,
			_count: booklet._count,
			totalPages: booklet.totalPages,
			bookletNumber: booklet.bookletNumber,
			serialEndNumber: booklet.serialEndNumber,
			serialStartNumber: booklet.serialStartNumber,
			lastUsedAt: booklet.applications[0]?.createdAt || null
		}));

		return success(availableBooklets);
	} catch (error) {
		console.error("Error fetching available booklets:", error);
		return failure(databaseError("Failed to fetch available booklets"));
	}
};

export type AssignedPageStudent = {
	shortId: number;
	pageOffset: number;
	studentName: string;
	applicationId: string;
};

export const getBookletAssignedStudents = async (
	bookletId: string
): Promise<Result<Record<number, AssignedPageStudent>, AuthError | DatabaseError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const applications = await prisma.concessionApplication.findMany({
			where: {
				pageOffset: { not: null },
				concessionBookletId: bookletId
			},
			select: {
				id: true,
				shortId: true,
				pageOffset: true,
				student: {
					select: {
						firstName: true,
						lastName: true,
						middleName: true
					}
				}
			}
		});

		const map: Record<number, AssignedPageStudent> = {};
		for (const app of applications) {
			if (app.pageOffset !== null && app.pageOffset !== undefined) {
				const nameParts = [app.student.firstName, app.student.middleName, app.student.lastName].filter(Boolean);
				map[app.pageOffset] = {
					shortId: app.shortId,
					applicationId: app.id,
					pageOffset: app.pageOffset,
					studentName: nameParts.join(" ")
				};
			}
		}

		return success(map);
	} catch (error) {
		console.error("Error fetching assigned students for booklet:", error);
		return failure(databaseError("Failed to fetch assigned students"));
	}
};

export const recalculateBookletStatus = async (
	bookletId: string
): Promise<Result<BookletItem, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const booklet = await prisma.concessionBooklet.findUnique({
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
			return failure(validationError("Booklet not found"));
		}

		const applicationCount = booklet._count?.applications || 0;
		const isManuallyExhausted = booklet.status === "Exhausted";

		const newStatus = calculateBookletStatus(applicationCount, booklet.totalPages, isManuallyExhausted);

		if (newStatus === booklet.status) {
			return success(booklet);
		}

		const updatedBooklet = await prisma.concessionBooklet.update({
			where: { id: bookletId },
			data: {
				status: newStatus
			},
			include: {
				_count: {
					select: {
						applications: true
					}
				}
			}
		});

		revalidatePath("/dashboard/admin/booklets");
		return success(updatedBooklet);
	} catch (error) {
		console.error("Error recalculating booklet status:", error);
		return failure(databaseError("Failed to recalculate booklet status"));
	}
};

export const recalculateAllBookletStatuses = async (): Promise<
	Result<{ updated: number }, AuthError | DatabaseError>
> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const booklets = await prisma.concessionBooklet.findMany({
			include: {
				_count: {
					select: {
						applications: true
					}
				}
			}
		});

		let updatedCount = 0;

		for (const booklet of booklets) {
			const applicationCount = booklet._count?.applications || 0;
			const isManuallyExhausted = booklet.status === "Exhausted";

			const newStatus = calculateBookletStatus(applicationCount, booklet.totalPages, isManuallyExhausted);

			if (newStatus !== booklet.status) {
				await prisma.concessionBooklet.update({
					where: { id: booklet.id },
					data: {
						status: newStatus
					}
				});
				updatedCount++;
			}
		}

		revalidatePath("/dashboard/admin/booklets");
		return success({ updated: updatedCount });
	} catch (error) {
		console.error("Error recalculating all booklet statuses:", error);
		return failure(databaseError("Failed to recalculate booklet statuses"));
	}
};

export const updateBookletAnchorCoordinates = async (
	bookletId: string,
	anchorX: number,
	anchorY: number
): Promise<Result<BookletItem, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const booklet = await prisma.concessionBooklet.findUnique({
			where: { id: bookletId }
		});

		if (!booklet) {
			return failure(validationError("Booklet not found"));
		}

		if (anchorX < -50 || anchorX > 100) {
			return failure(validationError("Anchor X must be between -50 and 100"));
		}

		if (anchorY < -50 || anchorY > 100) {
			return failure(validationError("Anchor Y must be between -50 and 100"));
		}

		const updatedBooklet = await prisma.concessionBooklet.update({
			where: { id: bookletId },
			data: {
				anchorX,
				anchorY
			},
			include: {
				_count: {
					select: {
						applications: true
					}
				}
			}
		});

		revalidatePath("/dashboard/admin/booklets");
		return success(updatedBooklet);
	} catch (error) {
		console.error("Error updating booklet anchor coordinates:", error);
		return failure(databaseError("Failed to update anchor coordinates"));
	}
};
