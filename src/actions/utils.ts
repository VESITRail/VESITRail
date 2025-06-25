"use server";

import {
  Result,
  success,
  failure,
  databaseError,
  DatabaseError,
} from "@/lib/result";
import {
  Year,
  Class,
  Branch,
  Station,
  ConcessionClass,
  ConcessionPeriod,
} from "@/generated/zod";
import prisma from "@/lib/prisma";
import { sortByRomanKey } from "@/lib/utils";

export type StudentPreferences = {
  preferredConcessionClass: Pick<ConcessionClass, "id" | "code" | "name">;
  preferredConcessionPeriod: Pick<ConcessionPeriod, "id" | "name" | "duration">;
};

export const getStudentPreferences = async (
  studentId: string
): Promise<Result<StudentPreferences, DatabaseError>> => {
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
      return failure(databaseError("Student not found"));
    }

    if (student.status !== "Approved") {
      return failure(databaseError("Student is not approved"));
    }

    const { preferredConcessionClass, preferredConcessionPeriod } = student;

    return success({
      preferredConcessionClass,
      preferredConcessionPeriod,
    });
  } catch (error) {
    return failure(databaseError("Failed to fetch preferences"));
  }
};

export const getYears = async (): Promise<Result<Year[], DatabaseError>> => {
  try {
    const years = await prisma.year.findMany({
      where: { isActive: true },
    });

    return success(years);
  } catch (error) {
    return failure(databaseError("Failed to fetch years"));
  }
};

export const getBranches = async (): Promise<
  Result<Branch[], DatabaseError>
> => {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
    });

    return success(branches);
  } catch (error) {
    return failure(databaseError("Failed to fetch branches"));
  }
};

export const getClasses = async (): Promise<Result<Class[], DatabaseError>> => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { code: "asc" },
      where: { isActive: true },
    });

    return success(classes);
  } catch (error) {
    return failure(databaseError("Failed to fetch classes"));
  }
};

export const getStations = async (): Promise<
  Result<Station[], DatabaseError>
> => {
  try {
    const stations = await prisma.station.findMany({
      orderBy: { name: "asc" },
      where: { isActive: true },
    });

    return success(stations);
  } catch (error) {
    return failure(databaseError("Failed to fetch stations"));
  }
};

export const getConcessionClasses = async (): Promise<
  Result<ConcessionClass[], DatabaseError>
> => {
  try {
    const classes = await prisma.concessionClass.findMany({
      where: { isActive: true },
    });

    return success(sortByRomanKey(classes, "code"));
  } catch (error) {
    return failure(databaseError("Failed to fetch concession classes"));
  }
};

export const getConcessionPeriods = async (): Promise<
  Result<ConcessionPeriod[], DatabaseError>
> => {
  try {
    const periods = await prisma.concessionPeriod.findMany({
      where: { isActive: true },
      orderBy: { duration: "asc" },
    });

    return success(periods);
  } catch (error) {
    return failure(databaseError("Failed to fetch concession periods"));
  }
};
