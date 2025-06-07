"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { OnboardingSchema } from "@/lib/validations/onboarding";

export const getYears = async () => {
  try {
    const years = await prisma.year.findMany({
      orderBy: { createdAt: "asc" },
      where: { isActive: true, isDeleted: false },
    });

    return { data: years, error: null };
  } catch (error) {
    return { data: null, error: "Failed to fetch years" };
  }
};

export const getBranches = async () => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
      where: { isActive: true, isDeleted: false },
    });

    return { data: branches, error: null };
  } catch (error) {
    return { data: null, error: "Failed to fetch branches" };
  }
};

export const getClasses = async () => {
  try {
    const classes = await prisma.class.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
    });

    return { data: classes, error: null };
  } catch (error) {
    return { data: null, error: "Failed to fetch classes" };
  }
};

export const getStations = async () => {
  try {
    const stations = await prisma.station.findMany({
      orderBy: { name: "asc" },
      where: { isActive: true, isDeleted: false },
    });

    return { data: stations, error: null };
  } catch (error) {
    return { data: null, error: "Failed to fetch stations" };
  }
};

export const getConcessionClasses = async () => {
  try {
    const classes = await prisma.concessionClass.findMany({
      orderBy: { code: "asc" },
      where: { isActive: true, isDeleted: false },
    });

    return { data: classes, error: null };
  } catch (error) {
    return { data: null, error: "Failed to fetch concession classes" };
  }
};

export const getConcessionPeriods = async () => {
  try {
    const periods = await prisma.concessionPeriod.findMany({
      orderBy: { duration: "asc" },
      where: { isActive: true, isDeleted: false },
    });

    return { data: periods, error: null };
  } catch (error) {
    return { data: null, error: "Failed to fetch concession periods" };
  }
};

export const getReviewData = async (data: {
  yearId: string;
  classId: string;
  branchId: string;
  stationId: string;
  preferredConcessionClassId: string;
  preferredConcessionPeriodId: string;
}) => {
  try {
    const [year, branch, class_, station, concessionClass, concessionPeriod] =
      await Promise.all([
        prisma.year.findUnique({
          where: { id: data.yearId },
          select: { id: true, name: true },
        }),
        prisma.branch.findUnique({
          where: { id: data.branchId },
          select: { id: true, name: true },
        }),
        prisma.class.findUnique({
          where: { id: data.classId },
          select: { id: true, code: true },
        }),
        prisma.station.findUnique({
          where: { id: data.stationId },
          select: { id: true, name: true },
        }),
        prisma.concessionClass.findUnique({
          where: { id: data.preferredConcessionClassId },
          select: { id: true, name: true },
        }),
        prisma.concessionPeriod.findUnique({
          where: { id: data.preferredConcessionPeriodId },
          select: { id: true, name: true },
        }),
      ]);

    return {
      data: {
        year,
        branch,
        station,
        class: class_,
        concessionClass,
        concessionPeriod,
      },
    };
  } catch (error) {
    return { error: "Failed to fetch student details" };
  }
};

export const submitOnboarding = async (
  userId: string,
  formData: z.infer<typeof OnboardingSchema>
) => {
  try {
    const student = await prisma.student.create({
      data: {
        userId,
        gender: formData.gender,
        classId: formData.class,
        approvalStatus: "Pending",
        address: formData.address,
        lastName: formData.lastName,
        stationId: formData.station,
        firstName: formData.firstName,
        middleName: formData.middleName,
        dateOfBirth: formData.dateOfBirth,
        verificationDocUrl: formData.verificationDocUrl,
        preferredConcessionClassId: formData.preferredConcessionClass,
        preferredConcessionPeriodId: formData.preferredConcessionPeriod,
      },
    });

    return { data: student, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.errors };
    }
    return { data: null, error: "Failed to submit student onboarding" };
  }
};
