"use server";

import {
  Year,
  Class,
  Branch,
  Station,
  Student,
  ConcessionClass,
  ConcessionPeriod,
} from "@/generated/zod";
import prisma from "@/lib/prisma";

export type StudentProfileResponse = {
  error?: string;
  data?: Partial<Student> & {
    class: Partial<Class> & {
      year: Partial<Year>;
      branch: Partial<Branch>;
    };
    station: Partial<Station>;
    preferredConcessionClass: Partial<ConcessionClass>;
    preferredConcessionPeriod: Partial<ConcessionPeriod>;
  };
};

export const getStudentProfile = async (
  userId: string
): Promise<StudentProfileResponse> => {
  try {
    if (!userId) {
      return {
        error: "User ID is required",
      };
    }

    const student = await prisma.student.findUnique({
      where: {
        userId: userId,
        isDeleted: false,
      },
      include: {
        station: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          include: {
            year: {
              select: {
                id: true,
                name: true,
              },
            },
            branch: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        preferredConcessionClass: {
          select: {
            id: true,
            name: true,
          },
        },
        preferredConcessionPeriod: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!student) {
      return {
        error: "Student profile not found",
      };
    }

    return {
      data: {
        class: {
          id: student.class.id,
          code: student.class.code,
          year: student.class.year,
          branch: student.class.branch,
        },
        userId: student.userId,
        address: student.address,
        classId: student.classId,
        station: student.station,
        lastName: student.lastName,
        firstName: student.firstName,
        isDeleted: student.isDeleted,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        stationId: student.stationId,
        middleName: student.middleName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender as Student["gender"],
        verificationDocUrl: student.verificationDocUrl,
        preferredConcessionClass: student.preferredConcessionClass,
        preferredConcessionPeriod: student.preferredConcessionPeriod,
        preferredConcessionClassId: student.preferredConcessionClassId,
        preferredConcessionPeriodId: student.preferredConcessionPeriodId,
        approvalStatus: student.approvalStatus as Student["approvalStatus"],
      },
    };
  } catch (error) {
    console.error("Error fetching student profile:", error);

    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while fetching the profile",
    };
  }
};
