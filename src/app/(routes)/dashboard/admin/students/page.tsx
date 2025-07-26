"use client";

import {
  getStudents,
  StudentDetails,
  type PaginatedStudentsResult,
  type StudentPaginationParams,
} from "@/actions/student";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useCallback } from "react";
import { StudentApprovalStatusType } from "@/generated/zod";
import { Small, Heading3 } from "@/components/ui/typography";
import StudentsTable from "@/components/admin/students-table";

type FilterParams = {
  status?: StudentApprovalStatusType | "all";
};

const Students = () => {
  const { data, isPending } = authClient.useSession();

  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [paginationData, setPaginationData] = useState<PaginatedStudentsResult>(
    {
      data: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  );

  const [filters, setFilters] = useState<FilterParams>({
    status: "all",
  });

  const loadStudents = useCallback(
    async (
      page: number = 1,
      pageSize: number = 10,
      statusFilter?: StudentApprovalStatusType | "all",
      searchTerm?: string
    ) => {
      if (isPending || !data?.user?.id) return;

      try {
        setIsLoading(true);
        setIsError(false);

        const params: StudentPaginationParams = {
          page,
          pageSize,
          statusFilter: (statusFilter === "all"
            ? undefined
            : statusFilter) as StudentApprovalStatusType,
          searchQuery: searchTerm?.trim() || undefined,
        };

        const result = await getStudents(params);

        if (result.isSuccess) {
          setPaginationData(result.data);
        } else {
          setIsError(true);
          console.error("Failed to fetch students:", result.error);
        }
      } catch (error) {
        setIsError(true);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error loading students:", errorMessage);

        toast.error("Failed to Load Students", {
          description: "Unable to load student data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [data?.user?.id, isPending]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      loadStudents(page, 10, filters.status, searchQuery);
    },
    [loadStudents, filters.status, searchQuery]
  );

  const handleFilterChange = useCallback(
    (newFilters: FilterParams) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      loadStudents(1, 10, newFilters.status, searchQuery);
    },
    [loadStudents, searchQuery]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      const timeoutId = setTimeout(() => {
        loadStudents(1, 10, filters.status, query);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [loadStudents, filters.status]
  );

  const handleStudentUpdate = useCallback((updatedStudent: StudentDetails) => {
    setPaginationData((prev) => ({
      ...prev,
      data: prev.data.map((student) =>
        student.userId === updatedStudent.userId
          ? {
              ...student,
              status: updatedStudent.status,
              reviewedAt: updatedStudent.reviewedAt,
              rejectionReason: updatedStudent.rejectionReason,
            }
          : student
      ),
    }));
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  if (isPending) {
    return (
      <div className="py-8 px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-10 flex-1 max-w-sm" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
          </div>

          <div className="rounded-lg border bg-card">
            <div className="p-4">
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
            <Skeleton className="h-5 w-40" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
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
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Users className="size-5.5" />
            </div>

            <Heading3 className="text-2xl font-semibold">
              Manage Students
            </Heading3>
          </div>

          <Small className="text-muted-foreground">
            Review and manage students, approve or reject pending requests, and
            view detailed student information.
          </Small>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="my-7">
        <StudentsTable
          isError={isError}
          isLoading={isLoading}
          adminId={data.user.id}
          searchQuery={searchQuery}
          students={paginationData.data}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          onStudentUpdate={handleStudentUpdate}
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

export default Students;
