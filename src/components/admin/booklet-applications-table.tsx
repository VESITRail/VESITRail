"use client";

import {
  ColumnDef,
  flexRender,
  useReactTable,
  VisibilityState,
  getCoreRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toTitleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConcessionBooklet } from "@/generated/zod";
import { BookletApplicationItem } from "@/actions/booklets";
import { FileText, ChevronLeft, AlertCircle, ChevronRight } from "lucide-react";

type BookletApplicationsTableProps = {
  isError: boolean;
  isLoading: boolean;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  applications: BookletApplicationItem[];
  onPageChange: (page: number) => void;
  booklet: Pick<
    ConcessionBooklet,
    "id" | "bookletNumber" | "serialStartNumber" | "serialEndNumber"
  >;
};

const BookletApplicationsTable = ({
  isError,
  isLoading,
  totalCount,
  totalPages,
  currentPage,
  hasNextPage,
  applications,
  onPageChange,
  hasPreviousPage,
}: BookletApplicationsTableProps) => {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const generateCertificateNo = (
    application: BookletApplicationItem
  ): string => {
    return application.derivedCertificateNo || "N/A";
  };

  const generatePreviousCertificateNo = (
    previousApplication: BookletApplicationItem["previousApplication"]
  ): string => {
    if (
      !previousApplication?.concessionBooklet?.serialStartNumber ||
      previousApplication.pageOffset === null
    ) {
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

  const columns: ColumnDef<BookletApplicationItem>[] = useMemo(() => {
    const getCurrentPassNo = (application: BookletApplicationItem): string => {
      if (application.applicationType === "New") {
        return "New";
      }
      if (application.previousApplication?.id) {
        return generatePreviousCertificateNo(application.previousApplication);
      }
      return "N/A";
    };

    return [
      {
        size: 60,
        id: "serialNo",
        header: () => <div className="text-center px-2">Sr. No.</div>,
        cell: ({ row, table }) => {
          const sortedRows = table.getRowModel().rows;
          const indexInSorted = sortedRows.findIndex((r) => r.id === row.id);
          const serialNo = (currentPage - 1) * 10 + indexInSorted + 1;
          return (
            <div className="font-medium text-foreground text-center">
              {serialNo}
            </div>
          );
        },
      },
      {
        size: 80,
        id: "date",
        accessorKey: "createdAt",
        header: () => <div className="text-center">Date</div>,
        cell: ({ row }) => (
          <div className="text-center text-sm">
            {format(new Date(row.original.createdAt), "dd/MM/yyyy")}
          </div>
        ),
      },
      {
        size: 100,
        id: "certificateNo",
        header: () => <div className="text-center">Certificate</div>,
        cell: ({ row }) => {
          const certificateNo = generateCertificateNo(row.original);
          return (
            <div className="text-center">
              <span
                className="font-mono text-sm block truncate"
                title={certificateNo}
              >
                {certificateNo}
              </span>
            </div>
          );
        },
      },
      {
        size: 140,
        id: "studentName",
        header: () => <div className="text-center">Student Name</div>,
        cell: ({ row }) => {
          const { firstName, lastName } = row.original.student;
          const fullName = `${firstName} ${lastName}`;

          return (
            <div className="text-center">
              <span title={fullName} className="font-medium block truncate">
                {toTitleCase(
                  fullName.length > 20
                    ? `${fullName.slice(0, 20)}...`
                    : fullName
                )}
              </span>
            </div>
          );
        },
      },
      {
        size: 100,
        id: "currentPassNo",
        header: () => <div className="text-center">Current Pass</div>,
        cell: ({ row }) => {
          const currentPassNo = getCurrentPassNo(row.original);
          return (
            <div className="text-center">
              <span
                className="font-mono text-sm block truncate"
                title={currentPassNo}
              >
                {currentPassNo}
              </span>
            </div>
          );
        },
      },
      {
        size: 70,
        id: "gender",
        header: () => <div className="text-center">Gender</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-medium" title={row.original.student.gender}>
              {row.original.student.gender}
            </span>
          </div>
        ),
      },
      {
        size: 90,
        id: "dob",
        header: () => <div className="text-center">Date of Birth</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className="text-sm"
              title={format(
                new Date(row.original.student.dateOfBirth),
                "dd/MM/yyyy"
              )}
            >
              {format(new Date(row.original.student.dateOfBirth), "dd/MM/yyyy")}
            </span>
          </div>
        ),
      },
      {
        size: 90,
        id: "period",
        header: () => <div className="text-center">Period</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className="font-medium block truncate"
              title={row.original.concessionPeriod.name}
            >
              {row.original.concessionPeriod.name}
            </span>
          </div>
        ),
      },
      {
        size: 120,
        id: "homeStation",
        header: () => <div className="text-center">Home Station</div>,
        cell: ({ row }) => {
          const stationText = `${row.original.station.name} (${row.original.station.code})`;
          return (
            <div className="text-center">
              <span className="font-medium block truncate" title={stationText}>
                {stationText}
              </span>
            </div>
          );
        },
      },
      {
        size: 150,
        id: "address",
        header: () => <div className="text-center">Address</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className="text-sm block truncate"
              title={row.original.student.address}
            >
              {row.original.student.address.length > 25
                ? `${row.original.student.address.slice(0, 25)}...`
                : row.original.student.address}
            </span>
          </div>
        ),
      },
    ];
  }, [currentPage]);

  const table = useReactTable({
    columns,
    data: applications,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableBody>
          {Array.from({ length: 8 }).map((_, index) => (
            <TableRow
              key={index}
              className="hover:bg-transparent border-border/50"
            >
              {columns.map((_, colIndex) => (
                <TableCell
                  key={colIndex}
                  className="text-center p-4 align-middle"
                >
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-full max-w-[80%]" />
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (isError) {
      return (
        <TableBody className="h-64">
          <TableRow className="hover:bg-transparent">
            <TableCell
              className="text-center py-12 align-middle"
              colSpan={table.getHeaderGroups()[0].headers.length}
            >
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="size-8 text-destructive" />
                <span className="text-lg font-medium">
                  Error Loading Applications
                </span>
                <span className="text-sm text-muted-foreground">
                  Please try again later or contact support if the problem
                  persists.
                </span>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    if (applications.length === 0) {
      return (
        <TableBody className="h-64">
          <TableRow className="hover:bg-transparent">
            <TableCell
              className="text-center py-12 align-middle"
              colSpan={table.getHeaderGroups()[0].headers.length}
            >
              <div className="flex flex-col items-center gap-2">
                <FileText className="size-8 text-muted-foreground" />
                <span className="text-lg font-medium">
                  No Applications Found
                </span>
                <span className="text-sm text-muted-foreground">
                  This booklet has no applications yet.
                </span>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className="hover:bg-muted/50 border-border/50">
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="p-4 text-center align-middle">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-border/50"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="text-center font-semibold h-12 px-2 whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            {renderTableContent()}
          </Table>
        </div>
      </div>

      {!isLoading && !isError && applications.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(currentPage * 10, totalCount)} of {totalCount}{" "}
            application(s)
          </div>

          <div className="flex items-center justify-center gap-3 order-1 sm:order-2">
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
              <span className="text-sm font-medium text-foreground">
                {totalPages === 0 ? 0 : currentPage}
              </span>
              <span className="text-sm text-muted-foreground">of</span>
              <span className="text-sm font-medium text-foreground">
                {totalPages}
              </span>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default BookletApplicationsTable;
