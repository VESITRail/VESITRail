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
