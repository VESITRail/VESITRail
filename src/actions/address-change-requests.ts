"use server";

import {
	Result,
	success,
	failure,
	authError,
	AuthError,
	databaseError,
	DatabaseError,
	validationError,
	ValidationError
} from "@/lib/result";
import prisma from "@/lib/prisma";
import { deleteR2File } from "./r2";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import type { Prisma } from "@/generated/prisma/client";
import { sendAddressChangeNotification } from "@/lib/notifications";
import { AddressChange, AddressChangeStatusType } from "@/generated/zod";

export type AddressChangeRequestItem = Pick<
	AddressChange,
	| "id"
	| "status"
	| "createdAt"
	| "reviewedAt"
	| "newAddress"
	| "currentAddress"
	| "rejectionReason"
	| "submissionCount"
	| "verificationDocUrl"
> & {
	student: {
		userId: string;
		firstName: string;
		lastName: string | null;
		middleName: string | null;
		user: {
			id: string;
			name: string;
			email: string;
			image: string | null;
		};
		class: {
			id: string;
			code: string;
			year: {
				id: string;
				code: string;
				name: string;
			};
			branch: {
				id: string;
				code: string;
				name: string;
			};
		};
	};
	newStation: {
		id: string;
		code: string;
		name: string;
	};
	currentStation: {
		id: string;
		code: string;
		name: string;
	};
	reviewedBy?: {
		userId: string;
		user: {
			id: string;
			name: string;
			email: string;
			image: string | null;
		};
	} | null;
};

export type PaginatedAddressChangeRequestsResult = {
	totalCount: number;
	totalPages: number;
	currentPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	data: AddressChangeRequestItem[];
};

export type AddressChangeRequestPaginationParams = {
	page: number;
	pageSize: number;
	searchQuery?: string;
	statusFilter?: AddressChangeStatusType | "all";
};

export const getAddressChangeRequests = async (
	params: AddressChangeRequestPaginationParams
): Promise<Result<PaginatedAddressChangeRequestsResult, AuthError | DatabaseError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const { page, pageSize, statusFilter, searchQuery } = params;
		const skip = (page - 1) * pageSize;

		const whereClause: Prisma.AddressChangeWhereInput = {};

		if (statusFilter && statusFilter !== "all") {
			whereClause.status = statusFilter;
		}

		if (searchQuery && searchQuery.trim()) {
			const searchTerm = searchQuery.trim();
			const words = searchTerm.split(/\s+/).filter(Boolean);
			const cleanDigits = searchTerm.replace(/\D/g, "");
			const normalizedDigits =
				cleanDigits.length === 12 && cleanDigits.startsWith("91") ? cleanDigits.slice(2) : cleanDigits;

			const orConditions: Prisma.AddressChangeWhereInput[] = [
				{ newAddress: { contains: searchTerm, mode: "insensitive" } },
				{ currentAddress: { contains: searchTerm, mode: "insensitive" } },
				{ newStation: { name: { contains: searchTerm, mode: "insensitive" } } },
				{ newStation: { code: { contains: searchTerm, mode: "insensitive" } } },
				{ student: { lastName: { contains: searchTerm, mode: "insensitive" } } },
				{ student: { firstName: { contains: searchTerm, mode: "insensitive" } } },
				{ student: { middleName: { contains: searchTerm, mode: "insensitive" } } },
				{ currentStation: { name: { contains: searchTerm, mode: "insensitive" } } },
				{ currentStation: { code: { contains: searchTerm, mode: "insensitive" } } },
				{ student: { mobileNumber: { contains: searchTerm, mode: "insensitive" } } },
				{ student: { user: { name: { contains: searchTerm, mode: "insensitive" } } } },
				{ student: { user: { email: { contains: searchTerm, mode: "insensitive" } } } },
				{ student: { class: { code: { contains: searchTerm, mode: "insensitive" } } } }
			];

			if (normalizedDigits.length >= 3) {
				orConditions.push({
					student: {
						mobileNumber: { contains: normalizedDigits, mode: "insensitive" }
					}
				});
			}

			if (words.length > 1) {
				orConditions.push({
					student: {
						AND: words.map((word) => ({
							OR: [
								{ lastName: { contains: word, mode: "insensitive" } },
								{ firstName: { contains: word, mode: "insensitive" } },
								{ middleName: { contains: word, mode: "insensitive" } },
								{ user: { name: { contains: word, mode: "insensitive" } } }
							]
						}))
					}
				});

				orConditions.push({
					AND: words.map((rawWord) => {
						const word = rawWord.replace(/[(),]/g, "").trim() || rawWord;
						const wordDigits = word.replace(/\D/g, "");

						const fieldConditions: Prisma.AddressChangeWhereInput[] = [
							{ newAddress: { contains: word, mode: "insensitive" } },
							{ currentAddress: { contains: word, mode: "insensitive" } },
							{ newStation: { name: { contains: word, mode: "insensitive" } } },
							{ newStation: { code: { contains: word, mode: "insensitive" } } },
							{ student: { lastName: { contains: word, mode: "insensitive" } } },
							{ student: { firstName: { contains: word, mode: "insensitive" } } },
							{ student: { middleName: { contains: word, mode: "insensitive" } } },
							{ currentStation: { name: { contains: word, mode: "insensitive" } } },
							{ currentStation: { code: { contains: word, mode: "insensitive" } } },
							{ student: { user: { name: { contains: word, mode: "insensitive" } } } },
							{ student: { user: { email: { contains: word, mode: "insensitive" } } } },
							{ student: { class: { code: { contains: word, mode: "insensitive" } } } }
						];

						if (wordDigits.length >= 3) {
							fieldConditions.push({
								student: {
									mobileNumber: { contains: wordDigits, mode: "insensitive" }
								}
							});
						} else {
							fieldConditions.push({
								student: {
									mobileNumber: { contains: word, mode: "insensitive" }
								}
							});
						}

						return { OR: fieldConditions };
					})
				});
			}

			whereClause.OR = orConditions;
		}

		const [requests, totalCount] = await Promise.all([
			prisma.addressChange.findMany({
				skip,
				take: pageSize,
				where: whereClause,
				orderBy: {
					createdAt: "desc"
				},
				include: {
					student: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true
								}
							},
							class: {
								include: {
									year: {
										select: {
											id: true,
											code: true,
											name: true
										}
									},
									branch: {
										select: {
											id: true,
											code: true,
											name: true
										}
									}
								}
							}
						}
					},
					newStation: {
						select: {
							id: true,
							code: true,
							name: true
						}
					},
					currentStation: {
						select: {
							id: true,
							code: true,
							name: true
						}
					},
					reviewedBy: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true
								}
							}
						}
					}
				}
			}),
			prisma.addressChange.count({
				where: whereClause
			})
		]);

		const totalPages = Math.ceil(totalCount / pageSize);
		const hasNextPage = page < totalPages;
		const hasPreviousPage = page > 1;

		return success({
			totalCount,
			totalPages,
			hasNextPage,
			data: requests,
			hasPreviousPage,
			currentPage: page
		});
	} catch (error) {
		console.error("Error fetching address change requests:", error);
		return failure(databaseError("Failed to fetch address change requests"));
	}
};

export const reviewAddressChangeRequest = async (
	requestId: string,
	status: "Approved" | "Rejected",
	rejectionReason?: string
): Promise<Result<AddressChange, DatabaseError | ValidationError | AuthError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		if (status === "Rejected" && (!rejectionReason || !rejectionReason.trim())) {
			return failure(validationError("Rejection reason is required when rejecting", "rejectionReason"));
		}

		const verifiedAdminId = adminResult.data.userId;

		const addressChangeRequest = await prisma.addressChange.findUnique({
			where: { id: requestId },
			include: {
				student: true
			}
		});

		if (!addressChangeRequest) {
			return failure(validationError("Address change request not found", "requestId"));
		}

		if (addressChangeRequest.status !== "Pending") {
			return failure(validationError("Request has already been reviewed", "status"));
		}

		const result = await prisma.$transaction(async (tx) => {
			const updatedRequest = await tx.addressChange.update({
				where: { id: requestId },
				data: {
					status,
					reviewedAt: new Date(),
					reviewedById: verifiedAdminId,
					rejectionReason: status === "Rejected" ? rejectionReason?.trim() : null
				},
				include: {
					currentStation: {
						select: { name: true, code: true }
					},
					newStation: {
						select: { name: true, code: true }
					}
				}
			});

			if (status === "Approved") {
				const oldVerificationDocUrl = addressChangeRequest.student.verificationDocUrl;

				if (oldVerificationDocUrl) {
					const isR2Url = process.env.R2_PUBLIC_URL && oldVerificationDocUrl.startsWith(process.env.R2_PUBLIC_URL);
					const urlParts = oldVerificationDocUrl.split("/");
					const fileKey = urlParts[urlParts.length - 1];
					const isValidKey = /^[a-zA-Z0-9_-]+\.pdf$/.test(fileKey);

					if (isR2Url && isValidKey) {
						const deleteResult = await deleteR2File(fileKey);
						if (!deleteResult.isSuccess) {
							console.error("Failed to delete old verification document:", deleteResult.error);
						}
					} else {
						console.warn("Skipping R2 deletion for untrusted URL or invalid file key:", oldVerificationDocUrl);
					}
				}

				await tx.student.update({
					where: { userId: addressChangeRequest.studentId },
					data: {
						address: addressChangeRequest.newAddress,
						stationId: addressChangeRequest.newStationId,
						verificationDocUrl: addressChangeRequest.verificationDocUrl || ""
					}
				});

				await tx.addressChange.updateMany({
					where: {
						id: { not: requestId },
						studentId: addressChangeRequest.studentId
					},
					data: {
						verificationDocUrl: ""
					}
				});
			}

			return updatedRequest;
		});

		sendAddressChangeNotification(
			addressChangeRequest.studentId,
			requestId,
			status === "Approved",
			`${result.currentStation.name} (${result.currentStation.code})`,
			`${result.newStation.name} (${result.newStation.code})`,
			rejectionReason
		).catch((error) => {
			console.error("Failed to send address change notification:", error);
		});

		revalidatePath("/dashboard/admin/profile");
		revalidatePath("/dashboard/admin/address-change-requests");

		return success(result);
	} catch (error) {
		console.error("Error reviewing address change request:", error);
		return failure(databaseError("Failed to review address change request"));
	}
};

export const getAddressChangeRequestDetails = async (
	requestId: string
): Promise<Result<AddressChangeRequestItem, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const request = await prisma.addressChange.findUnique({
			where: { id: requestId },
			include: {
				student: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						},
						class: {
							include: {
								year: {
									select: {
										id: true,
										code: true,
										name: true
									}
								},
								branch: {
									select: {
										id: true,
										code: true,
										name: true
									}
								}
							}
						}
					}
				},
				newStation: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				currentStation: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				reviewedBy: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						}
					}
				}
			}
		});

		if (!request) {
			return failure(validationError("Address change request not found", "requestId"));
		}

		return success(request);
	} catch (error) {
		console.error("Error fetching address change request details:", error);
		return failure(databaseError("Failed to fetch address change request details"));
	}
};
