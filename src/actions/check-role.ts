"use server";

import prisma from "@/lib/prisma";
import { ok, err, Result } from "neverthrow";
import { StudentApprovalStatusType } from "@/generated/zod";

export type UserRole = {
  role: "admin" | "student";
  status: "Active" | "Inactive" | "NeedsOnboarding" | StudentApprovalStatusType;
};

export const checkUserRole = async (
  userId: string
): Promise<Result<UserRole, string>> => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { userId },
      select: { isActive: true },
    });

    if (admin) {
      if (!admin.isActive) {
        return ok({
          role: "admin",
          status: "Inactive",
        });
      }

      return ok({ role: "admin", status: "Active" });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { status: true },
    });

    if (student) {
      return ok({
        role: "student",
        status: student.status,
      });
    }

    return ok({
      role: "student",
      status: "NeedsOnboarding",
    });
  } catch (error) {
    return err("Failed to check user role");
  }
};
