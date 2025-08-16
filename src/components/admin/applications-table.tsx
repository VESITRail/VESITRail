"use client";

import {
  X,
  Eye,
  Inbox,
  Check,
  Filter,
  Search,
  XCircle,
  Printer,
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
  useReactTable,
  VisibilityState,
  getCoreRowModel,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ConcessionApplicationTypeType,
  ConcessionApplicationStatusType,
} from "@/generated/zod";
import {
  AdminApplication,
  reviewConcessionApplication,
  getConcessionApplicationDetails,
  approveConcessionWithBooklet,
} from "@/actions/concession";
import { toast } from "sonner";
import { format } from "date-fns";
import Status from "../ui/status";
import { toTitleCase } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCallback, useState, useMemo, useEffect } from "react";
import ApproveApplicationDialog from "./approve-application-dialog";

type SortOrder = "asc" | "desc";
type Station = AdminApplication["station"];
type ApplicationStatus = AdminApplication["status"];
type ApplicationType = AdminApplication["applicationType"];
type ConcessionClass = AdminApplication["concessionClass"];
type ConcessionPeriod = AdminApplication["concessionPeriod"];

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

const createColumns = (
  currentPage: number,
  onSortChange: (column: string) => void,
  onReject?: (application: AdminApplication) => void,
  onApprove?: (application: AdminApplication) => void,
  onViewRejection?: (application: AdminApplication) => void
): ColumnDef<AdminApplication>[] => [
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
    },
  },
  {
    size: 100,
    header: "ID",
    id: "shortId",
    accessorKey: "shortId",
    cell: ({ row }) => {
      const shortId = row.getValue("shortId") as number;
      return (
        <div className="font-mono text-sm font-medium text-foreground">
          #{shortId}
        </div>
      );
    },
  },
  {
    size: 200,
    header: "Name",
    id: "studentName",
    cell: ({ row }) => {
      const student = row.original.student;
      const fullName = `${student.firstName} ${student.lastName}`;

      return (
        <div className="space-y-1 text-center">
          <p title={fullName} className="font-medium text-foreground">
            {toTitleCase(
              fullName.length > 25 ? `${fullName.slice(0, 25)}...` : fullName
            )}
          </p>
          <p className="text-xs text-muted-foreground">{student.user.email}</p>
        </div>
      );
    },
  },
  {
    size: 150,
    header: "Type",
    accessorKey: "applicationType",
    cell: ({ row }) => {
      const type = row.getValue("applicationType") as ApplicationType;
      return <ApplicationTypeBadge type={type} />;
    },
    filterFn: (row, id, value) => {
      const type = row.getValue(id) as ApplicationType;
      const searchValue = value.toLowerCase().trim();
      return type.toLowerCase().startsWith(searchValue);
    },
  },
  {
    size: 120,
    accessorKey: "status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    header: () => {
      return (
        <Button
          variant="ghost"
          className="h-auto py-2 font-semibold"
          onClick={() => onSortChange("status")}
        >
          Status
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
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
    size: 150,
    accessorKey: "createdAt",
    header: () => {
      return (
        <Button
          variant="ghost"
          className="h-auto py-2 font-semibold"
          onClick={() => onSortChange("createdAt")}
        >
          Applied Date
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="font-medium text-foreground/90">
          {format(date, "MMMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    size: 120,
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const status = row.getValue("status") as ApplicationStatus;
      const application = row.original;

      return (
        <div className="flex items-center justify-center gap-2">
          {status === "Approved" && (
            <Button
              size="sm"
              variant="default"
              className="size-8 p-0"
              title="Print Application"
              aria-label="Print application"
            >
              <Printer className="size-4" />
            </Button>
          )}

          {status === "Pending" && (
            <>
              <Button
                size="sm"
                variant="default"
                className="size-8 p-0"
                title="Approve Application"
                aria-label="Approve application"
                onClick={() => onApprove && onApprove(application)}
              >
                <Check className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="size-8 p-0"
                title="Reject Application"
                aria-label="Reject application"
                onClick={() => onReject && onReject(application)}
              >
                <X className="size-4" />
              </Button>
            </>
          )}

          {status === "Rejected" && (
            <Button
              size="sm"
              variant="ghost"
              className="size-8 p-0"
              title="View Rejection Reason"
              aria-label="View rejection reason"
              onClick={() => onViewRejection && onViewRejection(application)}
            >
              <Eye className="size-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];

type ApplicationsTableProps = {
  adminId: string;
  isError: boolean;
  isLoading: boolean;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  applications: AdminApplication[];
  onPageChange: (page: number) => void;
  onFilterChange: (filters: {
    searchQuery?: string;
    status?: ConcessionApplicationStatusType | "all";
    applicationType?: ConcessionApplicationTypeType | "all";
  }) => void;
};

const ApplicationsTable = ({
  adminId,
  isError,
  isLoading,
  totalCount,
  totalPages,
  currentPage,
  hasNextPage,
  applications,
  onPageChange,
  onFilterChange,
  hasPreviousPage,
}: ApplicationsTableProps) => {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [localSearchQuery, setLocalSearchQuery] = useState<string>("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: SortOrder;
  } | null>(null);

  const [localApplications, setLocalApplications] =
    useState<AdminApplication[]>(applications);

  useEffect(() => {
    setLocalApplications(applications);
  }, [applications]);

  const updateLocalApplication = useCallback(
    (updatedApplication: AdminApplication) => {
      setLocalApplications((prev) =>
        prev.map((app) =>
          app.id === updatedApplication.id ? updatedApplication : app
        )
      );
    },
    []
  );

  const [selectedApplication, setSelectedApplication] =
    useState<AdminApplication | null>(null);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [showRejectDialog, setShowRejectDialog] = useState<boolean>(false);
  const [showApproveDialog, setShowApproveDialog] = useState<boolean>(false);
  const [showRejectionReasonDialog, setShowRejectionReasonDialog] =
    useState<boolean>(false);
  const [applicationDetails, setApplicationDetails] = useState<
    | (AdminApplication & {
        rejectionReason: string | null;
        submissionCount: number;
      })
    | null
  >(null);

  const sortedApplications = useMemo(() => {
    if (!sortConfig) {
      return localApplications;
    }

    return [...localApplications].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortConfig.key) {
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
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
  }, [localApplications, sortConfig]);

  const handleSort = useCallback((column: string) => {
    setSortConfig((current) => {
      if (current?.key === column) {
        return {
          key: column,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key: column,
        direction: "asc",
      };
    });
  }, []);

  const handleSearchSubmit = useCallback(() => {
    onFilterChange({
      searchQuery: localSearchQuery,
    });
  }, [localSearchQuery, onFilterChange]);

  const handleSearchKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearchSubmit();
      }
    },
    [handleSearchSubmit]
  );

  const handleApprove = useCallback((application: AdminApplication) => {
    setSelectedApplication(application);
    setShowApproveDialog(true);
  }, []);

  const handleReject = useCallback((application: AdminApplication) => {
    setSelectedApplication(application);
    setShowRejectDialog(true);
  }, []);

  const handleViewRejection = useCallback((application: AdminApplication) => {
    setSelectedApplication(application);
    setShowRejectionReasonDialog(true);
  }, []);

  const confirmApprove = async (applicationId: string, bookletId: string) => {
    const approvePromise = async () => {
      const result = await approveConcessionWithBooklet(
        applicationId,
        adminId,
        bookletId
      );

      if (result.isSuccess) {
        const updatedApplication = {
          ...selectedApplication!,
          reviewedAt: new Date(),
          status: "Approved" as ApplicationStatus,
        };

        updateLocalApplication(updatedApplication);
        setSelectedApplication(null);

        return updatedApplication;
      } else {
        throw new Error(
          result.error.type === "VALIDATION_ERROR"
            ? result.error.message
            : "Unable to approve the application. Please try again."
        );
      }
    };

    toast.promise(approvePromise, {
      loading: "Approving application...",
      error: "Failed to approve application",
      success: "Application Approved Successfully",
    });
  };

  const confirmReject = async () => {
    if (!selectedApplication) return;

    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejecting this application.");
      return;
    }

    setIsRejecting(true);

    const rejectPromise = async () => {
      const result = await reviewConcessionApplication(
        selectedApplication.id,
        adminId,
        "Rejected",
        rejectionReason.trim()
      );

      if (result.isSuccess) {
        const updatedApplication = {
          ...selectedApplication,
          reviewedAt: new Date(),
          status: "Rejected" as ApplicationStatus,
          rejectionReason: rejectionReason.trim(),
        };

        updateLocalApplication(updatedApplication);
        setShowRejectDialog(false);
        setRejectionReason("");
        setSelectedApplication(null);
        return updatedApplication;
      } else {
        throw new Error(
          result.error.type === "VALIDATION_ERROR"
            ? result.error.message
            : "Unable to reject the application. Please try again."
        );
      }
    };

    toast.promise(rejectPromise, {
      loading: "Rejecting application...",
      error: "Failed to reject application",
      success: "Application Rejected Successfully",
      finally: () => {
        setIsRejecting(false);
      },
    });
  };

  const loadRejectionReason = useCallback(async () => {
    if (!selectedApplication) return;

    try {
      const result = await getConcessionApplicationDetails(
        selectedApplication.id
      );
      if (result.isSuccess) {
        setApplicationDetails(result.data);
      }
    } catch (error) {
      console.error("Error loading rejection reason:", error);
      toast.error("Failed to load rejection reason");
    }
  }, [selectedApplication]);

  useEffect(() => {
    if (showRejectionReasonDialog && selectedApplication) {
      loadRejectionReason();
    }
  }, [showRejectionReasonDialog, selectedApplication, loadRejectionReason]);

  const columns = createColumns(
    currentPage,
    handleSort,
    handleReject,
    handleApprove,
    handleViewRejection
  );

  const handleStatusFilter = useCallback(
    (value: string): void => {
      setSelectedStatus(value);
      onFilterChange({
        searchQuery: localSearchQuery,
        status: value as ConcessionApplicationStatusType | "all",
        applicationType: selectedType as ConcessionApplicationTypeType | "all",
      });
    },
    [onFilterChange, selectedType, localSearchQuery]
  );

  const handleTypeFilter = useCallback(
    (value: string): void => {
      setSelectedType(value);
      onFilterChange({
        status: selectedStatus as ConcessionApplicationStatusType | "all",
        applicationType: value as ConcessionApplicationTypeType | "all",
        searchQuery: localSearchQuery,
      });
    },
    [onFilterChange, selectedStatus, localSearchQuery]
  );

  const table = useReactTable<AdminApplication>({
    state: {
      columnVisibility,
    },
    columns,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
    manualPagination: true,
    data: sortedApplications,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
  });

  const renderPagination = () => (
    <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
      <div className="text-sm text-muted-foreground order-2 sm:order-1">
        {isLoading ? (
          <Skeleton className="h-5 w-52" />
        ) : totalCount > 0 ? (
          <>
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(currentPage * 10, totalCount)} of {totalCount}{" "}
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
          </>
        )}
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="space-y-4">
      <div className="w-full md:hidden">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={localSearchQuery}
              onKeyPress={handleSearchKeyPress}
              className="pl-10 pr-20 h-10 w-full"
              placeholder="Search by Application ID..."
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

      <div className="hidden md:flex md:items-center md:justify-between">
        <div className="flex-1 max-w-sm">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={localSearchQuery}
                className="pl-10 pr-20 h-10"
                onKeyPress={handleSearchKeyPress}
                placeholder="Search by Application ID..."
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
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-28" />
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-28 h-10">
                    Columns
                    <ChevronDown className="ml-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="bottom"
                  sideOffset={4}
                  className="w-44"
                >
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value: boolean) =>
                            column.toggleVisibility(value)
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
                            : column.id === "shortId"
                            ? "ID"
                            : column.id === "studentName"
                            ? "Name"
                            : column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 md:hidden">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-28" />
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-28 h-10">
                  Columns
                  <ChevronDown className="ml-2 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="bottom"
                sideOffset={4}
                className="w-44"
              >
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value: boolean) =>
                          column.toggleVisibility(value)
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
                          : column.id === "shortId"
                          ? "ID"
                          : column.id === "studentName"
                          ? "Name"
                          : column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
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
                <TableHead className="font-semibold h-12 text-center px-4 w-[200px]">
                  <Skeleton className="h-4 w-24 mx-auto" />
                </TableHead>
                <TableHead className="font-semibold h-12 text-center px-4 w-[150px]">
                  <Skeleton className="h-4 w-12 mx-auto" />
                </TableHead>
                <TableHead className="font-semibold h-12 text-center px-4 w-[120px]">
                  <Skeleton className="h-4 w-14 mx-auto" />
                </TableHead>
                <TableHead className="font-semibold h-12 text-center px-4 w-[200px]">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </TableHead>
                <TableHead className="font-semibold h-12 text-center px-4 w-[150px]">
                  <Skeleton className="h-4 w-20 mx-auto" />
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
                <TableRow
                  key={index}
                  className="hover:bg-muted/50 border-border/50"
                >
                  <TableCell className="p-4 text-center">
                    <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell className="p-4 text-center">
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="p-4 text-center">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32 mx-auto" />
                      <Skeleton className="h-3 w-24 mx-auto" />
                    </div>
                  </TableCell>
                  <TableCell className="p-4 text-center">
                    <Skeleton className="h-6 w-16 rounded-md mx-auto" />
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
        title="Failed to Fetch Applications"
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
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-border/50"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={`font-semibold h-12 text-center ${
                        header.id === "serialNo" ? "px-6" : "px-4"
                      }`}
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
                    <TableCell key={cell.id} className="p-4 text-center">
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
                          {localSearchQuery
                            ? `No applications found for "${localSearchQuery}".`
                            : "No concession applications have been submitted yet."}
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

      {!isLoading && !isError && renderPagination()}

      <ApproveApplicationDialog
        isOpen={showApproveDialog}
        onApprove={confirmApprove}
        application={selectedApplication}
        onClose={() => {
          setShowApproveDialog(false);
          setSelectedApplication(null);
        }}
      />

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>

          <Textarea
            id="rejectionReason"
            autoCapitalize="words"
            disabled={isRejecting}
            value={rejectionReason}
            className="mt-2 min-h-[100px] capitalize"
            placeholder="Please provide a detailed reason for rejecting this application..."
            onChange={(e) => {
              const capitalizedValue = e.target.value
                .split(" ")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ");
              setRejectionReason(capitalizedValue);
            }}
          />

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isRejecting}
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
                setSelectedApplication(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? "Rejecting..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRejectionReasonDialog}
        onOpenChange={setShowRejectionReasonDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejection Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {applicationDetails ? (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">
                  Application Rejected
                </h4>
                <p className="text-destructive/80">
                  {applicationDetails.rejectionReason}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 border rounded-lg space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                setShowRejectionReasonDialog(false);
                setSelectedApplication(null);
                setApplicationDetails(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsTable;
