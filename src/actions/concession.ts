"use server";

import {
  StationSchema,
  ConcessionClassSchema,
  ConcessionPeriodSchema,
  ConcessionApplicationSchema,
} from "@/generated/zod";
import { z } from "zod";
import prisma from "@/lib/prisma";

const ConcessionSchema = z.object({
  status: ConcessionApplicationSchema.shape.status,
  createdAt: ConcessionApplicationSchema.shape.createdAt,
  applicationType: ConcessionApplicationSchema.shape.applicationType,
  station: z.object({
    code: StationSchema.shape.code,
    name: StationSchema.shape.name,
  }),
  concessionClass: z.object({
    code: ConcessionClassSchema.shape.code,
    name: ConcessionClassSchema.shape.name,
  }),
  concessionPeriod: z.object({
    name: ConcessionPeriodSchema.shape.name,
    duration: ConcessionPeriodSchema.shape.duration,
  }),
  previousApplication: z
    .object({
      station: z.object({
        code: StationSchema.shape.code,
        name: StationSchema.shape.name,
      }),
      concessionClass: z.object({
        code: ConcessionClassSchema.shape.code,
        name: ConcessionClassSchema.shape.name,
      }),
      concessionPeriod: z.object({
        name: ConcessionPeriodSchema.shape.name,
        duration: ConcessionPeriodSchema.shape.duration,
      }),
      status: ConcessionApplicationSchema.shape.status,
      createdAt: ConcessionApplicationSchema.shape.createdAt,
      applicationType: ConcessionApplicationSchema.shape.applicationType,
    })
    .nullable(),
});

type Concession = z.infer<typeof ConcessionSchema>;

export const getConcessions = async (): Promise<Concession[]> => {
  try {
    const concessions = await prisma.concessionApplication.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        status: true,
        createdAt: true,
        applicationType: true,
        station: {
          select: {
            code: true,
            name: true,
          },
        },
        concessionClass: {
          select: {
            code: true,
            name: true,
          },
        },
        concessionPeriod: {
          select: {
            name: true,
            duration: true,
          },
        },
        previousApplication: {
          select: {
            status: true,
            station: true,
            createdAt: true,
            concessionClass: true,
            applicationType: true,
            concessionPeriod: true,
          },
        },
      },
    });

    return concessions.map((concession) => ConcessionSchema.parse(concession));
  } catch (error) {
    throw new Error("Failed to fetch concessions");
  }
};

export const getLastApplication = async (studentId: string) => {
  try {
    const lastApplication = await prisma.concessionApplication.findFirst({
      where: {
        studentId,
        isDeleted: false,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        approvedAt: true,
        applicationType: true,
        station: {
          select: {
            code: true,
            name: true,
          },
        },
        concessionClass: {
          select: {
            code: true,
            name: true,
          },
        },
        concessionPeriod: {
          select: {
            name: true,
            duration: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: lastApplication,
    };
  } catch (error) {
    return {
      data: null,
      success: false,
      error: "Failed to fetch application",
    };
  }
};

export const getStudentDetails = async (userId: string) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        station: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        preferredConcessionClass: {
          select: {
            id: true,
            name: true,
            code: true,
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
      return {
        data: null,
        error: "Student not found",
      };
    }

    return {
      error: null,
      data: student,
    };
  } catch (error) {
    return {
      data: null,
      error: "Failed to fetch student details",
    };
  }
};

export const submitConcessionApplication = async (data: {
  studentId: string;
  stationId: string;
  concessionClassId: string;
  concessionPeriodId: string;
  applicationType: "New" | "Renewal";
  previousApplicationId?: string | null;
}) => {
  try {
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
    });

    return {
      error: null,
      data: application,
    };
  } catch (error) {
    console.log(error)
    return {
      data: null,
      error: "Failed to submit application",
    };
  }
};
