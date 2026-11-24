"use client";

import {
	Filter,
	Pencil,
	Search,
	Trash2,
	XCircle,
	ArrowUp,
	ArrowDown,
	ArrowUpDown,
	ChevronDown,
	ChevronLeft,
	ChevronRight
} from "lucide-react";
import {
	flexRender,
	useReactTable,
	type ColumnDef,
	getCoreRowModel,
	getSortedRowModel,
	type VisibilityState
} from "@tanstack/react-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
	formatAcademicYear,
	ACADEMIC_SEMESTER_PAGE_SIZE,
	type AcademicSemesterTermFilter
} from "@/lib/academic-semester-table";
import { useState } from "react";
import Status from "@/components/ui/status";
import { formatIstDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaginationMeta } from "@/lib/pagination";
import TableEmptyState from "@/components/ui/table-empty-state";
import type { AcademicSemesterItem } from "@/actions/academic-semester";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = PaginationMeta & {
	isError: boolean;
	totalCount: number;
	isLoading: boolean;
	searchQuery: string;
	term: AcademicSemesterTermFilter;
	semesters: AcademicSemesterItem[];
	onPageChange: (page: number) => void;
	onSearchChange: (search: string) => void;
	onFilterChange: (term: AcademicSemesterTermFilter) => void;
	onEdit: (semester: AcademicSemesterItem, trigger: HTMLButtonElement) => void;
	onDelete: (semester: AcademicSemesterItem, trigger: HTMLButtonElement) => void;
};

export default function AcademicSemestersTable({
	term,
	onEdit,
	isError,
	onDelete,
	isLoading,
	semesters,
	totalCount,
	totalPages,
	searchQuery,
	currentPage,
	hasNextPage,
	onPageChange,
	onSearchChange,
	onFilterChange,
	hasPreviousPage
}: Props) {
	"use no memo";
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
	const firstIndex = (currentPage - 1) * ACADEMIC_SEMESTER_PAGE_SIZE;

	const columns: ColumnDef<AcademicSemesterItem>[] = [
		{
			size: 80,
			id: "serialNo",
			header: "Sr. No.",
			cell: ({ row, table }) => (
				<span className="font-medium text-foreground">
					{firstIndex + table.getRowModel().rows.findIndex((visibleRow) => visibleRow.id === row.id) + 1}
				</span>
			)
		},
		{
			size: 160,
			sortingFn: "basic",
			header: "Academic Year",
			accessorKey: "academicYearStart",
			cell: ({ row }) => (
				<span className="font-medium text-foreground">{formatAcademicYear(row.original.academicYearStart)}</span>
			)
		},
		{
			size: 120,
			header: "Term",
			sortingFn: "text",
			accessorKey: "term",
			cell: ({ row }) => <Badge variant="secondary">{row.original.term}</Badge>
		},
		{
			header: "Start Date",
			sortingFn: "datetime",
			accessorKey: "startDate",
			cell: ({ row }) => formatIstDate(row.original.startDate)
		},
		{
			header: "End Date",
			sortingFn: "datetime",
			accessorKey: "endDate",
			cell: ({ row }) => formatIstDate(row.original.endDate)
		},
		{
			size: 120,
			sortingFn: "basic",
			id: "applications",
			header: "Applications",
			accessorFn: (semester) => semester._count.applications,
			cell: ({ row }) => <span className="font-medium tabular-nums">{row.original._count.applications}</span>
		},
		{
			size: 140,
			id: "actions",
			header: "Actions",
			cell: ({ row }) => {
				const semester = row.original;
				const label = `${formatAcademicYear(semester.academicYearStart)} ${semester.term} semester`;
				return (
					<div className="flex items-center justify-center gap-2">
						<Button
							size="sm"
							variant="outline"
							className="size-8 p-0"
							aria-label={`Edit ${label}`}
							onClick={(event) => onEdit(semester, event.currentTarget)}
						>
							<Pencil className="size-4" />
						</Button>
						<Button
							size="sm"
							variant="outline"
							aria-label={`Delete ${label}`}
							onClick={(event) => onDelete(semester, event.currentTarget)}
							className="size-8 p-0 text-destructive hover:text-destructive"
						>
							<Trash2 className="size-4" />
						</Button>
					</div>
				);
			}
		}
	];

	const table = useReactTable({
		columns,
		data: semesters,
		sortDescFirst: false,
		pageCount: totalPages,
		manualFiltering: true,
		enableMultiSort: false,
		manualPagination: true,
		state: { columnVisibility },
		getCoreRowModel: getCoreRowModel(),
		getRowId: (semester) => semester.id,
		getSortedRowModel: getSortedRowModel(),
		onColumnVisibilityChange: setColumnVisibility
	});
	const visibleColumns = table.getVisibleLeafColumns();
	const rows = table.getRowModel().rows;

	if (isError) {
		return (
			<Status
				icon={XCircle}
				iconColor="text-white"
				iconBg="bg-destructive"
				title="Failed to Fetch Academic Semesters"
				containerClassName="h-full w-full min-h-0"
				description="We couldn't load the semester data. Please check your connection or try again shortly."
			/>
		);
	}

	return (
		<div className="w-full h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
			<div className="shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex-1 md:max-w-sm">
					{isLoading ? (
						<Skeleton className="h-10 w-full" />
					) : (
						<form
							className="relative"
							onSubmit={(event) => {
								event.preventDefault();
								onSearchChange(localSearchQuery);
							}}
						>
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								maxLength={150}
								value={localSearchQuery}
								className="pl-10 pr-20 h-10"
								aria-label="Search semesters"
								placeholder="Search semesters..."
								onChange={(event) => {
									setLocalSearchQuery(event.target.value);
									if (event.target.value === "") onSearchChange("");
								}}
							/>
							<Button
								size="sm"
								type="submit"
								aria-label="Submit semester search"
								className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2"
							>
								<Search className="size-3" />
							</Button>
						</form>
					)}
				</div>

				<div className="flex gap-3">
					{isLoading ? (
						<>
							<Skeleton className="h-10 w-36" />
							<Skeleton className="h-10 w-28" />
						</>
					) : (
						<>
							<Select value={term} onValueChange={onFilterChange}>
								<SelectTrigger aria-label="Filter by term" className="w-36 h-10! text-foreground! cursor-pointer">
									<Filter className="mr-2 size-4 text-foreground" />
									<SelectValue placeholder="Term" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Terms</SelectItem>
									<SelectItem value="Odd">Odd</SelectItem>
									<SelectItem value="Even">Even</SelectItem>
								</SelectContent>
							</Select>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="w-28 h-10">
										Columns <ChevronDown className="ml-2 size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-44">
									{table
										.getAllLeafColumns()
										.filter((column) => column.getCanHide())
										.map((column) => (
											<DropdownMenuCheckboxItem
												key={column.id}
												checked={column.getIsVisible()}
												onCheckedChange={(value) => column.toggleVisibility(value)}
												disabled={visibleColumns.length === 1 && column.getIsVisible()}
											>
												{String(column.columnDef.header)}
											</DropdownMenuCheckboxItem>
										))}
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					)}
				</div>
			</div>

			<div className="flex-1 min-h-0 rounded-lg border bg-card overflow-hidden flex flex-col" aria-busy={isLoading}>
				{isLoading && (
					<span className="sr-only" role="status">
						Loading academic semesters
					</span>
				)}
				<div className={rows.length || isLoading ? "overflow-auto flex-1 min-h-0" : "shrink-0"}>
					<Table aria-label="Academic semesters">
						<TableHeader className="sticky top-0 bg-card z-10">
							{table.getHeaderGroups().map((group) => (
								<TableRow key={group.id} className="hover:bg-transparent border-border/50">
									{group.headers.map((header) => {
										const sort = header.column.getIsSorted();
										const SortIcon = sort === "asc" ? ArrowUp : sort === "desc" ? ArrowDown : ArrowUpDown;
										const label = flexRender(header.column.columnDef.header, header.getContext());
										return (
											<TableHead
												scope="col"
												key={header.id}
												className="h-12 text-center px-4"
												style={{ width: header.getSize() }}
												aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined}
											>
												{isLoading ? (
													<Skeleton className="h-4 w-16 mx-auto" />
												) : header.column.getCanSort() ? (
													<Button
														type="button"
														variant="ghost"
														className="h-auto py-2"
														onClick={header.column.getToggleSortingHandler()}
														aria-label={`${String(header.column.columnDef.header)} (sort current page)`}
													>
														{label}
														<SortIcon aria-hidden="true" className="ml-2 size-4" />
													</Button>
												) : (
													label
												)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{isLoading
								? Array.from({ length: ACADEMIC_SEMESTER_PAGE_SIZE }, (_, index) => (
										<TableRow key={index} className="hover:bg-muted/50 border-border/50">
											{visibleColumns.map((column) => (
												<TableCell key={column.id} className="p-4 text-center">
													{column.id === "actions" ? (
														<div className="flex items-center justify-center gap-2">
															<Skeleton className="size-8 rounded" />
															<Skeleton className="size-8 rounded" />
														</div>
													) : (
														<Skeleton className="h-4 w-16 mx-auto" />
													)}
												</TableCell>
											))}
										</TableRow>
									))
								: rows.map((row) => (
										<TableRow key={row.id} className="hover:bg-muted/50 border-border/50">
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id} className="p-4 text-center">
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</TableCell>
											))}
										</TableRow>
									))}
						</TableBody>
					</Table>
				</div>
				{!isLoading && rows.length === 0 && (
					<TableEmptyState
						title="No academic semesters found"
						description={
							searchQuery || term !== "all"
								? "No academic semesters match your current search and filter criteria."
								: "No academic semester records found."
						}
					/>
				)}
			</div>

			<div className="shrink-0 flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
				<div className="text-sm text-muted-foreground order-2 sm:order-1" aria-live="polite">
					{isLoading ? (
						<Skeleton className="h-5 w-48" />
					) : totalCount > 0 ? (
						`Showing ${firstIndex + 1} to ${firstIndex + rows.length} of ${totalCount} semester(s)`
					) : (
						"Showing 0 of 0 semesters"
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
								aria-label="Previous page"
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
								aria-label="Next page"
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
}
