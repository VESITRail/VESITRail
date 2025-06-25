"use server";

import {
  Result,
  success,
  failure,
  AuthError,
  databaseError,
  DatabaseError,
} from "@/lib/result";
import prisma from "@/lib/prisma";
import { StudentApprovalStatusType } from "@/generated/zod";

export type UserRole = {
  role: "admin" | "student";
  status: "Active" | "Inactive" | "NeedsOnboarding" | StudentApprovalStatusType;
};

export const checkUserRole = async (
  userId: string
): Promise<Result<UserRole, AuthError | DatabaseError>> => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { userId },
      select: { isActive: true },
    });

    if (admin) {
      if (!admin.isActive) {
        return success({
          role: "admin",
          status: "Inactive",
        });
      }

      return success({ role: "admin", status: "Active" });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { status: true },
    });

    if (student) {
      return success({
        role: "student",
        status: student.status,
      });
    }

    return success({
      role: "student",
      status: "NeedsOnboarding",
    });
  } catch (error) {
    return failure(databaseError("Failed to check user role"));
  }
};
