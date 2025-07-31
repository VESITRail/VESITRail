"use client";

import {
  Search,
  Filter,
  BookOpen,
  ChevronLeft,
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  ColumnDef,
  flexRender,
  useReactTable,
  VisibilityState,
  getCoreRowModel,
} from "@tanstack/react-table";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookletItem } from "@/actions/booklets";
import { Skeleton } from "@/components/ui/skeleton";
import { ConcessionBookletStatusType } from "@/generated/zod";
import { useState, useMemo, useCallback, useEffect } from "react";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    displayName?: string;
  }
}

type SortOrder = "asc" | "desc";

const StatusBadge = ({ status }: { status: ConcessionBookletStatusType }) => {
  const variants = {
    InUse: "bg-blue-600 text-white",
    Damaged: "bg-red-600 text-white",
    Exhausted: "bg-gray-600 text-white",
    Available: "bg-green-600 text-white",
  };

  return <Badge className={`${variants[status]} font-medium`}>{status}</Badge>;
};

type BookletsTableProps = {
  isError: boolean;
  isLoading: boolean;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  hasNextPage: boolean;
  booklets: BookletItem[];
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: {
    status?: ConcessionBookletStatusType | "all";
  }) => void;
};

const BookletsTable = ({
  isError,
  booklets,
  isLoading,
  totalCount,
  totalPages,
  currentPage,
  hasNextPage,
  searchQuery,
  onPageChange,
  onFilterChange,
  onSearchChange,
  hasPreviousPage,
}: BookletsTableProps) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BookletItem | "bookletNumber";
    direction: SortOrder;
  } | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [localSearchQuery, setLocalSearchQuery] = useState<string>(searchQuery);

  const handleSort = useCallback((key: keyof BookletItem | "bookletNumber") => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc"
          ? { key, direction: "desc" }
          : { key, direction: "asc" };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const handleSearchSubmit = useCallback(() => {
    onSearchChange(localSearchQuery);
  }, [localSearchQuery, onSearchChange]);

  const handleStatusFilter = useCallback(
    (value: string) => {
      setSelectedStatus(value);
      onFilterChange({
        status:
          value === "all" ? "all" : (value as ConcessionBookletStatusType),
      });
    },
    [onFilterChange]
  );

  const handleSearchKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearchSubmit();
      }
    },
    [handleSearchSubmit]
  );

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const sortedBooklets = useMemo(() => {
    if (!sortConfig) return booklets;

    return [...booklets].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue: any = a[key as keyof BookletItem];
      let bValue: any = b[key as keyof BookletItem];

      if (key === "bookletNumber") {
        aValue = a.bookletNumber;
        bValue = b.bookletNumber;
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [booklets, sortConfig]);

  const columns: ColumnDef<BookletItem>[] = useMemo(
    () => [
      {
        size: 80,
        id: "serialNo",
        meta: { displayName: "Sr. No." },
        header: () => <div className="text-center">Sr. No.</div>,
        cell: ({ row, table }) => {
          const pageSize = 10;
          const sortedRows = table.getRowModel().rows;
          const indexInSorted = sortedRows.findIndex((r) => r.id === row.id);
          const serialNo = (currentPage - 1) * pageSize + indexInSorted + 1;
          return (
            <div className="font-medium text-foreground text-center">
              {serialNo}
            </div>
          );
        },
      },
      {
        size: 120,
        id: "bookletNumber",
        accessorKey: "bookletNumber",
        meta: { displayName: "Booklet" },
        header: () => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => handleSort("bookletNumber")}
              className="h-8 px-2 data-[state=open]:bg-accent"
            >
              Booklet
              <ArrowUpDown className="ml-2 size-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-mono font-medium">
              #{row.original.bookletNumber}
            </span>
          </div>
        ),
      },
      {
        size: 150,
        id: "serialNumbers",
        accessorKey: "serialNumbers",
        meta: { displayName: "Serial Numbers" },
        header: () => <div className="text-center">Serial Numbers</div>,
        cell: ({ row }) => {
          const start = row.original.serialStartNumber;
          const end = row.original.serialEndNumber;
          const startNum = start.match(/\d+$/)?.[0];
          const endNum = end.match(/\d+$/)?.[0];
          const prefix = start.replace(/\d+$/, "");

          const shortEndNum = endNum ? endNum.slice(-3) : "";

          return (
            <div className="text-center">
              <span className="font-mono text-sm">
                {prefix}
                {startNum}-{shortEndNum}
              </span>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        meta: { displayName: "Status" },
        header: () => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => handleSort("status")}
              className="h-8 px-2 data-[state=open]:bg-accent"
            >
              Status
              <ArrowUpDown className="ml-2 size-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StatusBadge status={row.original.status} />
          </div>
        ),
      },
      {
        size: 100,
        id: "applications",
        accessorKey: "applications",
        meta: { displayName: "Applications" },
        header: () => <div className="text-center">Applications</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-medium">
              {row.original._count.applications}
            </span>
          </div>
        ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        meta: { displayName: "Created" },
        header: () => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => handleSort("createdAt")}
              className="h-8 px-2 data-[state=open]:bg-accent"
            >
              Created
              <ArrowUpDown className="ml-2 size-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-sm text-center">
            {format(new Date(row.original.createdAt), "MMM dd, yyyy")}
          </div>
        ),
      },
    ],
    [handleSort, currentPage]
  );

  const table = useReactTable({
    columns,
    data: sortedBooklets,
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
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-16 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-20 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-6 w-20 mx-auto rounded-full" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-20 mx-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (isError) {
      return (
        <TableBody>
          <TableRow>
            <TableCell
              className="text-center py-8"
              colSpan={table.getHeaderGroups()[0].headers.length}
            >
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="size-8 text-destructive" />
                <span className="text-lg font-medium">
                  Error Loading Booklets
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

    if (sortedBooklets.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={table.getHeaderGroups()[0].headers.length}
              className="text-center py-8"
            >
              <div className="flex flex-col items-center gap-2">
                <BookOpen className="size-8 text-muted-foreground" />
                <span className="text-lg font-medium">No Booklets Found</span>
                <span className="text-sm text-muted-foreground">
                  {searchQuery || selectedStatus !== "all"
                    ? "Try adjusting your search or filters."
                    : "Create your first booklet to get started."}
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
              <TableCell key={cell.id} className="p-4 text-center">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-sm">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={localSearchQuery}
                className="pl-10 pr-20 h-10"
                placeholder="Search booklets..."
                onKeyPress={handleSearchKeyPress}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
              />
              <Button
                size="sm"
                onClick={handleSearchSubmit}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2"
              >
                <Search className="size-3" />
              </Button>
            </div>
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
              <Select value={selectedStatus} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-36 !h-10 !text-foreground cursor-pointer">
                  <Filter className="mr-2 size-4 text-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="InUse">In Use</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                  <SelectItem value="Exhausted">Exhausted</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-28 h-10">
                    Columns
                    <ChevronDown className="ml-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.columnDef.meta?.displayName || column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-semibold h-12 text-center px-4"
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

      {!isLoading && !isError && sortedBooklets.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            {totalCount > 0 ? (
              <>
                Showing {(currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, totalCount)} of {totalCount}{" "}
                booklet(s)
              </>
            ) : (
              "Showing 0 of 0 booklets"
            )}
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

export default BookletsTable;
