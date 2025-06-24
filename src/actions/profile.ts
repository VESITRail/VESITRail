"use server";

import prisma from "@/lib/prisma";
import { Student } from "@/generated/zod";
import { ok, err, Result } from "neverthrow";

export const getStudentProfile = async (
  studentId: string
): Promise<Result<Student, string>> => {
  try {
    const student = await prisma.student.findUnique({
      where: {
        userId: studentId,
      },
    });

    if (!student) {
      return err("Student profile not found");
    }

    if (student.status !== "Approved") {
      return err("Student is not approved");
    }

    return ok(student);
  } catch (error) {
    return err("Error fetching student profile");
  }
};
