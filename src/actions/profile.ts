"use server";

import {
  Result,
  success,
  failure,
  AuthError,
  authError,
  DatabaseError,
  databaseError,
} from "@/lib/result";
import {
  Year,
  Class,
  Branch,
  Student,
  Station,
  ConcessionClass,
  ConcessionPeriod,
} from "@/generated/zod";
import prisma from "@/lib/prisma";

export type StudentProfile = Student & {
  class: Class & {
    year: Year;
    branch: Branch;
  };
  station: Station;
  preferredConcessionClass: ConcessionClass;
  preferredConcessionPeriod: ConcessionPeriod;
};

export const getStudentProfile = async (
  studentId: string
): Promise<Result<StudentProfile, AuthError | DatabaseError>> => {
  try {
    const student = await prisma.student.findUnique({
      where: {
        userId: studentId,
      },
      include: {
        class: {
          include: {
            year: true,
            branch: true,
          },
        },
        station: true,
        preferredConcessionClass: true,
        preferredConcessionPeriod: true,
      },
    });

    if (!student) {
      return failure(authError("Student profile not found"));
    }

    if (student.status !== "Approved") {
      return failure(authError("Student is not approved"));
    }

    return success(student);
  } catch (error) {
    return failure(databaseError("Failed to load student profile"));
  }
};
