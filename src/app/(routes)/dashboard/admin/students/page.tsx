"use client";

import {
	getStudents,
	StudentDetails,
	type PaginatedStudentsResult,
	type StudentPaginationParams
} from "@/actions/student";
import { toast } from "sonner";
import posthog from "posthog-js";
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
	const [paginationData, setPaginationData] = useState<PaginatedStudentsResult>({
		data: [],
		totalCount: 0,
		totalPages: 0,
		currentPage: 1,
		hasNextPage: false,
		hasPreviousPage: false
	});

	const [filters, setFilters] = useState<FilterParams>({
		status: "all"
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
					statusFilter: (statusFilter === "all" ? undefined : statusFilter) as StudentApprovalStatusType,
					searchQuery: searchTerm?.trim() || undefined
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
				const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
				console.error("Error loading students:", errorMessage);

				toast.error("Failed to Load Students", {
					description: "Unable to load student data. Please try again."
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
			posthog.capture("students_filtered", {
				filters: newFilters.status || "all"
			});
			loadStudents(1, 10, newFilters.status, searchQuery);
		},
		[loadStudents, searchQuery]
	);

	const handleSearchChange = useCallback(
		(query: string) => {
			setSearchQuery(query);

			const timeoutId = setTimeout(() => {
				if (query.trim()) {
					posthog.capture("students_searched", {
						query: query.trim()
					});
				}
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
							class: updatedStudent.class,
							status: updatedStudent.status,
							gender: updatedStudent.gender,
							station: updatedStudent.station,
							lastName: updatedStudent.lastName,
							firstName: updatedStudent.firstName,
							middleName: updatedStudent.middleName,
							reviewedAt: updatedStudent.reviewedAt,
							rejectionReason: updatedStudent.rejectionReason,
							user: {
								...student.user,
								name: updatedStudent.user.name
							}
						}
					: student
			)
		}));
	}, []);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- loadStudents is async; it sets loading/error state before awaiting the fetch, which matches React's documented data-fetching effect pattern. Safe: no state is derived synchronously from props/state outside the fetch.
		loadStudents();
	}, [loadStudents]);

	if (isPending) {
		return (
			<div className="h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] flex flex-col p-6 lg:px-8 space-y-4 overflow-hidden">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
					<div className="space-y-2">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-96" />
					</div>
				</div>

				<Separator className="shrink-0" />

				<div className="flex-1 min-h-0 overflow-hidden flex flex-col space-y-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center shrink-0">
						<Skeleton className="h-10 flex-1 max-w-sm" />
						<Skeleton className="h-10 w-36" />
						<Skeleton className="h-10 w-28" />
					</div>

					<div className="flex-1 min-h-0 rounded-lg border bg-card p-6 overflow-hidden">
						<div className="space-y-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					</div>

					<div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between shrink-0">
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
		<div className="h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] flex flex-col p-6 lg:px-8 space-y-4 overflow-hidden">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
				<div className="space-y-2">
					<Heading3 className="text-2xl font-semibold">Manage Students</Heading3>

					<Small className="text-muted-foreground">
						Review and manage students, approve or reject pending requests, and view detailed student information.
					</Small>
				</div>
			</div>

			<Separator className="shrink-0" />

			<div className="flex-1 min-h-0 overflow-hidden flex flex-col">
				<StudentsTable
					isError={isError}
					isLoading={isLoading}
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
