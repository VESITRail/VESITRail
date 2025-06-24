"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ok, err, Result } from "neverthrow";
import { Student, Station, AddressChange } from "@/generated/zod";

export type AddressChangeData = Pick<
  AddressChange,
  | "studentId"
  | "newAddress"
  | "newStationId"
  | "currentAddress"
  | "currentStationId"
  | "verificationDocUrl"
>;

export type StudentAddressAndStation = Pick<Student, "address"> & {
  station: Pick<Station, "id" | "code" | "name">;
};

export const getStudentAddressAndStation = async (
  studentId: string
): Promise<Result<StudentAddressAndStation, string>> => {
  try {
    const student = await prisma.student.findUnique({
      where: {
        userId: studentId,
      },
      select: {
        status: true,
        address: true,
        station: {
          select: {
            id: true,
            code: true,
            name: true,
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

    const { address, station } = student;

    return ok({ address, station });
  } catch (error) {
    console.error("Error fetching student address and station:", error);
    return err("Failed to fetch student address and station");
  }
};

export const submitAddressChangeApplication = async (
  data: AddressChangeData
): Promise<Result<AddressChange, string>> => {
  try {
    if (data.newStationId === data.currentStationId) {
      return err("New station cannot be the same as current station");
    }

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

    const application = await prisma.addressChange.create({
      data: {
        status: "Pending",
        studentId: data.studentId,
        newAddress: data.newAddress,
        newStationId: data.newStationId,
        currentAddress: data.currentAddress,
        currentStationId: data.currentStationId,
        verificationDocUrl: data.verificationDocUrl,
      },
    });

    revalidatePath("/dashboard/student/change-address");

    return ok(application);
  } catch (error) {
    return err("Failed to submit address change application");
  }
};
