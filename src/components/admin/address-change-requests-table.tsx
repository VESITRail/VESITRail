import {
  Eye,
  Check,
  Filter,
  Search,
  XCircle,
  FileText,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  User,
  Calendar,
  Home,
  Train,
} from "lucide-react";
import {
  getAddressChangeRequestDetails,
  reviewAddressChangeRequest,
  AddressChangeRequestItem,
} from "@/actions/address-change-requests";
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
  AlertDialog,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "../ui/input";
import { toTitleCase } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressChangeStatusType } from "@/generated/zod";
import { useCallback, useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    displayName?: string;
  }
}

type SortOrder = "asc" | "desc";

const StatusBadge = ({ status }: { status: AddressChangeStatusType }) => {
  const variants = {
    Rejected: "bg-red-600 text-white",
    Pending: "bg-amber-600 text-white",
    Approved: "bg-green-600 text-white",
  };

  return <Badge className={`${variants[status]} font-medium`}>{status}</Badge>;
};

const AddressChangeRequestDetailsDialog = ({
  request,
  adminId,
  onRequestUpdate,
}: {
  adminId: string;
  request: AddressChangeRequestItem;
  onRequestUpdate?: (updatedRequest: AddressChangeRequestItem) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [requestDetails, setRequestDetails] =
    useState<AddressChangeRequestItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [showRejectDialog, setShowRejectDialog] = useState<boolean>(false);
  const [showApproveDialog, setShowApproveDialog] = useState<boolean>(false);

  const loadRequestDetails = useCallback(async () => {
    if (!request.id) return;

    setIsLoading(true);
    try {
      const result = await getAddressChangeRequestDetails(request.id);

      if (result.isSuccess) {
        setRequestDetails(result.data);
      } else {
        console.error("Failed to load request details:", result.error);
        toast.error("Failed to Load Details", {
          description: "Unable to load request details. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error loading request details:", error);
      toast.error("Error Loading Details", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [request.id]);

  const handleApprove = async () => {
    if (!requestDetails) return;

    setIsApproving(true);

    const approvePromise = async () => {
      const result = await reviewAddressChangeRequest(
        requestDetails.id,
        adminId,
        "Approved"
      );

      if (result.isSuccess) {
        const updatedRequest = {
          ...requestDetails,
          status: "Approved" as AddressChangeStatusType,
          reviewedAt: new Date(),
        };

        setRequestDetails(updatedRequest);
        onRequestUpdate?.(updatedRequest);
        setShowApproveDialog(false);
        setIsOpen(false);
        return updatedRequest;
      } else {
        throw new Error(
          result.error.type === "VALIDATION_ERROR"
            ? result.error.message
            : "Unable to approve the request. Please try again."
        );
      }
    };

    toast.promise(approvePromise, {
      loading: "Approving request...",
      success: "Request Approved Successfully",
      error: (error) => error.message || "Failed to approve request",
      finally: () => {
        setIsApproving(false);
      },
    });
  };

  const handleReject = async () => {
    if (!requestDetails) return;

    setIsRejecting(true);

    const rejectPromise = async () => {
      const result = await reviewAddressChangeRequest(
        requestDetails.id,
        adminId,
        "Rejected"
      );

      if (result.isSuccess) {
        const updatedRequest = {
          ...requestDetails,
          status: "Rejected" as AddressChangeStatusType,
          reviewedAt: new Date(),
        };

        setRequestDetails(updatedRequest);
        onRequestUpdate?.(updatedRequest);
        setShowRejectDialog(false);
        setIsOpen(false);
        return updatedRequest;
      } else {
        throw new Error(
          result.error.type === "VALIDATION_ERROR"
            ? result.error.message
            : "Unable to reject the request. Please try again."
        );
      }
    };

    toast.promise(rejectPromise, {
      loading: "Rejecting request...",
      success: "Request Rejected Successfully",
      error: (error) => error.message || "Failed to reject request",
      finally: () => {
        setIsRejecting(false);
      },
    });
  };

  useEffect(() => {
    if (isOpen) {
      loadRequestDetails();
    } else {
      setRequestDetails(null);
    }
  }, [isOpen, loadRequestDetails]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <Eye className="size-4" />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-0">
              {/* Header Section */}
              <div className="flex mt-4 items-center justify-between pb-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              <Skeleton className="h-px w-full" />

              {/* Student Information Section */}
              <div className="py-6">
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              </div>

              <Skeleton className="h-px w-full" />

              {/* Current vs New Details Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
                <div className="space-y-6">
                  <div>
                    <Skeleton className="h-4 w-28 mb-4" />
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Skeleton className="size-4 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-24" />
                          <div className="p-3 bg-muted/50 rounded-md">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4 mt-1" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-4" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Skeleton className="h-4 w-32 mb-4" />
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Skeleton className="size-4 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-20" />
                          <div className="p-3 bg-muted/50 rounded-md">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3 mt-1" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-4" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-14" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Skeleton className="h-px w-full" />

              {/* Request Timeline Section */}
              <div className="py-6">
                <Skeleton className="h-4 w-28 mb-4" />
                <div className="space-y-3 flex flex-col md:flex-row gap-3 md:gap-6 items-start">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              </div>

              <Skeleton className="h-px w-full" />

              {/* Verification Document Section */}
              <div className="py-6">
                <Skeleton className="h-4 w-36 mb-4" />
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <Skeleton className="size-4" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>

              <Skeleton className="h-px w-full" />

              {/* Action Buttons Section */}
              <div className="flex gap-4 pt-6">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </div>
          ) : requestDetails ? (
            <div className="space-y-0">
              <div className="flex mt-4 items-center justify-between pb-6">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      Address Change Request
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {toTitleCase(
                        `${requestDetails.student.firstName} ${requestDetails.student.middleName} ${requestDetails.student.lastName}`
                      )}
                    </p>
                  </div>
                </div>

                <StatusBadge status={requestDetails.status} />
              </div>

              <Separator />

              <div className="py-6">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
                  Student Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {toTitleCase(
                          `${requestDetails.student.firstName} ${requestDetails.student.middleName} ${requestDetails.student.lastName}`
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {requestDetails.student.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {requestDetails.student.class.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {requestDetails.student.class.year.name} -{" "}
                        {requestDetails.student.class.branch.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
                      Current Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Home className="size-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Current Address
                          </p>
                          <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-sm">
                              {requestDetails.currentAddress}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Train className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {requestDetails.currentStation.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {requestDetails.currentStation.code}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
                      Requested Changes
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Home className="size-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            New Address
                          </p>
                          <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-sm">
                              {requestDetails.newAddress}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Train className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {requestDetails.newStation.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {requestDetails.newStation.code}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="py-6">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
                  Request Timeline
                </h4>
                <div className="space-y-3 flex flex-col md:flex-row gap-3 md:gap-6 items-start">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Submitted</p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(requestDetails.createdAt),
                          "MMM dd, yyyy 'at' h:mm a"
                        )}
                      </p>
                    </div>
                  </div>
                  {requestDetails.reviewedAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Reviewed</p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(requestDetails.reviewedAt),
                            "MMM dd, yyyy 'at' h:mm a"
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="py-6">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
                  Verification Document
                </h4>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex-1">
                    Student Verification Document
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(requestDetails.verificationDocUrl, "_blank")
                    }
                  >
                    <ExternalLink className="size-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>

              {requestDetails.status === "Pending" && (
                <>
                  <Separator />
                  <div className="flex gap-4 pt-6">
                    <Button
                      className="flex-1"
                      variant="destructive"
                      disabled={isApproving || isRejecting}
                      onClick={() => setShowRejectDialog(true)}
                    >
                      <XCircle className="size-4 mr-2" />
                      Reject Request
                    </Button>
                    <Button
                      onClick={() => setShowApproveDialog(true)}
                      className="flex-1"
                      disabled={isApproving || isRejecting}
                    >
                      <Check className="size-4 mr-2" />
                      Approve Request
                    </Button>
                  </div>
                </>
              )}

              {requestDetails.reviewedBy && (
                <>
                  <Separator />
                  <div className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      Reviewed by{" "}
                      <span className="font-medium text-foreground">
                        {toTitleCase(requestDetails.reviewedBy.user.name)}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                Failed to load request details.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Address Change Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this address change request? This
              will update the student&apos;s address and station information
              permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isApproving} onClick={handleApprove}>
              {isApproving ? "Approving..." : "Approve Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Address Change Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this address change request? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isRejecting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRejecting ? "Rejecting..." : "Reject Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

type AddressChangeRequestsTableProps = {
  adminId: string;
  isError: boolean;
  isLoading: boolean;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  requests: AddressChangeRequestItem[];
  onPageChange: (page: number) => void;
  onSearchChange: (query: string) => void;
  onRequestUpdate?: (updatedRequest: AddressChangeRequestItem) => void;
  onFilterChange: (filters: {
    status?: AddressChangeStatusType | "all";
  }) => void;
};

const AddressChangeRequestsTable = ({
  adminId,
  isError,
  requests,
  isLoading,
  totalCount,
  totalPages,
  currentPage,
  hasNextPage,
  searchQuery,
  onPageChange,
  onFilterChange,
  onSearchChange,
  onRequestUpdate,
  hasPreviousPage,
}: AddressChangeRequestsTableProps) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AddressChangeRequestItem | "studentName";
    direction: SortOrder;
  } | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [localSearchQuery, setLocalSearchQuery] = useState<string>(searchQuery);

  const handleSort = useCallback(
    (key: keyof AddressChangeRequestItem | "studentName") => {
      setSortConfig((prevConfig) => ({
        key,
        direction:
          prevConfig?.key === key && prevConfig.direction === "asc"
            ? "desc"
            : "asc",
      }));
    },
    []
  );

  const handleSearchSubmit = useCallback(() => {
    onSearchChange(localSearchQuery);
  }, [localSearchQuery, onSearchChange]);

  const handleStatusFilter = useCallback(
    (value: string) => {
      setSelectedStatus(value);
      onFilterChange({
        status: value as AddressChangeStatusType | "all",
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

  const sortedRequests = useMemo(() => {
    if (!sortConfig) return requests;

    return [...requests].sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      if (sortConfig.key === "studentName") {
        aValue = `${a.student.firstName} ${a.student.middleName} ${a.student.lastName}`;
        bValue = `${b.student.firstName} ${b.student.middleName} ${b.student.lastName}`;
      } else {
        aValue = a[sortConfig.key] as string | Date;
        bValue = b[sortConfig.key] as string | Date;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [requests, sortConfig]);

  const columns: ColumnDef<AddressChangeRequestItem>[] = useMemo(
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
        size: 200,
        id: "studentName",
        meta: { displayName: "Name" },
        header: () => <div className="text-center">Name</div>,
        accessorKey: "studentName",
        cell: ({ row }) => {
          const request = row.original;
          const fullName = `${request.student.firstName} ${request.student.middleName} ${request.student.lastName}`;

          return (
            <div className="space-y-1 text-center">
              <p className="font-medium text-foreground">
                {toTitleCase(fullName)}
              </p>
              <p className="text-xs text-muted-foreground">
                {request.student.user.email}
              </p>
            </div>
          );
        },
      },
      {
        size: 150,
        id: "class",
        meta: { displayName: "Academic Info" },
        header: () => <div className="text-center">Academic Info</div>,
        accessorKey: "class",
        cell: ({ row }) => {
          const request = row.original;
          return (
            <div className="space-y-1 text-center">
              <p className="font-medium text-foreground text-sm">
                {request.student.class.code}
              </p>
              <p className="text-xs text-muted-foreground">
                {request.student.class.year.name} •{" "}
                {request.student.class.branch.code}
              </p>
            </div>
          );
        },
      },
      {
        id: "stations",
        meta: { displayName: "Station Change" },
        accessorKey: "stations",
        header: () => <div className="text-center">Station Change</div>,
        cell: ({ row }) => {
          const request = row.original;
          return (
            <div className="space-y-1 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  From:
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  {request.currentStation.name}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  To:
                </span>
                <span className="text-sm font-medium">
                  {request.newStation.name}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        meta: { displayName: "Status" },
        accessorKey: "status",
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
        id: "createdAt",
        meta: { displayName: "Submitted" },
        accessorKey: "createdAt",
        header: () => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => handleSort("createdAt")}
              className="h-8 px-2 data-[state=open]:bg-accent"
            >
              Submitted
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
      {
        id: "actions",
        meta: { displayName: "Actions" },
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <AddressChangeRequestDetailsDialog
              adminId={adminId}
              request={row.original}
              onRequestUpdate={onRequestUpdate}
            />
          </div>
        ),
      },
    ],
    [adminId, handleSort, onRequestUpdate, currentPage]
  );

  const table = useReactTable({
    columns,
    data: sortedRequests,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <>
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </TableCell>
              <TableCell className="flex items-center justify-center my-1">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16 mx-auto" />
                  <Skeleton className="h-3 w-24 mx-auto" />
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 mx-auto" />
                  <Skeleton className="h-4 w-28 mx-auto" />
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-6 w-16 rounded-full mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-20 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-8 w-8 mx-auto" />
              </TableCell>
            </TableRow>
          ))}
        </>
      );
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-muted/50">
                <XCircle className="size-8 text-destructive" />
              </div>

              <h3 className="text-lg font-semibold text-foreground">
                Failed to load address change requests. Please try again.
              </h3>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (sortedRequests.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-64">
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-muted/50">
                  <MapPin className="size-8 text-muted-foreground" />
                </div>

                <div className="space-y-2 text-center">
                  <h3 className="text-lg font-semibold text-foreground">
                    No address change requests found
                  </h3>

                  <p className="text-sm text-muted-foreground max-w-md">
                    No address change requests match your current search and
                    filter criteria.
                  </p>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return table.getRowModel().rows.map((row) => (
      <TableRow
        key={row.id}
        className="hover:bg-muted/50 border-border/50"
        data-state={row.getIsSelected() && "selected"}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} className="p-4 text-center">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={localSearchQuery}
                  className="pl-10 pr-20 h-10"
                  placeholder="Search requests..."
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
              </>
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-10 w-36" />
          ) : (
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
          <TableBody>{renderTableContent()}</TableBody>
        </Table>
      </div>

      {!isLoading && !isError && (
        <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            {totalCount > 0 ? (
              <>
                Showing {(currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, totalCount)} of {totalCount}{" "}
                request(s)
              </>
            ) : (
              "Showing 0 of 0 requests"
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

export default AddressChangeRequestsTable;
