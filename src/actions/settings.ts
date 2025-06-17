"use server";

import prisma from "@/lib/prisma";

export const getStudentPreferences = async (userId: string) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        preferredConcessionClassId: true,
        preferredConcessionPeriodId: true,
        preferredConcessionClass: {
          select: {
            id: true,
            code: true,
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
        data: null,
        success: false,
        error: "Student not found",
      };
    }

    return {
      error: null,
      data: student,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      success: false,
      error: "Failed to fetch preferences",
    };
  }
};

export const updateStudentPreferences = async (
  userId: string,
  data: {
    preferredConcessionClassId: string;
    preferredConcessionPeriodId: string;
  }
) => {
  try {
    const [concessionClass, concessionPeriod] = await Promise.all([
      prisma.concessionClass.findFirst({
        where: {
          isActive: true,
          isDeleted: false,
          id: data.preferredConcessionClassId,
        },
      }),
      prisma.concessionPeriod.findFirst({
        where: {
          isActive: true,
          isDeleted: false,
          id: data.preferredConcessionPeriodId,
        },
      }),
    ]);

    if (!concessionClass) {
      return {
        data: null,
        success: false,
        error: "Invalid concession class selected",
      };
    }

    if (!concessionPeriod) {
      return {
        data: null,
        success: false,
        error: "Invalid concession period selected",
      };
    }

    const updatedStudent = await prisma.student.update({
      where: { userId },
      data: {
        preferredConcessionClassId: data.preferredConcessionClassId,
        preferredConcessionPeriodId: data.preferredConcessionPeriodId,
      },
      select: {
        preferredConcessionClass: {
          select: {
            id: true,
            code: true,
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

    return {
      error: null,
      success: true,
      data: updatedStudent,
    };
  } catch (error) {
    return {
      data: null,
      success: false,
      error: "Failed to update preferences",
    };
  }
};
