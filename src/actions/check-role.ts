"use server";

import prisma from "@/lib/prisma";
import { StudentApprovalStatus } from "@/generated/prisma";

type UserRole = {
  needsOnboarding: boolean;
  role: "admin" | "student";
  status?: "inactive" | "deleted" | "pending" | "rejected";
};

export const checkUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { userId },
    });

    if (admin) {
      if (admin.isDeleted) {
        return { role: "admin", needsOnboarding: false, status: "deleted" };
      }

      if (!admin.isActive) {
        return { role: "admin", needsOnboarding: false, status: "inactive" };
      }

      return { role: "admin", needsOnboarding: false };
    }

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (student) {
      if (student.isDeleted) {
        return { role: "student", needsOnboarding: false, status: "deleted" };
      }

      if (student.approvalStatus === StudentApprovalStatus.Pending) {
        return { role: "student", needsOnboarding: false, status: "pending" };
      }

      if (student.approvalStatus === StudentApprovalStatus.Rejected) {
        return { role: "student", needsOnboarding: false, status: "rejected" };
      }

      return { role: "student", needsOnboarding: false };
    }

    return { role: "student", needsOnboarding: true };
  } catch (error) {
    console.error("Error checking user role:", error);
    throw new Error("Failed to check user role");
  }
};
