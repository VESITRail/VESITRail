"use server";

import prisma from "@/lib/prisma";
import { ok, err, Result } from "neverthrow";
import { ConcessionClass, ConcessionPeriod } from "@/generated/zod";

export type StudentPreferences = {
  preferredConcessionClass: Pick<ConcessionClass, "id" | "code" | "name">;
  preferredConcessionPeriod: Pick<ConcessionPeriod, "id" | "name" | "duration">;
};

export type UpdatePreferencesData = {
  preferredConcessionClassId: string;
  preferredConcessionPeriodId: string;
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

export const updateStudentPreferences = async (
  studentId: string,
  data: UpdatePreferencesData
): Promise<Result<any, string>> => {
  try {
    const student = await prisma.student.findUnique({
      select: { status: true },
      where: { userId: studentId },
    });

    if (!student) {
      return err("Student not found");
    }

    if (student.status !== "Approved") {
      return err("Student is not approved");
    }

    const [concessionClass, concessionPeriod] = await Promise.all([
      prisma.concessionClass.findFirst({
        where: {
          isActive: true,
          id: data.preferredConcessionClassId,
        },
      }),
      prisma.concessionPeriod.findFirst({
        where: {
          isActive: true,
          id: data.preferredConcessionPeriodId,
        },
      }),
    ]);

    if (!concessionClass) {
      return err("Invalid concession class selected");
    }

    if (!concessionPeriod) {
      return err("Invalid concession period selected");
    }

    const updatedStudent = await prisma.student.update({
      where: { userId: studentId },
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
            duration: true,
          },
        },
      },
    });

    return ok(updatedStudent);
  } catch (error) {
    return err("Failed to update preferences");
  }
};
