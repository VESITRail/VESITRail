"use server";

import {
  Result,
  success,
  failure,
  databaseError,
  DatabaseError,
  validationError,
  ValidationError,
} from "@/lib/result";
import {
  Student,
  Station,
  ConcessionPeriod,
  ConcessionBooklet,
  ConcessionApplication,
  ConcessionBookletStatusType,
} from "@/generated/zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma";
import { calculateSerialEndNumber } from "@/lib/utils";

export type CreateBookletInput = {
  serialStartNumber: string;
  status: ConcessionBookletStatusType;
};

export type UpdateBookletInput = {
  serialStartNumber: string;
  isDamaged: boolean;
};

export type BookletItem = ConcessionBooklet & {
  _count: {
    applications: number;
  };
};

export type PaginatedBookletsResult = {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  data: BookletItem[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type BookletPaginationParams = {
  page: number;
  pageSize: number;
  searchQuery?: string;
  statusFilter?: ConcessionBookletStatusType | "all";
};

export type BookletApplicationItem = Pick<
  ConcessionApplication,
  "id" | "createdAt" | "status" | "applicationType" | "pageOffset"
> & {
  student: Pick<
    Student,
    | "gender"
    | "address"
    | "lastName"
    | "firstName"
    | "middleName"
    | "dateOfBirth"
  >;
  derivedSerialNumber?: number;
  derivedCertificateNo?: string;
  station: Pick<Station, "name" | "code">;
  concessionPeriod: Pick<ConcessionPeriod, "name" | "duration">;
  previousApplication?:
    | (Pick<ConcessionApplication, "id" | "pageOffset"> & {
        concessionBooklet?: Pick<ConcessionBooklet, "serialStartNumber"> | null;
      })
    | null;
};

export type PaginatedBookletApplicationsResult = {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  data: BookletApplicationItem[];
  booklet: Pick<
    ConcessionBooklet,
    "id" | "bookletNumber" | "serialStartNumber" | "serialEndNumber"
  >;
};

export type BookletApplicationPaginationParams = {
  page: number;
  pageSize: number;
};

export const createBooklet = async (
  data: CreateBookletInput
): Promise<Result<BookletItem, DatabaseError | ValidationError>> => {
  try {
    if (!data.serialStartNumber?.trim()) {
      return failure(validationError("Serial start number is required"));
    }

    const serialStartNumber = data.serialStartNumber.toUpperCase().trim();

    if (!/^[A-Z]+\d+$/.test(serialStartNumber)) {
      return failure(
        validationError(
          "Serial number must contain letters followed by numbers (e.g., A0807550)"
        )
      );
    }

    const existingBooklet = await prisma.concessionBooklet.findFirst({
      where: {
        serialStartNumber,
      },
    });

    if (existingBooklet) {
      return failure(
        validationError(
          "A booklet with this serial start number already exists"
        )
      );
    }

    const totalPages = 50;
    const serialEndNumber = calculateSerialEndNumber(
      serialStartNumber,
      totalPages
    );

    const booklet = await prisma.concessionBooklet.create({
      data: {
        totalPages,
        serialEndNumber,
        serialStartNumber,
        status: data.status,
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/admin/booklets");
    return success(booklet);
  } catch (error) {
    console.error("Error creating booklet:", error);
    return failure(databaseError("Failed to create booklet"));
  }
};

export const getBooklets = async (
  params: BookletPaginationParams
): Promise<Result<PaginatedBookletsResult, DatabaseError>> => {
  try {
    const { page, pageSize, statusFilter, searchQuery } = params;
    const skip = (page - 1) * pageSize;

    const whereClause: Prisma.ConcessionBookletWhereInput = {};

    if (statusFilter && statusFilter !== "all") {
      whereClause.status = statusFilter;
    }

    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim();
      whereClause.OR = [
        {
          serialStartNumber: {
            contains: searchTerm,
            mode: "insensitive" as const,
          },
        },
        {
          serialEndNumber: {
            contains: searchTerm,
            mode: "insensitive" as const,
          },
        },
        {
          bookletNumber: isNaN(Number(searchTerm))
            ? undefined
            : {
                equals: Number(searchTerm),
              },
        },
      ].filter(Boolean);
    }

    const [booklets, totalCount] = await Promise.all([
      prisma.concessionBooklet.findMany({
        skip,
        take: pageSize,
        where: whereClause,
        orderBy: {
          bookletNumber: "desc",
        },
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
      prisma.concessionBooklet.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return success({
      totalCount,
      totalPages,
      hasNextPage,
      data: booklets,
      hasPreviousPage,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching booklets:", error);
    return failure(databaseError("Failed to fetch booklets"));
  }
};

export const deleteBooklet = async (
  bookletId: string
): Promise<Result<{ success: boolean }, DatabaseError | ValidationError>> => {
  try {
    const booklet = await prisma.concessionBooklet.findUnique({
      where: { id: bookletId },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!booklet) {
      return failure(validationError("Booklet not found"));
    }

    if (booklet._count.applications > 0) {
      return failure(
        validationError("Cannot delete booklet that has applications")
      );
    }

    await prisma.concessionBooklet.delete({
      where: { id: bookletId },
    });

    revalidatePath("/dashboard/admin/booklets");
    return success({ success: true });
  } catch (error) {
    console.error("Error deleting booklet:", error);
    return failure(databaseError("Failed to delete booklet"));
  }
};

export const updateBooklet = async (
  bookletId: string,
  data: UpdateBookletInput
): Promise<Result<BookletItem, DatabaseError | ValidationError>> => {
  try {
    const existingBooklet = await prisma.concessionBooklet.findUnique({
      where: { id: bookletId },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!existingBooklet) {
      return failure(validationError("Booklet not found"));
    }

    const serialPattern = /^[A-Z]\d+$/;
    if (!serialPattern.test(data.serialStartNumber)) {
      return failure(
        validationError(
          "Invalid serial format. Use one letter followed by numbers (e.g., A0807551)"
        )
      );
    }

    const serialEndNumber = calculateSerialEndNumber(
      data.serialStartNumber,
      50
    );

    const duplicateBooklet = await prisma.concessionBooklet.findFirst({
      where: {
        AND: [
          { id: { not: bookletId } },
          {
            OR: [
              { serialEndNumber: serialEndNumber },
              { serialStartNumber: data.serialStartNumber },
              {
                AND: [
                  { serialEndNumber: { gte: data.serialStartNumber } },
                  { serialStartNumber: { lte: data.serialStartNumber } },
                ],
              },
              {
                AND: [
                  { serialEndNumber: { gte: serialEndNumber } },
                  { serialStartNumber: { lte: serialEndNumber } },
                ],
              },
            ],
          },
        ],
      },
    });

    if (duplicateBooklet) {
      return failure(
        validationError("Serial number range overlaps with existing booklet")
      );
    }

    let newStatus: ConcessionBookletStatusType;

    if (data.isDamaged) {
      newStatus = "Damaged";
    } else {
      const applicationCount = existingBooklet._count?.applications || 0;
      if (applicationCount === 0) {
        newStatus = "Available";
      } else if (applicationCount < 50) {
        newStatus = "InUse";
      } else {
        newStatus = "Exhausted";
      }
    }

    const updatedBooklet = await prisma.concessionBooklet.update({
      where: { id: bookletId },
      data: {
        status: newStatus,
        serialEndNumber: serialEndNumber,
        serialStartNumber: data.serialStartNumber,
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/admin/booklets");
    return success(updatedBooklet);
  } catch (error) {
    console.error("Error updating booklet:", error);
    return failure(databaseError("Failed to update booklet"));
  }
};

export const getBookletApplications = async (
  bookletId: string,
  params: BookletApplicationPaginationParams
): Promise<
  Result<PaginatedBookletApplicationsResult, DatabaseError | ValidationError>
> => {
  try {
    const booklet = await prisma.concessionBooklet.findUnique({
      where: { id: bookletId },
      select: {
        id: true,
        bookletNumber: true,
        serialEndNumber: true,
        serialStartNumber: true,
      },
    });

    if (!booklet) {
      return failure(validationError("Booklet not found"));
    }

    const whereClause = {
      concessionBookletId: bookletId,
    };

    const totalCount = await prisma.concessionApplication.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(totalCount / params.pageSize);
    const skip = (params.page - 1) * params.pageSize;
    const hasNextPage = params.page < totalPages;
    const hasPreviousPage = params.page > 1;

    const applications = await prisma.concessionApplication.findMany({
      skip,
      where: whereClause,
      take: params.pageSize,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        pageOffset: true,
        applicationType: true,
        student: {
          select: {
            gender: true,
            address: true,
            lastName: true,
            firstName: true,
            middleName: true,
            dateOfBirth: true,
          },
        },
        station: {
          select: {
            name: true,
            code: true,
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
            id: true,
            pageOffset: true,
            concessionBooklet: {
              select: {
                serialStartNumber: true,
              },
            },
          },
        },
      },
    });

    const applicationsWithDerivedData: BookletApplicationItem[] =
      applications.map((app, index) => {
        const globalIndex = skip + index;
        const actualPageOffset = app.pageOffset ?? globalIndex;

        const serialStart = booklet.serialStartNumber;
        const prefix = serialStart.replace(/\d+$/, "");
        const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
        const certificateNum = startNum + actualPageOffset;
        const derivedCertificateNo = `${prefix}${certificateNum
          .toString()
          .padStart(serialStart.match(/\d+$/)?.[0]?.length || 3, "0")}`;

        return {
          id: app.id,
          status: app.status,
          station: app.station,
          derivedCertificateNo,
          student: app.student,
          createdAt: app.createdAt,
          pageOffset: app.pageOffset,
          applicationType: app.applicationType,
          concessionPeriod: app.concessionPeriod,
          derivedSerialNumber: actualPageOffset + 1,
          previousApplication: app.previousApplication,
        };
      });

    return success({
      booklet,
      totalCount,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      currentPage: params.page,
      data: applicationsWithDerivedData,
    });
  } catch (error) {
    console.error("Error fetching booklet applications:", error);
    return failure(databaseError("Failed to fetch booklet applications"));
  }
};
