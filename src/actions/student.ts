"use server";

import {
	Result,
	success,
	failure,
	AuthError,
	databaseError,
	validationError,
	type DatabaseError,
	type ValidationError
} from "@/lib/result";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { normalizeDob, capitalizeWords } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth-guard";
import type { Prisma } from "@/generated/prisma/client";
import { sendStudentAccountNotification } from "@/lib/notifications";
import type { Student, StudentApprovalStatusType } from "@/generated/zod";
import { UpdateStudentActionSchema, type UpdateStudentActionInput } from "@/lib/validations/admin/edit-student";

export type StudentListItem = Pick<
	Student,
	| "userId"
	| "gender"
	| "status"
	| "lastName"
	| "firstName"
	| "createdAt"
	| "middleName"
	| "reviewedAt"
	| "submissionCount"
> & {
	user: {
		id: string;
		name: string;
		email: string;
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
	station: {
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
		};
	} | null;
};

export type StudentDetails = Pick<
	Student,
	| "userId"
	| "gender"
	| "status"
	| "address"
	| "lastName"
	| "createdAt"
	| "firstName"
	| "reviewedAt"
	| "middleName"
	| "dateOfBirth"
	| "rejectionReason"
	| "submissionCount"
	| "verificationDocUrl"
> & {
	user: {
		id: string;
		name: string;
		email: string;
		image?: string | null;
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
	station: {
		id: string;
		code: string;
		name: string;
	};
	preferredConcessionClass: {
		id: string;
		code: string;
		name: string;
	};
	preferredConcessionPeriod: {
		id: string;
		name: string;
		duration: number;
	};
	reviewedBy?: {
		userId: string;
		user: {
			id: string;
			name: string;
			email: string;
		};
	} | null;
};

export type PaginatedStudentsResult = {
	totalCount: number;
	totalPages: number;
	currentPage: number;
	hasNextPage: boolean;
	data: StudentListItem[];
	hasPreviousPage: boolean;
};

export type StudentPaginationParams = {
	page: number;
	pageSize: number;
	searchQuery?: string;
	statusFilter?: StudentApprovalStatusType | "all";
};

export const getStudents = async (
	params: StudentPaginationParams
): Promise<Result<PaginatedStudentsResult, AuthError | DatabaseError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const { page, pageSize, statusFilter, searchQuery } = params;
		const skip = (page - 1) * pageSize;

		const whereClause: Prisma.StudentWhereInput = {};

		if (statusFilter && statusFilter !== "all") {
			whereClause.status = statusFilter;
		}

		if (searchQuery && searchQuery.trim()) {
			const searchTerm = searchQuery.trim();

			whereClause.OR = [
				{
					firstName: {
						mode: "insensitive",
						contains: searchTerm
					}
				},
				{
					middleName: {
						mode: "insensitive",
						contains: searchTerm
					}
				},
				{
					lastName: {
						mode: "insensitive",
						contains: searchTerm
					}
				},
				{
					user: {
						name: {
							mode: "insensitive",
							contains: searchTerm
						}
					}
				},
				{
					user: {
						email: {
							mode: "insensitive",
							contains: searchTerm
						}
					}
				},
				{
					class: {
						code: {
							mode: "insensitive",
							contains: searchTerm
						}
					}
				},
				{
					station: {
						name: {
							mode: "insensitive",
							contains: searchTerm
						}
					}
				}
			];
		}

		const students = await prisma.student.findMany({
			where: whereClause,
			select: {
				userId: true,
				gender: true,
				status: true,
				lastName: true,
				firstName: true,
				createdAt: true,
				middleName: true,
				reviewedAt: true,
				submissionCount: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true
					}
				},
				class: {
					select: {
						id: true,
						code: true,
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
				},
				station: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				reviewedBy: {
					select: {
						userId: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						}
					}
				}
			}
		});

		const totalCount = students.length;

		const getStatusRank = (status: StudentApprovalStatusType): number => {
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

		const sortedStudents = students.sort((a, b) => {
			const rankA = getStatusRank(a.status);
			const rankB = getStatusRank(b.status);

			if (rankA !== rankB) {
				return rankA - rankB;
			}

			const timeA = new Date(a.createdAt).getTime();
			const timeB = new Date(b.createdAt).getTime();

			if (a.status === "Pending") {
				return timeA - timeB;
			}

			return timeB - timeA;
		});

		const totalPages = Math.ceil(totalCount / pageSize);
		const hasNextPage = page < totalPages;
		const hasPreviousPage = page > 1;

		const paginatedStudents = sortedStudents.slice(skip, skip + pageSize);

		return success({
			totalCount,
			totalPages,
			hasNextPage,
			hasPreviousPage,
			currentPage: page,
			data: paginatedStudents
		});
	} catch (error) {
		console.error("Error while fetching students:", error);
		return failure(databaseError("Failed to fetch students"));
	}
};

export const getStudentDetails = async (
	studentId: string
): Promise<Result<StudentDetails, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const student = await prisma.student.findUnique({
			where: { userId: studentId },
			select: {
				userId: true,
				gender: true,
				status: true,
				address: true,
				lastName: true,
				createdAt: true,
				firstName: true,
				reviewedAt: true,
				middleName: true,
				dateOfBirth: true,
				rejectionReason: true,
				submissionCount: true,
				verificationDocUrl: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						image: true
					}
				},
				class: {
					select: {
						id: true,
						code: true,
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
				},
				station: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				preferredConcessionClass: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				preferredConcessionPeriod: {
					select: {
						id: true,
						name: true,
						duration: true
					}
				},
				reviewedBy: {
					select: {
						userId: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						}
					}
				}
			}
		});

		if (!student) {
			return failure(validationError("Student not found"));
		}

		return success(student);
	} catch (error) {
		console.error("Error while fetching student details:", error);
		return failure(databaseError("Failed to fetch student details"));
	}
};

export type ApproveStudentData = {
	studentId: string;
};

export const approveStudent = async (
	data: ApproveStudentData
): Promise<Result<StudentDetails, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const student = await prisma.student.findUnique({
			select: { status: true },
			where: { userId: data.studentId }
		});

		if (!student) {
			return failure(validationError("Student not found"));
		}

		if (student.status !== "Pending") {
			return failure(validationError("Only pending students can be approved"));
		}

		const updatedStudent = await prisma.student.update({
			where: { userId: data.studentId },
			data: {
				status: "Approved",
				rejectionReason: null,
				reviewedAt: new Date(),
				reviewedById: adminResult.data.userId
			},
			select: {
				userId: true,
				gender: true,
				status: true,
				address: true,
				lastName: true,
				firstName: true,
				createdAt: true,
				middleName: true,
				reviewedAt: true,
				dateOfBirth: true,
				rejectionReason: true,
				submissionCount: true,
				verificationDocUrl: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true
					}
				},
				class: {
					select: {
						id: true,
						code: true,
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
				},
				station: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				preferredConcessionClass: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				preferredConcessionPeriod: {
					select: {
						id: true,
						name: true,
						duration: true
					}
				},
				reviewedBy: {
					select: {
						userId: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						}
					}
				}
			}
		});

		sendStudentAccountNotification(data.studentId, true, undefined, updatedStudent.submissionCount).catch((error) => {
			console.error("Failed to send student approval notification:", error);
		});

		revalidatePath("/dashboard/admin/students");
		return success(updatedStudent);
	} catch (error) {
		console.error("Error while approving student:", error);
		return failure(databaseError("Failed to approve student"));
	}
};

export type RejectStudentData = {
	studentId: string;
	rejectionReason: string;
};

export const rejectStudent = async (
	data: RejectStudentData
): Promise<Result<StudentDetails, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		if (!data.rejectionReason || data.rejectionReason.trim().length === 0) {
			return failure(validationError("Rejection reason is required"));
		}

		const student = await prisma.student.findUnique({
			select: { status: true },
			where: { userId: data.studentId }
		});

		if (!student) {
			return failure(validationError("Student not found"));
		}

		if (student.status !== "Pending") {
			return failure(validationError("Only pending students can be rejected"));
		}

		const updatedStudent = await prisma.student.update({
			where: { userId: data.studentId },
			data: {
				status: "Rejected",
				reviewedAt: new Date(),
				reviewedById: adminResult.data.userId,
				rejectionReason: data.rejectionReason.trim()
			},
			select: {
				userId: true,
				gender: true,
				status: true,
				address: true,
				lastName: true,
				createdAt: true,
				firstName: true,
				reviewedAt: true,
				middleName: true,
				dateOfBirth: true,
				rejectionReason: true,
				submissionCount: true,
				verificationDocUrl: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true
					}
				},
				class: {
					select: {
						id: true,
						code: true,
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
				},
				station: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				preferredConcessionClass: {
					select: {
						id: true,
						code: true,
						name: true
					}
				},
				preferredConcessionPeriod: {
					select: {
						id: true,
						name: true,
						duration: true
					}
				},
				reviewedBy: {
					select: {
						userId: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						}
					}
				}
			}
		});

		sendStudentAccountNotification(data.studentId, false, data.rejectionReason, updatedStudent.submissionCount).catch(
			(error) => {
				console.error("Failed to send student rejection notification:", error);
			}
		);

		revalidatePath("/dashboard/admin/students");
		return success(updatedStudent);
	} catch (error) {
		console.error("Error while rejecting student:", error);
		return failure(databaseError("Failed to reject student"));
	}
};

export const updateStudentDetails = async (
	data: UpdateStudentActionInput
): Promise<Result<StudentDetails, AuthError | DatabaseError | ValidationError>> => {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		const validationResult = UpdateStudentActionSchema.safeParse(data);
		if (!validationResult.success) {
			const firstError = validationResult.error.issues[0]?.message || "Invalid student data";
			return failure(validationError(firstError));
		}

		const validatedData = validationResult.data;

		const existingStudent = await prisma.student.findUnique({
			select: { userId: true },
			where: { userId: validatedData.studentId }
		});

		if (!existingStudent) {
			return failure(validationError("Student not found"));
		}

		const targetClass = await prisma.class.findFirst({
			where: {
				id: validatedData.class,
				yearId: validatedData.year,
				branchId: validatedData.branch
			}
		});

		if (!targetClass) {
			return failure(validationError("Selected class does not match the chosen year and branch"));
		}

		const birthDate = normalizeDob(validatedData.dateOfBirth);
		if (!birthDate) {
			return failure(validationError("Invalid date of birth"));
		}

		const firstName = capitalizeWords(validatedData.firstName.trim());
		const middleName = validatedData.middleName?.trim() ? capitalizeWords(validatedData.middleName.trim()) : null;
		const lastName = validatedData.lastName?.trim() ? capitalizeWords(validatedData.lastName.trim()) : null;

		const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

		const updatedStudent = await prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: validatedData.studentId },
				data: {
					name: fullName
				}
			});

			return tx.student.update({
				where: { userId: validatedData.studentId },
				data: {
					dateOfBirth: birthDate,
					gender: validatedData.gender,
					classId: validatedData.class,
					firstName,
					middleName,
					lastName
				},
				select: {
					userId: true,
					gender: true,
					status: true,
					address: true,
					lastName: true,
					firstName: true,
					createdAt: true,
					middleName: true,
					reviewedAt: true,
					dateOfBirth: true,
					rejectionReason: true,
					submissionCount: true,
					verificationDocUrl: true,
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true
						}
					},
					class: {
						select: {
							id: true,
							code: true,
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
					},
					station: {
						select: {
							id: true,
							code: true,
							name: true
						}
					},
					preferredConcessionClass: {
						select: {
							id: true,
							code: true,
							name: true
						}
					},
					preferredConcessionPeriod: {
						select: {
							id: true,
							name: true,
							duration: true
						}
					},
					reviewedBy: {
						select: {
							userId: true,
							user: {
								select: {
									id: true,
									name: true,
									email: true
								}
							}
						}
					}
				}
			});
		});

		revalidatePath("/dashboard/admin/students");
		return success(updatedStudent);
	} catch (error) {
		console.error("Error while updating student details:", error);
		return failure(databaseError("Failed to update student details"));
	}
};
