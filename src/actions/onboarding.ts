"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OnboardingSchema } from "@/lib/validations/onboarding";

export async function getYears() {
  try {
    const years = await prisma.year.findMany({
      orderBy: { createdAt: "asc" },
      where: { isActive: true, isDeleted: false },
    });

    return { data: years, error: null };
  } catch (error) {
    return { data: null, error: "Failed to fetch years" };
  }
}

export async function getBranches() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
      where: { isActive: true, isDeleted: false },
    });

    return { data: branches, error: null };
  } catch (error) {
    return { data: null, error: "Failed to fetch branches" };
  }
}

export async function getClasses() {
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
}

export async function getStations() {
  try {
    const stations = await prisma.station.findMany({
      orderBy: { name: "asc" },
      where: { isActive: true, isDeleted: false },
    });

    return { data: stations, error: null };
  } catch (error) {
    return { data: null, error: "Failed to fetch stations" };
  }
}

export async function getConcessionClasses() {
  try {
    const classes = await prisma.concessionClass.findMany({
      orderBy: { code: "asc" },
      where: { isActive: true, isDeleted: false },
    });

    return { data: classes, error: null };
  } catch (error) {
    return { data: null, error: "Failed to fetch concession classes" };
  }
}

export async function getConcessionPeriods() {
  try {
    const periods = await prisma.concessionPeriod.findMany({
      orderBy: { duration: "asc" },
      where: { isActive: true, isDeleted: false },
    });

    return { data: periods, error: null };
  } catch (error) {
    return { data: null, error: "Failed to fetch concession periods" };
  }
}

export async function submitOnboarding(
  formData: z.infer<typeof OnboardingSchema>
) {
  try {
    const validatedData = OnboardingSchema.parse(formData);

    // Validate age
    const birthDate = new Date(validatedData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    const actualAge =
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ? age - 1
        : age;

    if (actualAge > 25) {
      return { data: null, error: "Age should not be more than 25 years" };
    }

    // TODO: Replace with actual user ID from session
    const userId = "temp-user-id";

    const student = await prisma.student.create({
      data: {
        ...validatedData,
        userId,
        approvalStatus: "Pending",
        isDeleted: false,
      },
    });

    revalidatePath("/student/onboarding");
    return { data: student, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.errors };
    }
    return { data: null, error: "Failed to submit student onboarding" };
  }
}
