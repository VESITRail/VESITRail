"use server";

import prisma from "@/lib/prisma";
import { ok, err, Result } from "neverthrow";
import { ConcessionClass, ConcessionPeriod } from "@/generated/zod";

export type StudentPreferences = {
  preferredConcessionClass: Pick<ConcessionClass, "id" | "code" | "name">;
  preferredConcessionPeriod: Pick<ConcessionPeriod, "id" | "name" | "duration">;
};

export const getStudentPreferences = async (
  studentId: string
): Promise<Result<StudentPreferences, string>> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      select: {
        status: true,
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
            duration: true,
          },
        },
      },
    });

    if (!student) {
      return err("Student not found");
    }

    if (student.status !== "Approved") {
      return err("Student is not approved");
    }

    const { preferredConcessionClass, preferredConcessionPeriod } = student;

    return ok({
      preferredConcessionClass,
      preferredConcessionPeriod,
    });
  } catch (error) {
    return err("Failed to fetch preferences");
  }
};
