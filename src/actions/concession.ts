"use server";

import {
  Station,
  ConcessionClass,
  ConcessionPeriod,
  ConcessionApplicationTypeType,
  ConcessionApplicationStatusType,
} from "@/generated/zod";
import prisma from "@/lib/prisma";
import { ok, err, Result } from "neverthrow";

export type ConcessionApplication = {
  id: string;
  createdAt: Date;
  reviewedAt?: Date | null;
  status: ConcessionApplicationStatusType;
  applicationType: ConcessionApplicationTypeType;
  station: Pick<Station, "id" | "code" | "name">;
  previousApplication?: ConcessionApplication | null;
  concessionClass: Pick<ConcessionClass, "id" | "code" | "name">;
  concessionPeriod: Pick<ConcessionPeriod, "id" | "name" | "duration">;
};

export const getConcessions = async (
  studentId: string
): Promise<Result<ConcessionApplication[], string>> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      select: { status: true },
    });

    if (!student) {
      return err("Student not found");
    }

    if (student.status !== "Approved") {
      return err("Student is not approved");
    }

    const concessions = await prisma.concessionApplication.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        applicationType: true,
        station: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        concessionClass: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        concessionPeriod: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
        previousApplication: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            applicationType: true,
            station: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            concessionClass: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            concessionPeriod: {
              select: {
                id: true,
                name: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    return ok(concessions);
  } catch (error) {
    return err("Failed to fetch concessions");
  }
};

export const getLastApplication = async (
  studentId: string
): Promise<Result<ConcessionApplication, string>> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      select: { status: true },
    });

    if (!student) {
      return err("Student not found");
    }

    if (student.status !== "Approved") {
      return err("Student is not approved");
    }

    const lastApplication = await prisma.concessionApplication.findFirst({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        applicationType: true,
        station: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        concessionClass: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        concessionPeriod: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
    });

    if (!lastApplication) {
      return err("No applications found for this student");
    }

    return ok(lastApplication);
  } catch (error) {
    return err("Failed to fetch application");
  }
};

export const submitConcessionApplication = async (data: {
  studentId: string;
  stationId: string;
  concessionClassId: string;
  concessionPeriodId: string;
  previousApplicationId?: string | null;
  applicationType: ConcessionApplicationTypeType;
}): Promise<Result<ConcessionApplication, string>> => {
  try {
    const student = await prisma.student.findUnique({
      select: { status: true },
      where: { userId: data.studentId },
    });

    if (!student) {
      return err("Student not found");
    }

    if (student.status !== "Approved") {
      return err("Student is not approved");
    }

    const application = await prisma.concessionApplication.create({
      data: {
        status: "Pending",
        studentId: data.studentId,
        stationId: data.stationId,
        applicationType: data.applicationType,
        concessionClassId: data.concessionClassId,
        concessionPeriodId: data.concessionPeriodId,
        previousApplicationId: data.previousApplicationId,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        applicationType: true,
        station: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        concessionClass: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        concessionPeriod: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
        previousApplication: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            reviewedAt: true,
            applicationType: true,
            station: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            concessionClass: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            concessionPeriod: {
              select: {
                id: true,
                name: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    return ok(application);
  } catch (error) {
    return err("Failed to submit application");
  }
};
