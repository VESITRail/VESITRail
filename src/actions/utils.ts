"use server";

import {
  Year,
  Class,
  Branch,
  Station,
  ConcessionClass,
  ConcessionPeriod,
} from "@/generated/zod";
import prisma from "@/lib/prisma";
import { ok, err, Result } from "neverthrow";

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

export const getYears = async (): Promise<Result<Year[], string>> => {
  try {
    const years = await prisma.year.findMany({
      where: { isActive: true },
    });

    return ok(years);
  } catch (error) {
    return err("Failed to fetch years");
  }
};

export const getBranches = async (): Promise<Result<Branch[], string>> => {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
    });

    return ok(branches);
  } catch (error) {
    return err("Failed to fetch branches");
  }
};

export const getClasses = async (): Promise<Result<Class[], string>> => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { code: "asc" },
      where: { isActive: true },
    });

    return ok(classes);
  } catch (error) {
    return err("Failed to fetch classes");
  }
};

export const getStations = async (): Promise<Result<Station[], string>> => {
  try {
    const stations = await prisma.station.findMany({
      orderBy: { name: "asc" },
      where: { isActive: true },
    });

    return ok(stations);
  } catch (error) {
    return err("Failed to fetch stations");
  }
};

export const getConcessionClasses = async (): Promise<
  Result<ConcessionClass[], string>
> => {
  try {
    const classes = await prisma.concessionClass.findMany({
      where: { isActive: true },
    });

    return ok(classes);
  } catch (error) {
    return err("Failed to fetch concession classes");
  }
};

export const getConcessionPeriods = async (): Promise<
  Result<ConcessionPeriod[], string>
> => {
  try {
    const periods = await prisma.concessionPeriod.findMany({
      where: { isActive: true },
      orderBy: { duration: "asc" },
    });

    return ok(periods);
  } catch (error) {
    return err("Failed to fetch concession periods");
  }
};
