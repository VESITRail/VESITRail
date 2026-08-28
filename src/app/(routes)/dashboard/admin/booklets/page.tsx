"use client";

import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useState, useCallback, useEffect } from "react";
import { ConcessionBookletStatusType } from "@/generated/zod";
import BookletsTable from "@/components/admin/booklets-table";
import { getBooklets, BookletPaginationParams, PaginatedBookletsResult } from "@/actions/booklets";

type FilterParams = {
	status?: ConcessionBookletStatusType | "all";
};

const Booklets = () => {
	const router = useRouter();
	const { data, isPending } = authClient.useSession();

	const [isError, setIsError] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [paginationData, setPaginationData] = useState<PaginatedBookletsResult>({
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

	const loadBooklets = useCallback(
		async (page: number = 1, pageSize: number = 10, statusFilter?: FilterParams["status"], searchTerm?: string) => {
			if (isPending || !data?.user?.id) return;

			try {
				setIsLoading(true);
				setIsError(false);

				const params: BookletPaginationParams = {
					page,
					pageSize,
					searchQuery: searchTerm?.trim() || undefined,
					statusFilter: statusFilter === "all" ? undefined : statusFilter
				};

				const result = await getBooklets(params);

				if (result.isSuccess) {
					setPaginationData(result.data);
				} else {
					setIsError(true);
					console.error("Failed to fetch booklets:", result.error);
				}
			} catch (error) {
				setIsError(true);
				const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
				console.error("Error loading booklets:", errorMessage);

				toast.error("Failed to Load Booklets", {
					description: "Unable to load booklets. Please try again."
				});
			} finally {
				setIsLoading(false);
			}
		},
		[data?.user?.id, isPending]
	);

	const handlePageChange = useCallback(
		(page: number) => {
			loadBooklets(page, 10, filters.status, searchQuery);
		},
		[loadBooklets, filters.status, searchQuery]
	);

	const handleFilterChange = useCallback(
		(newFilters: FilterParams) => {
			setFilters((prev) => ({ ...prev, ...newFilters }));
			loadBooklets(1, 10, newFilters.status, searchQuery);
		},
		[loadBooklets, searchQuery]
	);

	const handleSearchChange = useCallback(
		(query: string) => {
			setSearchQuery(query);

			const timeoutId = setTimeout(() => {
				loadBooklets(1, 10, filters.status, query);
			}, 300);

			return () => clearTimeout(timeoutId);
		},
		[loadBooklets, filters.status]
	);

	const handleBookletDelete = useCallback((deletedBookletId: string) => {
		setPaginationData((prev) => ({
			...prev,
			totalCount: prev.totalCount - 1,
			data: prev.data.filter((booklet) => booklet.id !== deletedBookletId)
		}));
	}, []);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- loadBooklets is async; it sets loading/error state before awaiting the fetch, which matches React's documented data-fetching effect pattern. Safe: no state is derived synchronously from props/state outside the fetch.
		loadBooklets();
	}, [loadBooklets]);

	if (isPending) {
		return (
			<div className="h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] flex flex-col p-6 lg:px-8 space-y-4 overflow-hidden">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
					<div className="space-y-2">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-96" />
					</div>
					<Skeleton className="h-10 w-32 shrink-0" />
				</div>

				<Separator className="shrink-0" />

				<div className="flex-1 min-h-0 overflow-hidden flex flex-col space-y-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
						<Skeleton className="h-10 flex-1 max-w-sm" />
						<div className="flex gap-3">
							<Skeleton className="h-10 w-36" />
							<Skeleton className="h-10 w-28" />
						</div>
					</div>

					<div className="flex-1 min-h-0 rounded-lg border bg-card p-6 overflow-hidden">
						<div className="space-y-4">
							{Array.from({ length: 8 }).map((_, index) => (
								<Skeleton key={index} className="h-12 w-full" />
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
					<h1 className="text-2xl font-semibold">Concession Booklets</h1>
					<p className="text-muted-foreground">Manage concession booklets and track their usage</p>
				</div>

				<Button onClick={() => router.push("/dashboard/admin/booklets/create")} className="shrink-0">
					<Plus className="size-4" />
					Create Booklet
				</Button>
			</div>

			<Separator className="shrink-0" />

			<div className="flex-1 min-h-0 overflow-hidden flex flex-col">
				<BookletsTable
					isError={isError}
					isLoading={isLoading}
					searchQuery={searchQuery}
					booklets={paginationData.data}
					onPageChange={handlePageChange}
					onFilterChange={handleFilterChange}
					onSearchChange={handleSearchChange}
					onBookletDelete={handleBookletDelete}
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

export default Booklets;
