"use client";

import { format } from "date-fns";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConcessionBooklet } from "@/generated/zod";
import { FileText, AlertCircle } from "lucide-react";
import { toTitleCase, formatDateOfBirth } from "@/lib/utils";
import { DamagedPageItem, BookletTableItem, BookletApplicationItem } from "@/actions/booklets";
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { ColumnDef, flexRender, useReactTable, VisibilityState, getCoreRowModel } from "@tanstack/react-table";

type BookletApplicationsTableProps = {
	isError: boolean;
	isLoading: boolean;
	totalCount?: number;
	applications: BookletTableItem[];
	booklet: Pick<ConcessionBooklet, "id" | "bookletNumber" | "serialStartNumber" | "serialEndNumber">;
};

const BookletApplicationsTable = ({ isError, isLoading, applications }: BookletApplicationsTableProps) => {
	"use no memo";
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

	const generateCertificateNo = (application: BookletApplicationItem): string => {
		return application.derivedCertificateNo || "N/A";
	};

	const generatePreviousCertificateNo = (
		previousApplication: BookletApplicationItem["previousApplication"]
	): string => {
		if (!previousApplication?.concessionBooklet?.serialStartNumber || previousApplication.pageOffset === null) {
			return "N/A";
		}

		const serialStart = previousApplication.concessionBooklet.serialStartNumber;
		const prefix = serialStart.replace(/\d+$/, "");
		const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
		const certificateNum = startNum + (previousApplication.pageOffset || 0);
		const derivedCertificateNo = `${prefix}${certificateNum
			.toString()
			.padStart(serialStart.match(/\d+$/)?.[0]?.length || 3, "0")}`;

		return derivedCertificateNo;
	};

	const columns: ColumnDef<BookletTableItem>[] = useMemo(() => {
		const getCurrentPassNo = (application: BookletApplicationItem): string => {
			if (application.applicationType === "New") {
				return "New";
			}
			if (application.previousApplication?.id) {
				return generatePreviousCertificateNo(application.previousApplication);
			}
			return "N/A";
		};

		const isDamagedPage = (item: BookletTableItem): item is DamagedPageItem => {
			return "isDamaged" in item && item.isDamaged === true;
		};

		return [
			{
				size: 60,
				id: "serialNo",
				header: () => <div className="text-center px-2">Sr. No.</div>,
				cell: ({ row }) => {
					const item = row.original;
					let serialNo: number;

					if (isDamagedPage(item)) {
						const match = item.serialNumber.match(/\d+$/);
						const certNumber = match ? parseInt(match[0], 10) : 0;
						serialNo = ((certNumber - 1) % 50) + 1;
					} else {
						const certificateNo = generateCertificateNo(item);
						const match = certificateNo.match(/\d+$/);
						const certNumber = match ? parseInt(match[0], 10) : 0;
						serialNo = ((certNumber - 1) % 50) + 1;
					}

					return <div className="font-medium text-foreground text-center">{serialNo}</div>;
				}
			},
			{
				size: 80,
				id: "date",
				accessorKey: "createdAt",
				header: () => <div className="text-center">Date</div>,
				cell: ({ row }) => {
					const item = row.original;

					if (isDamagedPage(item)) {
						return null;
					}

					return <div className="text-center text-sm">{format(new Date(item.createdAt), "dd/MM/yyyy")}</div>;
				}
			},
			{
				size: 100,
				id: "certificateNo",
				header: () => <div className="text-center">Certificate</div>,
				cell: ({ row }) => {
					const item = row.original;
					if (isDamagedPage(item)) {
						return (
							<div className="text-center">
								<span className="font-mono text-sm">{item.serialNumber}</span>
							</div>
						);
					}
					const certificateNo = generateCertificateNo(item);
					return (
						<div className="text-center">
							<span className="font-mono text-sm block truncate" title={certificateNo}>
								{certificateNo}
							</span>
						</div>
					);
				}
			},
			{
				size: 140,
				id: "studentName",
				header: () => <div className="text-center">Student Name</div>,
				cell: ({ row }) => {
					const item = row.original;

					if (isDamagedPage(item)) {
						return null;
					}

					const { firstName, middleName, lastName } = item.student;
					const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

					return (
						<div className="text-center">
							<span title={fullName} className="font-medium block truncate">
								{toTitleCase(fullName.length > 20 ? `${fullName.slice(0, 20)}...` : fullName)}
							</span>
						</div>
					);
				}
			},
			{
				size: 100,
				id: "currentPassNo",
				header: () => <div className="text-center">Current Pass</div>,
				cell: ({ row }) => {
					const item = row.original;

					if (isDamagedPage(item)) {
						return null;
					}

					const currentPassNo = getCurrentPassNo(item);
					return (
						<div className="text-center">
							<span className="font-mono text-sm block truncate" title={currentPassNo}>
								{currentPassNo}
							</span>
						</div>
					);
				}
			},
			{
				size: 70,
				id: "gender",
				header: () => <div className="text-center">Gender</div>,
				cell: ({ row }) => {
					const item = row.original;

					if (isDamagedPage(item)) {
						return null;
					}

					return (
						<div className="text-center">
							<span className="font-medium" title={item.student.gender}>
								{item.student.gender}
							</span>
						</div>
					);
				}
			},
			{
				size: 90,
				id: "dob",
				header: () => <div className="text-center">Date of Birth</div>,
				cell: ({ row }) => {
					const item = row.original;

					if (isDamagedPage(item)) {
						return null;
					}

					return (
						<div className="text-center">
							<span className="text-sm" title={formatDateOfBirth(item.student.dateOfBirth, "dd/MM/yyyy")}>
								{formatDateOfBirth(item.student.dateOfBirth, "dd/MM/yyyy")}
							</span>
						</div>
					);
				}
			},
			{
				size: 90,
				id: "period",
				header: () => <div className="text-center">Period</div>,
				cell: ({ row }) => {
					const item = row.original;

					if (isDamagedPage(item)) {
						return null;
					}

					return (
						<div className="text-center">
							<span className="font-medium block truncate" title={item.concessionPeriod.name}>
								{item.concessionPeriod.name}
							</span>
						</div>
					);
				}
			},
			{
				size: 120,
				id: "homeStation",
				header: () => <div className="text-center">Home Station</div>,
				cell: ({ row }) => {
					const item = row.original;

					if (isDamagedPage(item)) {
						return null;
					}

					const stationText = `${item.station.name} (${item.station.code})`;
					return (
						<div className="text-center">
							<span className="font-medium block truncate" title={stationText}>
								{stationText}
							</span>
						</div>
					);
				}
			}
		];
	}, []);

	const table = useReactTable({
		columns,
		data: applications,
		getCoreRowModel: getCoreRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		state: {
			columnVisibility
		}
	});

	const renderTableContent = () => {
		if (isLoading) {
			return (
				<TableBody>
					{Array.from({ length: 15 }).map((_, index) => (
						<TableRow key={index} className="hover:bg-transparent border-border/50">
							<TableCell className="text-center p-4 align-middle">
								<Skeleton className="h-4 w-6 mx-auto" />
							</TableCell>
							<TableCell className="text-center p-4 align-middle">
								<Skeleton className="h-4 w-16 mx-auto" />
							</TableCell>
							<TableCell className="text-center p-4 align-middle">
								<Skeleton className="h-4 w-16 mx-auto" />
							</TableCell>
							<TableCell className="text-center p-4 align-middle">
								<Skeleton className="h-4 w-32 mx-auto" />
							</TableCell>
							<TableCell className="text-center p-4 align-middle">
								<Skeleton className="h-4 w-28 mx-auto" />
							</TableCell>
							<TableCell className="text-center p-4 align-middle">
								<Skeleton className="h-4 w-12 mx-auto" />
							</TableCell>
							<TableCell className="text-center p-4 align-middle">
								<Skeleton className="h-4 w-16 mx-auto" />
							</TableCell>
							<TableCell className="text-center p-4 align-middle">
								<Skeleton className="h-4 w-16 mx-auto" />
							</TableCell>
							<TableCell className="text-center p-4 align-middle">
								<Skeleton className="h-4 w-20 mx-auto" />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			);
		}

		return (
			<TableBody>
				{table.getRowModel().rows.map((row) => {
					const item = row.original;
					const isDamaged = "isDamaged" in item && item.isDamaged === true;

					if (isDamaged) {
						const damagedItem = item as DamagedPageItem;
						const match = damagedItem.serialNumber.match(/\d+$/);

						return (
							<TableRow key={row.id} className="hover:bg-muted/50 border-border/50">
								<TableCell className="p-4 text-center align-middle">
									{match ? ((parseInt(match[0], 10) - 1) % 50) + 1 : 1}
								</TableCell>
								<TableCell className="p-4 text-center align-middle">
									<span className="text-muted-foreground">-</span>
								</TableCell>
								<TableCell className="p-4 text-center align-middle">
									<span className="font-mono text-sm">{damagedItem.serialNumber}</span>
								</TableCell>
								<TableCell
									colSpan={columns.length - 3}
									className="p-4 text-center align-middle font-medium text-destructive"
								>
									Cancelled
								</TableCell>
							</TableRow>
						);
					}

					return (
						<TableRow key={row.id} className="hover:bg-muted/50 border-border/50">
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id} className="p-4 text-center align-middle">
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					);
				})}
			</TableBody>
		);
	};

	return (
		<div className="w-full h-full rounded-lg border bg-card overflow-hidden flex flex-col min-h-0">
			{isLoading || (!isError && applications.length > 0) ? (
				<div className="overflow-auto flex-1 min-h-0">
					<Table>
						<TableHeader className="sticky top-0 bg-card z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id} className="hover:bg-transparent border-border/50">
									{headerGroup.headers.map((header) => (
										<TableHead
											key={header.id}
											style={{ width: `${header.getSize()}px` }}
											className="text-center font-semibold h-12 px-2 whitespace-nowrap"
										>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						{renderTableContent()}
					</Table>
				</div>
			) : (
				<div className="flex-1 min-h-0 flex flex-col">
					<Table>
						<TableHeader className="bg-card">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id} className="hover:bg-transparent border-border/50">
									{headerGroup.headers.map((header) => (
										<TableHead
											key={header.id}
											style={{ width: `${header.getSize()}px` }}
											className="text-center font-semibold h-12 px-2 whitespace-nowrap"
										>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
					</Table>

					<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
						{isError ? (
							<div className="flex flex-col items-center space-y-4">
								<div className="p-4 rounded-full bg-destructive/10 text-destructive">
									<AlertCircle className="size-8" />
								</div>
								<div className="space-y-2 text-center">
									<h3 className="text-lg font-semibold text-foreground">Error Loading Applications</h3>
									<p className="text-sm text-muted-foreground max-w-md">
										Please try again later or contact support if the problem persists.
									</p>
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center space-y-4">
								<div className="p-4 rounded-full bg-primary">
									<FileText className="size-8 text-white" />
								</div>
								<div className="space-y-2 text-center">
									<h3 className="text-lg font-semibold text-foreground">No Applications Found</h3>
									<p className="text-sm text-muted-foreground max-w-md">This booklet has no applications yet.</p>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default BookletApplicationsTable;
