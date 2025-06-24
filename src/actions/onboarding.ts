"use server";

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
import { ok, err, Result } from "neverthrow";

export type ReviewData = Pick<
  Student,
  | "classId"
  | "stationId"
  | "preferredConcessionClassId"
  | "preferredConcessionPeriodId"
>;

export type Review = {
  station: Pick<Station, "id" | "code" | "name">;
  class: Pick<Class, "id" | "code"> & {
    year: Pick<Year, "id" | "code" | "name">;
    branch: Pick<Branch, "id" | "code" | "name">;
  };
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
): Promise<Result<Review, string>> => {
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

    const [_class, station, concessionClass, concessionPeriod] =
      await Promise.all([
        prisma.class.findUnique({
          where: { id: data.classId },
          select: {
            id: true,
            code: true,
            year: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            branch: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        }),
        prisma.station.findUnique({
          where: { id: data.stationId },
          select: { id: true, code: true, name: true },
        }),
        prisma.concessionClass.findUnique({
          select: { id: true, code: true, name: true },
          where: { id: data.preferredConcessionClassId },
        }),
        prisma.concessionPeriod.findUnique({
          where: { id: data.preferredConcessionPeriodId },
          select: { id: true, name: true, duration: true },
        }),
      ]);

    if (!_class || !station || !concessionClass || !concessionPeriod) {
      return err("Some review fields are missing.");
    }

    return ok({
      station,
      class: _class,
      concessionClass,
      concessionPeriod,
    });
  } catch (error) {
    return err("Failed to fetch review data");
  }
};

export const submitOnboarding = async (
  studentId: string,
  data: OnboardingData
): Promise<Result<Student, string>> => {
  try {
    const student = await prisma.student.create({
      data: {
        ...data,
        userId: studentId,
      },
    });

    return ok(student);
  } catch (error) {
    return err("Failed to submit student onboarding");
  }
};
