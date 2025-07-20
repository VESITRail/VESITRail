import {
  Inbox,
  Filter,
  XCircle,
  History,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import {
  ColumnDef,
  flexRender,
  SortingState,
  useReactTable,
  VisibilityState,
  getCoreRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import Status from "../ui/status";
import React, { useState } from "react";
import { Separator } from "../ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Concession } from "@/actions/concession";
import { Skeleton } from "@/components/ui/skeleton";

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
    Approved: "bg-green-600 text-white",
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

const PreviousApplicationDialog = ({
  previousApplication,
}: {
  previousApplication: PreviousApplication;
}) => {
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
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <StatusBadge status={previousApplication.status} />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <ApplicationTypeBadge
                type={previousApplication.applicationType}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Class</p>
              <p className="font-medium text-foreground/90">
                {previousApplication.concessionClass.name} (
                {previousApplication.concessionClass.code})
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Period
              </p>
              <p className="font-medium text-foreground/90">
                {previousApplication.concessionPeriod.name} (
                {previousApplication.concessionPeriod.duration}{" "}
                {previousApplication.concessionPeriod.duration === 1
                  ? "month"
                  : "months"}
                )
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Home Station
              </p>
              <p className="font-medium text-foreground/90">
                {previousApplication.station.name} (
                {previousApplication.station.code})
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Applied Date
              </p>
              <p className="font-medium text-foreground/90">
                {format(
                  new Date(previousApplication.createdAt),
                  "MMMM dd, yyyy"
                )}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const columns: ColumnDef<Concession>[] = [
  {
    size: 80,
    id: "serialNo",
    header: "Sr. No.",
    cell: ({ row, table }) => {
      const sortedRows = table.getRowModel().rows;
      const indexInSorted = sortedRows.findIndex((r) => r.id === row.id);
      const serialNo = indexInSorted + 1;

      return <div className="font-medium text-foreground">{serialNo}</div>;
    },
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
            <PreviousApplicationDialog
              previousApplication={previousApplication}
            />
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const type = row.getValue(id) as ApplicationType;
      const searchValue = value.toLowerCase().trim();

      return type.toLowerCase().startsWith(searchValue);
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="h-auto py-2 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
    size: 120,
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    size: 200,
    header: "Class",
    accessorKey: "concessionClass",
    cell: ({ row }) => {
      const concessionClass = row.getValue(
        "concessionClass"
      ) as ConcessionClass;

      return (
        <div className="font-medium text-foreground/90">
          {concessionClass.name} ({concessionClass.code})
        </div>
      );
    },
  },
  {
    size: 150,
    header: "Period",
    accessorKey: "concessionPeriod",
    cell: ({ row }) => {
      const period = row.getValue("concessionPeriod") as ConcessionPeriod;

      return (
        <div className="font-medium text-foreground/90">{period.name}</div>
      );
    },
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
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="h-auto py-2 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Applied Date
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
    size: 150,
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="font-medium text-foreground/90">
          {format(date, "MMMM dd, yyyy")}
        </div>
      );
    },
  },
];

interface ApplicationsTableProps {
  isError: boolean;
  isLoading: boolean;
  applications: Concession[];
}

const ApplicationsTable = ({
  isError,
  isLoading,
  applications,
}: ApplicationsTableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const table = useReactTable<Concession>({
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    columns,
    data: applications,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full sm:w-64" />

          <div className="flex gap-2 sm:ml-auto">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
          </div>
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

        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />

          <div className="flex gap-2">
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-10" />
          </div>
        </div>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          className="w-full sm:w-64 h-10"
          placeholder='Type "New" or "Renewal" to filter'
          onChange={(event) => {
            table
              .getColumn("applicationType")
              ?.setFilterValue(event.target.value);
          }}
        />

        <div className="flex gap-3 sm:ml-auto">
          <Select
            value={
              (table.getColumn("status")?.getFilterValue() as string) ?? ""
            }
            onValueChange={(value) =>
              table
                .getColumn("status")
                ?.setFilterValue(value === "all" ? "" : value)
            }
          >
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
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
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
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-border/50"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="font-semibold h-12 text-center"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/50 border-border/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-4 text-center"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64">
                  <div className="flex flex-col items-center justify-center space-y-6 py-8">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 rounded-full bg-muted/50">
                        <Inbox className="size-8 text-muted-foreground" />
                      </div>

                      <div className="space-y-2 text-center">
                        <h3 className="text-lg font-semibold text-foreground">
                          No applications found
                        </h3>

                        <p className="text-sm text-muted-foreground max-w-md">
                          You haven&apos;t submitted any concession applications
                          yet.
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

      <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          {table.getFilteredRowModel().rows.length > 0 ? (
            <>
              Showing{" "}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}{" "}
              to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{" "}
              of {table.getFilteredRowModel().rows.length} application(s)
            </>
          ) : (
            "Showing 0 of 0 applications"
          )}
        </div>

        <div className="flex items-center justify-center gap-3 order-1 sm:order-2">
          <Button
            size="sm"
            variant="outline"
            className="size-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-2 px-3">
            <span className="text-sm font-medium text-foreground">
              {table.getPageCount() === 0
                ? table.getPageCount()
                : table.getState().pagination.pageIndex + 1}
            </span>
            <span className="text-sm text-muted-foreground">of</span>
            <span className="text-sm font-medium text-foreground">
              {table.getPageCount()}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="size-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsTable;
