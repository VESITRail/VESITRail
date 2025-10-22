import { Inbox, Filter, XCircle, History, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from "@/components/ui/select";
import { ColumnDef, flexRender, useReactTable, VisibilityState, getCoreRowModel } from "@tanstack/react-table";
import { Dialog, DialogTitle, DialogHeader, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { ConcessionApplicationTypeType, ConcessionApplicationStatusType } from "@/generated/zod";
import { format } from "date-fns";
import Status from "../ui/status";
import { Separator } from "../ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Concession } from "@/actions/concession";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useCallback, useState, useMemo } from "react";

type SortOrder = "asc" | "desc";
type Station = NonNullable<Concession>["station"];
type ApplicationStatus = NonNullable<Concession>["status"];
type ApplicationType = NonNullable<Concession>["applicationType"];
type ConcessionClass = NonNullable<Concession>["concessionClass"];
type ConcessionPeriod = NonNullable<Concession>["concessionPeriod"];
type PreviousApplication = NonNullable<Concession>["previousApplication"];

const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
	const variants = {
		Rejected: "bg-red-600 text-white",
		Pending: "bg-amber-600 text-white",
		Approved: "bg-green-600 text-white"
	};

	return <Badge className={`${variants[status]} font-medium`}>{status}</Badge>;
};

const ApplicationTypeBadge = ({ type }: { type: ApplicationType }) => {
	return (
		<Badge variant="secondary" className="font-medium">
			{type}
		</Badge>
	);
};

const PreviousApplicationDialog = ({ previousApplication }: { previousApplication: PreviousApplication }) => {
	if (!previousApplication) return null;

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size="sm"
					variant="ghost"
					title="View previous application details"
					className="size-6 p-0 text-muted-foreground hover:text-foreground"
				>
					<History className="size-4" />
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Previous Application Details</DialogTitle>
				</DialogHeader>

				<Separator className="my-2" />

				<div className="space-y-6">
					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Status</p>
							<StatusBadge status={previousApplication.status} />
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Type</p>
							<ApplicationTypeBadge type={previousApplication.applicationType} />
						</div>
					</div>

					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Class</p>
							<p className="font-medium text-foreground/90">
								{previousApplication.concessionClass.name} ({previousApplication.concessionClass.code})
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Period</p>
							<p className="font-medium text-foreground/90">
								{previousApplication.concessionPeriod.name} ({previousApplication.concessionPeriod.duration}{" "}
								{previousApplication.concessionPeriod.duration === 1 ? "month" : "months"})
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Home Station</p>
							<p className="font-medium text-foreground/90">
								{previousApplication.station.name} ({previousApplication.station.code})
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">Applied Date</p>
							<p className="font-medium text-foreground/90">
								{format(new Date(previousApplication.createdAt), "MMMM dd, yyyy")}
							</p>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const createColumns = (onSortChange: (column: string) => void, currentPage: number): ColumnDef<Concession>[] => [
	{
		size: 80,
		id: "serialNo",
		header: "Sr. No.",
		cell: ({ row, table }) => {
			const pageSize = 10;
			const sortedRows = table.getRowModel().rows;
			const indexInSorted = sortedRows.findIndex((r) => r.id === row.id);

			const serialNo = (currentPage - 1) * pageSize + indexInSorted + 1;

			return <div className="font-medium text-foreground">{serialNo}</div>;
		}
	},
	{
		size: 100,
		header: "ID",
		id: "shortId",
		accessorKey: "shortId",
		cell: ({ row }) => {
			const shortId = row.getValue("shortId") as number;
			return <div className="font-mono text-sm font-medium text-foreground">#{shortId}</div>;
		}
	},
	{
		size: 150,
		header: "Type",
		accessorKey: "applicationType",
		cell: ({ row }) => {
			const type = row.getValue("applicationType") as ApplicationType;

			const previousApplication = row.original?.previousApplication;

			return (
				<div className="flex items-center justify-center gap-2">
					<ApplicationTypeBadge type={type} />

					{type === "Renewal" && previousApplication && (
						<PreviousApplicationDialog previousApplication={previousApplication} />
					)}
				</div>
			);
		},
		filterFn: (row, id, value) => {
			const type = row.getValue(id) as ApplicationType;
			const searchValue = value.toLowerCase().trim();

			return type.toLowerCase().startsWith(searchValue);
		}
	},
	{
		size: 120,
		accessorKey: "status",
		cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
		header: () => {
			return (
				<Button variant="ghost" className="h-auto py-2 font-semibold" onClick={() => onSortChange("status")}>
					Status
					<ArrowUpDown className="ml-2 size-4" />
				</Button>
			);
		}
	},
	{
		size: 200,
		header: "Class",
		accessorKey: "concessionClass",
		cell: ({ row }) => {
			const concessionClass = row.getValue("concessionClass") as ConcessionClass;

			return (
				<div className="font-medium text-foreground/90">
					{concessionClass.name} ({concessionClass.code})
				</div>
			);
		}
	},
	{
		size: 150,
		header: "Period",
		accessorKey: "concessionPeriod",
		cell: ({ row }) => {
			const period = row.getValue("concessionPeriod") as ConcessionPeriod;

			return <div className="font-medium text-foreground/90">{period.name}</div>;
		}
	},
	{
		size: 180,
		accessorKey: "station",
		header: "Home Station",
		cell: ({ row }) => {
			const station = row.getValue("station") as Station;

			return (
				<div className="font-medium text-foreground/90">
					{station.name} ({station.code})
				</div>
			);
		}
	},
	{
		size: 150,
		accessorKey: "createdAt",
		header: () => {
			return (
				<Button variant="ghost" className="h-auto py-2 font-semibold" onClick={() => onSortChange("createdAt")}>
					Applied Date
					<ArrowUpDown className="ml-2 size-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const date = new Date(row.getValue("createdAt"));
			return <div className="font-medium text-foreground/90">{format(date, "MMMM dd, yyyy")}</div>;
		}
	}
];

type ApplicationsTableProps = {
	isError: boolean;
	isLoading: boolean;
	totalCount: number;
	totalPages: number;
	currentPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	applications: Concession[];
	onPageChange: (page: number) => void;
	onFilterChange: (filters: {
		status?: ConcessionApplicationStatusType | "all";
		applicationType?: ConcessionApplicationTypeType | "all";
	}) => void;
};

const ApplicationsTable = ({
	isError,
	isLoading,
	totalCount,
	totalPages,
	currentPage,
	hasNextPage,
	applications,
	onPageChange,
	onFilterChange,
	hasPreviousPage
}: ApplicationsTableProps) => {
	const [selectedType, setSelectedType] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: SortOrder;
	} | null>(null);

	const sortedApplications = useMemo(() => {
		if (!sortConfig) {
			return applications;
		}

		return [...applications].sort((a, b) => {
			if (!a || !b) return 0;

			let aValue: string | Date;
			let bValue: string | Date;

			switch (sortConfig.key) {
				case "status":
					aValue = a.status;
					bValue = b.status;
					break;
				case "createdAt":
					aValue = new Date(a.createdAt);
					bValue = new Date(b.createdAt);
					break;
				default:
					return 0;
			}

			if (aValue < bValue) {
				return sortConfig.direction === "asc" ? -1 : 1;
			}
			if (aValue > bValue) {
				return sortConfig.direction === "asc" ? 1 : -1;
			}
			return 0;
		});
	}, [applications, sortConfig]);

	const handleSort = useCallback((column: string) => {
		setSortConfig((current) => {
			if (current?.key === column) {
				return {
					key: column,
					direction: current.direction === "asc" ? "desc" : "asc"
				};
			}
			return {
				key: column,
				direction: "asc"
			};
		});
	}, []);

	const columns = createColumns(handleSort, currentPage);

	const handleStatusFilter = useCallback(
		(value: string): void => {
			setSelectedStatus(value);
			onFilterChange({
				status: value as ConcessionApplicationStatusType | "all"
			});
		},
		[onFilterChange]
	);

	const handleTypeFilter = useCallback(
		(value: string): void => {
			setSelectedType(value);
			onFilterChange({
				applicationType: value as ConcessionApplicationTypeType | "all"
			});
		},
		[onFilterChange]
	);

	const table = useReactTable<Concession>({
		state: {
			columnVisibility
		},
		columns,
		manualSorting: true,
		manualFiltering: true,
		pageCount: totalPages,
		manualPagination: true,
		data: sortedApplications,
		getCoreRowModel: getCoreRowModel(),
		onColumnVisibilityChange: setColumnVisibility
	});

	const renderPagination = () => (
		<div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
			<div className="text-sm text-muted-foreground order-2 sm:order-1">
				{isLoading ? (
					<Skeleton className="h-5 w-52" />
				) : totalCount > 0 ? (
					<>
						Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount}{" "}
						application(s)
					</>
				) : (
					"Showing 0 of 0 applications"
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
	);

	const renderFilters = () => (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
			<div className="flex gap-3">
				{isLoading ? (
					<>
						<Skeleton className="h-10 w-36" />
						<Skeleton className="h-10 w-36" />
					</>
				) : (
					<>
						<Select value={selectedType} onValueChange={handleTypeFilter}>
							<SelectTrigger className="w-36 !h-10 !text-foreground cursor-pointer">
								<Filter className="mr-2 size-4 text-foreground" />
								<SelectValue placeholder="Type" />
							</SelectTrigger>

							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value="New">New</SelectItem>
								<SelectItem value="Renewal">Renewal</SelectItem>
							</SelectContent>
						</Select>

						<Select value={selectedStatus} onValueChange={handleStatusFilter}>
							<SelectTrigger className="w-36 !h-10 !text-foreground cursor-pointer">
								<Filter className="mr-2 size-4 text-foreground" />
								<SelectValue placeholder="Status" />
							</SelectTrigger>

							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="Pending">Pending</SelectItem>
								<SelectItem value="Approved">Approved</SelectItem>
								<SelectItem value="Rejected">Rejected</SelectItem>
							</SelectContent>
						</Select>
					</>
				)}
			</div>

			<div className="flex gap-3 sm:ml-auto">
				{isLoading ? (
					<Skeleton className="h-10 w-28" />
				) : (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="w-28 h-10">
								Columns
								<ChevronDown className="ml-2 size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44">
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value: boolean) => column.toggleVisibility(value)}
										>
											{column.id === "applicationType"
												? "Type"
												: column.id === "concessionClass"
													? "Class"
													: column.id === "concessionPeriod"
														? "Period"
														: column.id === "station"
															? "Home Station"
															: column.id === "createdAt"
																? "Applied Date"
																: column.id === "serialNo"
																	? "Sr. No."
																	: column.id === "shortId"
																		? "ID"
																		: column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);

	if (isLoading) {
		return (
			<div className="w-full space-y-6">
				{renderFilters()}

				<div className="rounded-lg border bg-card">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent border-border/50">
								<TableHead className="font-semibold h-12 text-center px-4 w-[80px]">
									<Skeleton className="h-4 w-12 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-[100px]">
									<Skeleton className="h-4 w-16 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-[150px]">
									<Skeleton className="h-4 w-12 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-[120px]">
									<Skeleton className="h-4 w-14 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-[200px]">
									<Skeleton className="h-4 w-12 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-[150px]">
									<Skeleton className="h-4 w-16 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-[180px]">
									<Skeleton className="h-4 w-20 mx-auto" />
								</TableHead>
								<TableHead className="font-semibold h-12 text-center px-4 w-[150px]">
									<Skeleton className="h-4 w-20 mx-auto" />
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{Array.from({ length: 10 }).map((_, index) => (
								<TableRow key={index} className="hover:bg-muted/50 border-border/50">
									<TableCell className="p-4 text-center">
										<Skeleton className="h-4 w-6 mx-auto" />
									</TableCell>
									<TableCell className="p-4 text-center">
										<Skeleton className="h-4 w-12 mx-auto" />
									</TableCell>
									<TableCell className="p-4 text-center">
										<div className="flex items-center justify-center gap-2">
											<Skeleton className="h-6 w-16 rounded-md" />
											<Skeleton className="h-6 w-6 rounded" />
										</div>
									</TableCell>
									<TableCell className="p-4 text-center">
										<Skeleton className="h-6 w-16 rounded-full mx-auto" />
									</TableCell>
									<TableCell className="p-4 text-center">
										<Skeleton className="h-4 w-28 mx-auto" />
									</TableCell>
									<TableCell className="p-4 text-center">
										<Skeleton className="h-4 w-20 mx-auto" />
									</TableCell>
									<TableCell className="p-4 text-center">
										<Skeleton className="h-4 w-32 mx-auto" />
									</TableCell>
									<TableCell className="p-4 text-center">
										<Skeleton className="h-4 w-24 mx-auto" />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{renderPagination()}
			</div>
		);
	}

	if (isError) {
		return (
			<Status
				icon={XCircle}
				iconColor="text-white"
				iconBg="bg-destructive"
				containerClassName="min-h-[63vh]"
				title="Failed to Fetch Application"
				description="We couldn't load your application data. Please check your connection or try again shortly."
			/>
		);
	}

	return (
		<div className="w-full space-y-6">
			{renderFilters()}

			<div className="rounded-lg border bg-card">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent border-border/50">
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											style={{ width: header.getSize() }}
											className="font-semibold h-12 text-center px-4"
										>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>

					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} className="hover:bg-muted/50 border-border/50">
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="p-4 text-center">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-64">
									<div className="flex flex-col items-center justify-center space-y-6 py-8">
										<div className="flex flex-col items-center space-y-4">
											<div className="p-4 rounded-full bg-primary">
												<Inbox className="size-8 text-white" />
											</div>

											<div className="space-y-2 text-center">
												<h3 className="text-lg font-semibold text-foreground">No applications found</h3>

												<p className="text-sm text-muted-foreground max-w-md">
													You haven&apos;t submitted any concession applications yet.
												</p>
											</div>
										</div>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{renderPagination()}
		</div>
	);
};

export default ApplicationsTable;
