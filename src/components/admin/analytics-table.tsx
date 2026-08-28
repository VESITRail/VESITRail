"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import { getUserInitials, toTitleCase } from "@/lib/utils";
import { AdminContributionItem } from "@/actions/analytics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ChevronLeft, ChevronRight, Inbox, AlertCircle } from "lucide-react";
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from "@/components/ui/table";

interface AnalyticsTableProps {
	isError: boolean;
	pageSize?: number;
	isLoading: boolean;
	totalPages: number;
	totalCount: number;
	currentPage: number;
	searchQuery: string;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	data: AdminContributionItem[];
	onPageChange: (page: number) => void;
	onSearchChange: (query: string) => void;
}

const AnalyticsTable = ({
	data,
	isError,
	isLoading,
	totalCount,
	totalPages,
	currentPage,
	searchQuery,
	hasNextPage,
	onPageChange,
	pageSize = 10,
	onSearchChange,
	hasPreviousPage
}: AnalyticsTableProps) => {
	const [localSearchQuery, setLocalSearchQuery] = useState<string>(searchQuery);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- We want to update the local search query whenever the searchQuery prop changes, but we don't want to trigger a re-render unnecessarily.
		setLocalSearchQuery(searchQuery);
	}, [searchQuery]);

	const handleSearchSubmit = useCallback(() => {
		onSearchChange(localSearchQuery);
	}, [localSearchQuery, onSearchChange]);

	const handleSearchChange = useCallback(
		(value: string) => {
			setLocalSearchQuery(value);
			if (value === "") {
				onSearchChange("");
			}
		},
		[onSearchChange]
	);

	const handleSearchKeyPress = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				handleSearchSubmit();
			}
		},
		[handleSearchSubmit]
	);

	return (
		<div className="w-full h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						disabled={isLoading}
						value={localSearchQuery}
						className="pl-10 pr-20 h-10"
						onKeyPress={handleSearchKeyPress}
						placeholder="Search by name, email..."
						onChange={(e) => handleSearchChange(e.target.value)}
					/>
					<Button
						size="sm"
						onClick={handleSearchSubmit}
						className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2"
					>
						<Search className="size-3" />
					</Button>
				</div>

				<div className="text-sm text-muted-foreground flex items-center gap-1.5 shrink-0">
					Total Admins:{" "}
					{isLoading ? (
						<Skeleton className="h-4 w-8" />
					) : (
						<span className="font-semibold text-foreground">{totalCount}</span>
					)}
				</div>
			</div>

			<div className="flex-1 min-h-0 rounded-lg border bg-card overflow-hidden flex flex-col">
				{isLoading || (!isError && data.length > 0) ? (
					<div className="overflow-auto flex-1 min-h-0">
						<Table>
							<TableHeader className="sticky top-0 bg-card z-10">
								<TableRow className="hover:bg-transparent border-border/50">
									<TableHead className="font-semibold h-12 text-center px-4">Sr. No.</TableHead>
									<TableHead className="font-semibold h-12 text-left px-4">Admin</TableHead>
									<TableHead className="font-semibold h-12 text-center px-4">Students Reviewed</TableHead>
									<TableHead className="font-semibold h-12 text-center px-4">Address Changes</TableHead>
									<TableHead className="font-semibold h-12 text-center px-4">Applications Reviewed</TableHead>
									<TableHead className="font-semibold h-12 text-center px-4">Total Contribution</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{isLoading
									? Array.from({ length: 5 }).map((_, index) => (
											<TableRow key={index} className="hover:bg-muted/50 border-border/50">
												<TableCell className="p-4 text-center">
													<Skeleton className="h-5 w-8 mx-auto" />
												</TableCell>
												<TableCell className="p-4 text-left">
													<div className="flex items-center gap-3">
														<Skeleton className="size-9 rounded-lg shrink-0" />
														<div className="space-y-1">
															<Skeleton className="h-4 w-32" />
															<Skeleton className="h-3 w-44" />
														</div>
													</div>
												</TableCell>
												<TableCell className="p-4 text-center">
													<Skeleton className="h-5 w-12 mx-auto" />
												</TableCell>
												<TableCell className="p-4 text-center">
													<Skeleton className="h-5 w-12 mx-auto" />
												</TableCell>
												<TableCell className="p-4 text-center">
													<Skeleton className="h-5 w-12 mx-auto" />
												</TableCell>
												<TableCell className="p-4 text-center">
													<Skeleton className="h-5 w-12 mx-auto" />
												</TableCell>
											</TableRow>
										))
									: data.map((item, index) => (
											<TableRow key={item.adminId} className="hover:bg-muted/50 border-border/50">
												<TableCell className="p-4 text-center font-medium text-foreground">
													{(currentPage - 1) * pageSize + index + 1}
												</TableCell>

												<TableCell className="p-4 text-left">
													<div className="flex items-center gap-3">
														<Avatar className="size-9 rounded-lg shrink-0">
															<AvatarImage src={item.image || undefined} alt={toTitleCase(item.name)} />
															<AvatarFallback className="rounded-lg">
																{getUserInitials("Admin", item.name)}
															</AvatarFallback>
														</Avatar>

														<div className="flex flex-col min-w-0">
															<span className="font-medium text-foreground truncate">{toTitleCase(item.name)}</span>
															<span className="text-xs text-muted-foreground truncate">{item.email}</span>
														</div>
													</div>
												</TableCell>

												<TableCell className="p-4 text-center font-medium text-foreground">
													{item.studentsCount.toLocaleString()}
												</TableCell>

												<TableCell className="p-4 text-center font-medium text-foreground">
													{item.addressChangesCount.toLocaleString()}
												</TableCell>

												<TableCell className="p-4 text-center font-medium text-foreground">
													{item.applicationsCount.toLocaleString()}
												</TableCell>

												<TableCell className="p-4 text-center font-medium text-foreground">
													{item.totalContribution.toLocaleString()}
												</TableCell>
											</TableRow>
										))}
							</TableBody>
						</Table>
					</div>
				) : (
					<div className="flex-1 min-h-0 flex flex-col">
						<Table>
							<TableHeader className="bg-card">
								<TableRow className="hover:bg-transparent border-border/50">
									<TableHead className="font-semibold h-12 text-center px-4">Sr. No.</TableHead>
									<TableHead className="font-semibold h-12 text-left px-4">Admin</TableHead>
									<TableHead className="font-semibold h-12 text-center px-4">Students Reviewed</TableHead>
									<TableHead className="font-semibold h-12 text-center px-4">Address Changes</TableHead>
									<TableHead className="font-semibold h-12 text-center px-4">Applications Reviewed</TableHead>
									<TableHead className="font-semibold h-12 text-center px-4">Total Contribution</TableHead>
								</TableRow>
							</TableHeader>
						</Table>

						<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
							{isError ? (
								<div className="flex flex-col items-center space-y-4">
									<div className="p-4 rounded-full bg-destructive/10 text-destructive">
										<AlertCircle className="size-8" />
									</div>

									<div className="space-y-2 text-center">
										<h3 className="text-lg font-semibold text-foreground">Failed to Load Admin Analytics</h3>
										<p className="text-sm text-muted-foreground max-w-md">
											There was an error loading the contribution records.
										</p>
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center space-y-4">
									<div className="p-4 rounded-full bg-primary">
										<Inbox className="size-8 text-white" />
									</div>

									<div className="space-y-2 text-center">
										<h3 className="text-lg font-semibold text-foreground">No admins found</h3>

										<p className="text-sm text-muted-foreground max-w-md">
											{searchQuery || localSearchQuery
												? `No admins found for "${searchQuery || localSearchQuery}".`
												: "No admin contribution records found."}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			<div className="shrink-0 flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
				<div className="text-sm text-muted-foreground order-2 sm:order-1">
					{isLoading ? (
						<Skeleton className="h-5 w-52" />
					) : totalCount > 0 ? (
						<>
							Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of{" "}
							{totalCount} admin(s)
						</>
					) : (
						"Showing 0 of 0 admins"
					)}
				</div>

				<div className="flex items-center justify-center gap-3 order-1 sm:order-2">
					{isLoading ? (
						<>
							<Skeleton className="size-8" />
							<Skeleton className="h-6 w-20" />
							<Skeleton className="size-8" />
						</>
					) : (
						<>
							<Button
								size="sm"
								variant="outline"
								className="size-8 p-0"
								disabled={!hasPreviousPage}
								onClick={() => onPageChange(currentPage - 1)}
							>
								<ChevronLeft className="size-4" />
							</Button>

							<div className="flex items-center gap-2 px-3">
								<span className="text-sm font-medium text-foreground">{totalPages === 0 ? 0 : currentPage}</span>
								<span className="text-sm text-muted-foreground">of</span>
								<span className="text-sm font-medium text-foreground">{totalPages}</span>
							</div>

							<Button
								size="sm"
								variant="outline"
								className="size-8 p-0"
								disabled={!hasNextPage}
								onClick={() => onPageChange(currentPage + 1)}
							>
								<ChevronRight className="size-4" />
							</Button>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default AnalyticsTable;
