"use server";

import {
  Station,
  ConcessionClass,
  ConcessionPeriod,
  ConcessionApplication,
  ConcessionApplicationTypeType,
  ConcessionApplicationStatusType,
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
import type { Prisma } from "@/generated/prisma";

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

export type PaginationParams = {
  page: number;
  pageSize: number;
  statusFilter?: ConcessionApplicationStatusType | "all";
  typeFilter?: ConcessionApplicationTypeType | "all";
};

export type PaginatedResult<T> = {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export const getConcessions = async (
  studentId: string,
  params: PaginationParams
): Promise<Result<PaginatedResult<Concession>, AuthError | DatabaseError>> => {
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

    const whereClause: Prisma.ConcessionApplicationWhereInput = { studentId };

    if (params.statusFilter && params.statusFilter !== "all") {
      whereClause.status = params.statusFilter;
    }

    if (params.typeFilter && params.typeFilter !== "all") {
      whereClause.applicationType = params.typeFilter;
    }

    const totalCount = await prisma.concessionApplication.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(totalCount / params.pageSize);
    const skip = (params.page - 1) * params.pageSize;
    const hasNextPage = params.page < totalPages;
    const hasPreviousPage = params.page > 1;

    const concessions = await prisma.concessionApplication.findMany({
      skip,
      where: whereClause,
      take: params.pageSize,
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

    const result: PaginatedResult<Concession> = {
      totalCount,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      data: concessions,
      currentPage: params.page,
    };

    return success(result);
  } catch (error) {
    console.error("Error while fetching concessions:", error);
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

    return success(lastApplication);
  } catch (error) {
    console.error("Error while fetching application:", error);
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
    console.error("Error while submitting application:", error);
    return failure(databaseError("Failed to submit application"));
  }
};
