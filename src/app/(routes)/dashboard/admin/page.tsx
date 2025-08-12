"use client";

import {
  PaginatedResult,
  AdminApplication,
  getAllApplications,
  AdminApplicationParams,
} from "@/actions/concession";
import {
  ConcessionApplicationTypeType,
  ConcessionApplicationStatusType,
} from "@/generated/zod";
import { toast } from "sonner";
import { toTitleCase } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useState, useCallback, useEffect } from "react";
import ApplicationsTable from "@/components/admin/applications-table";

const Admin = () => {
  const { data, isPending } = authClient.useSession();
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [statusFilter, setStatusFilter] = useState<
    ConcessionApplicationStatusType | "all"
  >("all");
  const [typeFilter, setTypeFilter] = useState<
    ConcessionApplicationTypeType | "all"
  >("all");

  const [paginationData, setPaginationData] = useState<
    PaginatedResult<AdminApplication>
  >({
    data: [],
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const loadApplications = useCallback(
    async (
      page: number = 1,
      filters: {
        searchQuery?: string;
        status?: ConcessionApplicationStatusType | "all";
        applicationType?: ConcessionApplicationTypeType | "all";
      } = {}
    ) => {
      if (isPending || !data?.user?.id) return;

      try {
        setIsLoading(true);
        setIsError(false);

        const params: AdminApplicationParams = {
          page,
          pageSize: 10,
          statusFilter: (filters.status === "all"
            ? undefined
            : filters.status ||
              statusFilter) as ConcessionApplicationStatusType,
          typeFilter: (filters.applicationType === "all"
            ? undefined
            : filters.applicationType ||
              typeFilter) as ConcessionApplicationTypeType,
          searchQuery: filters.searchQuery || searchQuery,
        };

        const result = await getAllApplications(data.user.id, params);

        if (result.isSuccess) {
          setPaginationData(result.data);
        } else {
          setIsError(true);
          console.error("Failed to fetch applications:", result.error);
          toast.error("Failed to Load Applications", {
            description: "Unable to load applications. Please try again.",
          });
        }
      } catch (error) {
        setIsError(true);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error loading applications:", errorMessage);

        toast.error("Failed to Load Applications", {
          description: "Unable to load applications. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [data?.user?.id, isPending, statusFilter, typeFilter, searchQuery]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      loadApplications(page);
    },
    [loadApplications]
  );

  const handleFilterChange = useCallback(
    (filters: {
      status?: ConcessionApplicationStatusType | "all";
      applicationType?: ConcessionApplicationTypeType | "all";
      searchQuery?: string;
    }) => {
      if (filters.status !== undefined) setStatusFilter(filters.status);
      if (filters.applicationType !== undefined)
        setTypeFilter(filters.applicationType);
      if (filters.searchQuery !== undefined)
        setSearchQuery(filters.searchQuery);

      loadApplications(1, filters);
    },
    [loadApplications]
  );

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  if (isPending) {
    return (
      <div className="py-8 px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <Skeleton className="h-px w-full" />

        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3 flex-wrap">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-36" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>

          <div className="rounded-lg border bg-card p-8">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
            <Skeleton className="h-5 w-52" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-8" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="size-8" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Welcome,{" "}
            {isPending ? (
              <Skeleton className="inline-block align-middle h-[1.75rem] w-[8rem]" />
            ) : (
              toTitleCase(data?.user?.name ?? "Admin")
            )}
          </h1>
          <p className="text-muted-foreground">
            View and manage all concession applications submitted by students.
          </p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="my-7">
        <ApplicationsTable
          isError={isError}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          applications={paginationData.data}
          onFilterChange={handleFilterChange}
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

export default Admin;
