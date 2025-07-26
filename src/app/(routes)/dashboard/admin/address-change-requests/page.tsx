"use client";

import {
  getAddressChangeRequests,
  AddressChangeRequestItem,
  AddressChangeRequestPaginationParams,
  PaginatedAddressChangeRequestsResult,
} from "@/actions/address-change-requests";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useCallback } from "react";
import { AddressChangeStatusType } from "@/generated/zod";
import AddressChangeRequestsTable from "@/components/admin/address-change-requests-table";

type FilterParams = {
  status?: AddressChangeStatusType | "all";
};

const AddressChangeRequests = () => {
  const { data, isPending } = authClient.useSession();

  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [paginationData, setPaginationData] =
    useState<PaginatedAddressChangeRequestsResult>({
      data: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [filters, setFilters] = useState<FilterParams>({
    status: "all",
  });

  const loadAddressChangeRequests = useCallback(
    async (
      page: number = 1,
      pageSize: number = 10,
      statusFilter?: AddressChangeStatusType | "all",
      searchTerm?: string
    ) => {
      if (isPending || !data?.user?.id) return;

      try {
        setIsLoading(true);
        setIsError(false);

        const params: AddressChangeRequestPaginationParams = {
          page,
          pageSize,
          statusFilter: (statusFilter === "all"
            ? undefined
            : statusFilter) as AddressChangeStatusType,
          searchQuery: searchTerm?.trim() || undefined,
        };

        const result = await getAddressChangeRequests(params);

        if (result.isSuccess) {
          setPaginationData(result.data);
        } else {
          setIsError(true);
          console.error(
            "Failed to fetch address change requests:",
            result.error
          );
        }
      } catch (error) {
        setIsError(true);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error loading address change requests:", errorMessage);

        toast.error("Failed to Load Requests", {
          description:
            "Unable to load address change requests. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [data?.user?.id, isPending]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      loadAddressChangeRequests(page, 10, filters.status, searchQuery);
    },
    [loadAddressChangeRequests, filters.status, searchQuery]
  );

  const handleFilterChange = useCallback(
    (newFilters: FilterParams) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      loadAddressChangeRequests(1, 10, newFilters.status, searchQuery);
    },
    [loadAddressChangeRequests, searchQuery]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      const timeoutId = setTimeout(() => {
        loadAddressChangeRequests(1, 10, filters.status, query);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [loadAddressChangeRequests, filters.status]
  );

  const handleRequestUpdate = useCallback(
    (updatedRequest: AddressChangeRequestItem) => {
      setPaginationData((prev) => ({
        ...prev,
        data: prev.data.map((request) =>
          request.id === updatedRequest.id
            ? {
                ...request,
                status: updatedRequest.status,
                reviewedAt: updatedRequest.reviewedAt,
              }
            : request
        ),
      }));
    },
    []
  );

  useEffect(() => {
    loadAddressChangeRequests();
  }, [loadAddressChangeRequests]);

  if (isPending) {
    return (
      <div className="py-8 px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.user?.id) {
    return null;
  }

  return (
    <div className="py-8 px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Address Change Requests</h1>
          <p className="text-muted-foreground">
            Review and manage student address change requests
          </p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="my-7">
        <AddressChangeRequestsTable
          isError={isError}
          isLoading={isLoading}
          adminId={data.user.id}
          searchQuery={searchQuery}
          requests={paginationData.data}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          onRequestUpdate={handleRequestUpdate}
          totalCount={paginationData.totalCount}
          totalPages={paginationData.totalPages}
          currentPage={paginationData.currentPage}
          hasNextPage={paginationData.hasNextPage}
          hasPreviousPage={paginationData.hasPreviousPage}
        />
      </div>
    </div>
  );
};

export default AddressChangeRequests;
