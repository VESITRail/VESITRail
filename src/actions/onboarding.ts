"use server";

import {
  Result,
  success,
  failure,
  databaseError,
  DatabaseError,
  validationError,
  ValidationError,
} from "@/lib/result";
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

export type ReviewData = Pick<
  Student,
  | "classId"
  | "stationId"
  | "preferredConcessionClassId"
  | "preferredConcessionPeriodId"
>;

export type Review = {
  class: Pick<Class, "id" | "code"> & {
    year: Pick<Year, "id" | "code" | "name">;
    branch: Pick<Branch, "id" | "code" | "name">;
  };
  station: Pick<Station, "id" | "code" | "name">;
  concessionClass: Pick<ConcessionClass, "id" | "code" | "name">;
  concessionPeriod: Pick<ConcessionPeriod, "id" | "name" | "duration">;
};

export type OnboardingData = Pick<
  Student,
  | "status"
  | "gender"
  | "classId"
  | "address"
  | "lastName"
  | "firstName"
  | "stationId"
  | "middleName"
  | "dateOfBirth"
  | "verificationDocUrl"
  | "preferredConcessionClassId"
  | "preferredConcessionPeriodId"
>;

export const getReviewData = async (
  data: ReviewData,
  studentId: string
): Promise<Result<Review, ValidationError | DatabaseError>> => {
  try {
    const student = await prisma.student.findUnique({
      select: { status: true },
      where: { userId: studentId },
    });

    if (!student) {
      return failure(validationError("Student not found", "studentId"));
    }

    if (student.status !== "Approved") {
      return failure(validationError("Student is not approved", "status"));
    }

    const [_class, station, concessionClass, concessionPeriod] =
      await Promise.all([
        prisma.class.findUnique({
          where: { id: data.classId },
          select: {
            id: true,
            code: true,
            year: { select: { id: true, code: true, name: true } },
            branch: { select: { id: true, code: true, name: true } },
          },
        }),
        prisma.station.findUnique({
          where: { id: data.stationId },
          select: { id: true, code: true, name: true },
        }),
        prisma.concessionClass.findUnique({
          where: { id: data.preferredConcessionClassId },
          select: { id: true, code: true, name: true },
        }),
        prisma.concessionPeriod.findUnique({
          where: { id: data.preferredConcessionPeriodId },
          select: { id: true, name: true, duration: true },
        }),
      ]);

    if (!_class || !station || !concessionClass || !concessionPeriod) {
      return failure(validationError("Some review fields are missing"));
    }

    return success({
      station,
      class: _class,
      concessionClass,
      concessionPeriod,
    });
  } catch (error) {
    return failure(databaseError("Failed to fetch review data"));
  }
};

export const submitOnboarding = async (
  studentId: string,
  data: OnboardingData
): Promise<Result<Student, DatabaseError>> => {
  try {
    const student = await prisma.student.create({
      data: {
        ...data,
        userId: studentId,
      },
    });

    return success(student);
  } catch (error) {
    return failure(databaseError("Failed to submit student onboarding"));
  }
};
