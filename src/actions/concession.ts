"use server";

import {
  Station,
  ConcessionClass,
  ConcessionPeriod,
  ConcessionApplication,
} from "@/generated/zod";
import {
  Result,
  success,
  failure,
  AuthError,
  authError,
  databaseError,
  DatabaseError,
} from "@/lib/result";
import prisma from "@/lib/prisma";

export type Concession =
  | (Pick<
      ConcessionApplication,
      "id" | "status" | "createdAt" | "reviewedAt" | "applicationType"
    > & {
      previousApplication?: Concession;
      station: Pick<Station, "id" | "code" | "name">;
      concessionClass: Pick<ConcessionClass, "id" | "code" | "name">;
      concessionPeriod: Pick<ConcessionPeriod, "id" | "name" | "duration">;
    })
  | null;

export type ConcessionApplicationData = Pick<
  ConcessionApplication,
  | "studentId"
  | "stationId"
  | "applicationType"
  | "concessionClassId"
  | "concessionPeriodId"
  | "previousApplicationId"
>;

export const getConcessions = async (
  studentId: string
): Promise<Result<Concession[], AuthError | DatabaseError>> => {
  try {
    const student = await prisma.student.findUnique({
      select: { status: true },
      where: { userId: studentId },
    });

    if (!student) {
      return failure(authError("Student not found"));
    }

    if (student.status !== "Approved") {
      return failure(authError("Student is not approved"));
    }

    const concessions = await prisma.concessionApplication.findMany({
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

    return success(concessions);
  } catch (error) {
    return failure(databaseError("Failed to fetch concessions"));
  }
};

export const getLastApplication = async (
  studentId: string
): Promise<Result<Concession, AuthError | DatabaseError>> => {
  try {
    const student = await prisma.student.findUnique({
      select: { status: true },
      where: { userId: studentId },
    });

    if (!student) {
      return failure(authError("Student not found"));
    }

    if (student.status !== "Approved") {
      return failure(authError("Student is not approved"));
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
      return failure(authError("No applications found for this student"));
    }

    return success(lastApplication);
  } catch (error) {
    return failure(databaseError("Failed to fetch application"));
  }
};

export const submitConcessionApplication = async (
  data: ConcessionApplicationData
): Promise<Result<Concession, AuthError | DatabaseError>> => {
  try {
    const student = await prisma.student.findUnique({
      select: { status: true },
      where: { userId: data.studentId },
    });

    if (!student) {
      return failure(authError("Student not found"));
    }

    if (student.status !== "Approved") {
      return failure(authError("Student is not approved"));
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

    return success(application);
  } catch (error) {
    return failure(databaseError("Failed to submit application"));
  }
};
