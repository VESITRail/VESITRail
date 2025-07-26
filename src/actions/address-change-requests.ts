"use server";

import {
  Result,
  success,
  failure,
  authError,
  AuthError,
  databaseError,
  DatabaseError,
  validationError,
  ValidationError,
} from "@/lib/result";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma";
import { AddressChange, AddressChangeStatusType } from "@/generated/zod";

export type AddressChangeRequestItem = Pick<
  AddressChange,
  | "id"
  | "status"
  | "createdAt"
  | "reviewedAt"
  | "newAddress"
  | "currentAddress"
  | "verificationDocUrl"
> & {
  student: {
    userId: string;
    lastName: string;
    firstName: string;
    middleName: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
    class: {
      id: string;
      code: string;
      year: {
        id: string;
        code: string;
        name: string;
      };
      branch: {
        id: string;
        code: string;
        name: string;
      };
    };
  };
  newStation: {
    id: string;
    code: string;
    name: string;
  };
  currentStation: {
    id: string;
    code: string;
    name: string;
  };
  reviewedBy?: {
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  } | null;
};

export type PaginatedAddressChangeRequestsResult = {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  data: AddressChangeRequestItem[];
};

export type AddressChangeRequestPaginationParams = {
  page: number;
  pageSize: number;
  searchQuery?: string;
  statusFilter?: AddressChangeStatusType | "all";
};

export const getAddressChangeRequests = async (
  params: AddressChangeRequestPaginationParams
): Promise<Result<PaginatedAddressChangeRequestsResult, DatabaseError>> => {
  try {
    const { page, pageSize, statusFilter, searchQuery } = params;
    const skip = (page - 1) * pageSize;

    const whereClause: Prisma.AddressChangeWhereInput = {};

    if (statusFilter && statusFilter !== "all") {
      whereClause.status = statusFilter;
    }

    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim();

      whereClause.OR = [
        {
          student: {
            firstName: {
              mode: "insensitive",
              contains: searchTerm,
            },
          },
        },
        {
          student: {
            middleName: {
              mode: "insensitive",
              contains: searchTerm,
            },
          },
        },
        {
          student: {
            lastName: {
              mode: "insensitive",
              contains: searchTerm,
            },
          },
        },
        {
          student: {
            user: {
              name: {
                mode: "insensitive",
                contains: searchTerm,
              },
            },
          },
        },
        {
          student: {
            user: {
              email: {
                mode: "insensitive",
                contains: searchTerm,
              },
            },
          },
        },
        {
          newStation: {
            name: {
              mode: "insensitive",
              contains: searchTerm,
            },
          },
        },
        {
          currentStation: {
            name: {
              mode: "insensitive",
              contains: searchTerm,
            },
          },
        },
      ];
    }

    const [requests, totalCount] = await Promise.all([
      prisma.addressChange.findMany({
        skip,
        take: pageSize,
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              class: {
                include: {
                  year: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                    },
                  },
                  branch: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          newStation: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          currentStation: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          reviewedBy: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      }),
      prisma.addressChange.count({
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
      data: requests,
      hasPreviousPage,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching address change requests:", error);
    return failure(databaseError("Failed to fetch address change requests"));
  }
};

export const reviewAddressChangeRequest = async (
  requestId: string,
  adminId: string,
  status: "Approved" | "Rejected"
): Promise<
  Result<AddressChange, DatabaseError | ValidationError | AuthError>
> => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: adminId },
      select: { isActive: true },
    });

    if (!admin) {
      return failure(authError("Admin not found"));
    }

    if (!admin.isActive) {
      return failure(authError("Admin account is not active"));
    }

    const addressChangeRequest = await prisma.addressChange.findUnique({
      where: { id: requestId },
      include: {
        student: true,
      },
    });

    if (!addressChangeRequest) {
      return failure(
        validationError("Address change request not found", "requestId")
      );
    }

    if (addressChangeRequest.status !== "Pending") {
      return failure(
        validationError("Request has already been reviewed", "status")
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.addressChange.update({
        where: { id: requestId },
        data: {
          status,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });

      if (status === "Approved") {
        await tx.student.update({
          where: { userId: addressChangeRequest.studentId },
          data: {
            address: addressChangeRequest.newAddress,
            stationId: addressChangeRequest.newStationId,
          },
        });
      }

      return updatedRequest;
    });

    revalidatePath("/dashboard/admin/address-change-requests");
    revalidatePath("/dashboard/admin/profile");

    return success(result);
  } catch (error) {
    console.error("Error reviewing address change request:", error);
    return failure(databaseError("Failed to review address change request"));
  }
};

export const getAddressChangeRequestDetails = async (
  requestId: string
): Promise<
  Result<AddressChangeRequestItem, DatabaseError | ValidationError>
> => {
  try {
    const request = await prisma.addressChange.findUnique({
      where: { id: requestId },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            class: {
              include: {
                year: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
                branch: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        newStation: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        currentStation: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        reviewedBy: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      return failure(
        validationError("Address change request not found", "requestId")
      );
    }

    return success(request);
  } catch (error) {
    console.error("Error fetching address change request details:", error);
    return failure(
      databaseError("Failed to fetch address change request details")
    );
  }
};
