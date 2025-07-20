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
  User,
  Class,
  Admin,
  Branch,
  Student,
  Station,
  ConcessionClass,
  ConcessionPeriod,
} from "@/generated/zod";
import prisma from "@/lib/prisma";

export type AdminProfile = Admin & {
  user: User;
  studentsCount: number;
  applicationsCount: number;
  addressChangesCount: number;
};

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
    console.error("Error while loading student profile:", error);
    return failure(databaseError("Failed to load student profile"));
  }
};

export const getAdminProfile = async (
  adminId: string
): Promise<Result<AdminProfile, AuthError | DatabaseError>> => {
  try {
    const admin = await prisma.admin.findUnique({
      where: {
        userId: adminId,
      },
      include: {
        user: true,
      },
    });

    if (!admin) {
      return failure(authError("Admin profile not found"));
    }

    if (!admin.isActive) {
      return failure(authError("Admin account is not active"));
    }

    const [studentsCount, applicationsCount, addressChangesCount] =
      await Promise.all([
        prisma.student.count({
          where: {
            reviewedById: adminId,
          },
        }),
        prisma.concessionApplication.count({
          where: {
            reviewedById: adminId,
          },
        }),
        prisma.addressChange.count({
          where: {
            reviewedById: adminId,
          },
        }),
      ]);

    const adminProfile: AdminProfile = {
      ...admin,
      studentsCount,
      applicationsCount,
      addressChangesCount,
    };

    return success(adminProfile);
  } catch (error) {
    console.error("Error while loading admin profile:", error);
    return failure(databaseError("Failed to load admin profile"));
  }
};
