"use client";

import { getConcessions, type Concession, type PaginatedResult, type PaginationParams } from "@/actions/concession";
import { ConcessionApplicationTypeType, ConcessionApplicationStatusType } from "@/generated/zod";
import Link from "next/link";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { toTitleCase } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useCallback } from "react";
import { Small, Heading3 } from "@/components/ui/typography";
import ApplicationsTable from "@/components/student/applications-table";

type FilterParams = {
	status?: ConcessionApplicationStatusType | "all";
	applicationType?: ConcessionApplicationTypeType | "all";
};

const Student = () => {
	const { data, isPending } = authClient.useSession();
	const [isError, setIsError] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [paginationData, setPaginationData] = useState<PaginatedResult<Concession>>({
		data: [],
		totalCount: 0,
		totalPages: 0,
		currentPage: 1,
		hasNextPage: false,
		hasPreviousPage: false
	});

	const [pageSize] = useState<number>(10);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [statusFilter, setStatusFilter] = useState<ConcessionApplicationStatusType | "all" | "">("");
	const [typeFilter, setTypeFilter] = useState<ConcessionApplicationTypeType | "all" | "">("");

	const fetchConcessions = useCallback(
		async (page: number = currentPage, filters: FilterParams = {}): Promise<void> => {
			if (!data?.user?.id) {
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				setIsError(false);

				const params: PaginationParams = {
					page,
					pageSize,
					statusFilter: (filters.status === "all"
						? undefined
						: filters.status || statusFilter) as ConcessionApplicationStatusType,
					typeFilter: (filters.applicationType === "all"
						? undefined
						: filters.applicationType || typeFilter) as ConcessionApplicationTypeType
				};

				const result = await getConcessions(data.user.id, params);

				if (result.isSuccess) {
					setPaginationData(result.data);
				} else {
					setIsError(true);
					console.error("Failed to fetch concessions:", result.error);
				}
			} catch (error) {
				setIsError(true);
				const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
				console.error("Error loading applications:", errorMessage);

				toast.error("Failed to Load Applications", {
					description: "Unable to load your applications. Please try again."
				});
			} finally {
				setIsLoading(false);
			}
		},
		[pageSize, currentPage, typeFilter, statusFilter, data?.user?.id]
	);

	useEffect(() => {
		void fetchConcessions();
	}, [fetchConcessions]);

	const handlePageChange = useCallback((newPage: number): void => {
		setCurrentPage(newPage);
	}, []);

	const handleFilterChange = useCallback(
		(filters: FilterParams): void => {
			setCurrentPage(1);

			if (filters.status !== undefined) {
				setStatusFilter(filters.status === "all" ? "" : filters.status);
			}

			if (filters.applicationType !== undefined) {
				setTypeFilter(filters.applicationType === "all" ? "" : filters.applicationType);
			}

			void fetchConcessions(1, filters);
		},
		[fetchConcessions]
	);

	return (
		<div className="py-8 px-6 lg:px-8 space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="space-y-2">
					<Heading3 className="text-2xl font-semibold">
						Welcome,{" "}
						{isPending ? (
							<Skeleton className="inline-block align-middle h-[1.75rem] w-[8rem]" />
						) : (
							toTitleCase(data?.user?.name ?? "Student")
						)}
					</Heading3>

					<Small className="text-muted-foreground">
						View and manage your concession applications, track their status, and submit new requests here.
					</Small>
				</div>

				<Button asChild className="w-full sm:w-auto">
					<Link href="/dashboard/student/apply-concession">
						<PlusCircle className="mr-2 size-4" />
						New Concession
					</Link>
				</Button>
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

export default Student;
