"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth-guard";
import { Student, Station, AddressChange } from "@/generated/zod";
import { Result, failure, success, AppError, authError, databaseError, validationError } from "@/lib/result";

export type AddressChangeData = Pick<
	AddressChange,
	"newAddress" | "newStationId" | "currentAddress" | "currentStationId" | "verificationDocUrl"
>;

export type StudentAddressAndStation = Pick<Student, "address"> & {
	station: Pick<Station, "id" | "code" | "name">;
};

export const getStudentAddressAndStation = async (): Promise<Result<StudentAddressAndStation, AppError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const targetStudentId = studentResult.data.studentId;

		const student = await prisma.student.findUnique({
			where: {
				userId: targetStudentId
			},
			select: {
				status: true,
				address: true,
				station: {
					select: {
						id: true,
						code: true,
						name: true
					}
				}
			}
		});

		if (!student) {
			return failure(databaseError("Student not found"));
		}

		if (student.status !== "Approved") {
			return failure(authError("Student is not approved", "FORBIDDEN"));
		}

		const { address, station } = student;

		return success({ address, station });
	} catch (error) {
		console.error("Error fetching student address and station:", error);
		return failure(databaseError("Failed to fetch student address and station"));
	}
};

export const submitAddressChangeApplication = async (
	data: AddressChangeData
): Promise<Result<AddressChange, AppError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const targetStudentId = studentResult.data.studentId;

		if (data.newStationId === data.currentStationId) {
			return failure(validationError("New station cannot be the same as current station", "newStationId"));
		}

		const station = await prisma.station.findFirst({
			where: { id: data.newStationId, isActive: true }
		});

		if (!station) {
			return failure(validationError("Selected new station is currently unavailable", "newStationId"));
		}

		const existingApplication = await prisma.addressChange.findFirst({
			where: {
				studentId: targetStudentId
			},
			orderBy: {
				createdAt: "desc"
			}
		});

		let application: AddressChange;

		if (!existingApplication || existingApplication.status === "Approved") {
			application = await prisma.addressChange.create({
				data: {
					status: "Pending",
					submissionCount: 1,
					studentId: targetStudentId,
					newAddress: data.newAddress,
					newStationId: data.newStationId,
					currentAddress: data.currentAddress,
					currentStationId: data.currentStationId,
					verificationDocUrl: data.verificationDocUrl
				}
			});
		} else {
			application = await prisma.addressChange.update({
				where: {
					id: existingApplication.id
				},
				data: {
					status: "Pending",
					reviewedAt: null,
					reviewedById: null,
					rejectionReason: null,
					newAddress: data.newAddress,
					newStationId: data.newStationId,
					submissionCount: { increment: 1 },
					currentAddress: data.currentAddress,
					currentStationId: data.currentStationId,
					verificationDocUrl: data.verificationDocUrl
				}
			});
		}

		revalidatePath("/dashboard/student/change-address");

		return success(application);
	} catch (error) {
		console.error("Error while submitting address change application:", error);
		return failure(databaseError("Failed to submit address change application"));
	}
};

export const getLastAddressChangeApplication = async (): Promise<Result<AddressChange | null, AppError>> => {
	const studentResult = await requireStudent();
	if (!studentResult.isSuccess) return studentResult;

	try {
		const targetStudentId = studentResult.data.studentId;

		const lastApplication = await prisma.addressChange.findFirst({
			where: {
				studentId: targetStudentId
			},
			include: {
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
				}
			},
			orderBy: {
				createdAt: "desc"
			}
		});

		return success(lastApplication);
	} catch (error) {
		console.error("Error fetching last address change application:", error);
		return failure(databaseError("Failed to fetch last address change application"));
	}
};
