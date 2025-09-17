"use client";

import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AvailableBooklet,
  getAvailableBooklets,
  updateBookletDamagedPages,
} from "@/actions/booklets";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminApplication } from "@/actions/concession";
import { useState, useEffect, useCallback } from "react";
import { ExternalLink, AlertTriangle } from "lucide-react";

type ApproveApplicationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  application: AdminApplication | null;
  onApprove: (applicationId: string, bookletId: string) => Promise<void>;
};

const ApproveApplicationDialog: React.FC<ApproveApplicationDialogProps> = ({
  isOpen,
  onClose,
  onApprove,
  application,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [nextSerialNumber, setNextSerialNumber] = useState<string>("");
  const [selectedBookletId, setSelectedBookletId] = useState<string>("");
  const [isMarkingDamaged, setIsMarkingDamaged] = useState<boolean>(false);
  const [availableBooklets, setAvailableBooklets] = useState<
    AvailableBooklet[]
  >([]);

  const loadAvailableBooklets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAvailableBooklets();
      if (result.isSuccess) {
        setAvailableBooklets(result.data);

        if (result.data.length > 0) {
          const latestBooklet = result.data[0];
          setSelectedBookletId(latestBooklet.id);
          calculateNextSerialNumber(latestBooklet);
        }
      } else {
        toast.error("Failed to Load Booklets", {
          description: "Unable to fetch available booklets. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error loading booklets:", error);
      toast.error("Failed to Load Booklets", {
        description: "An unexpected error occurred while loading booklets.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateNextSerialNumber = (booklet: AvailableBooklet) => {
    const serialStart = booklet.serialStartNumber;
    const prefix = serialStart.replace(/\d+$/, "");
    const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
    const damagedPages = Array.isArray(booklet.damagedPages)
      ? booklet.damagedPages
      : [];

    let nextPage = booklet._count.applications;
    while (damagedPages.includes(nextPage) && nextPage < booklet.totalPages) {
      nextPage++;
    }

    const nextNum = startNum + nextPage;
    const paddingLength = serialStart.match(/\d+$/)?.[0]?.length || 3;

    const nextSerial = `${prefix}${nextNum
      .toString()
      .padStart(paddingLength, "0")}`;
    setNextSerialNumber(nextSerial);
    return nextPage;
  };

  const generateBookletSearchTerms = (booklet: AvailableBooklet) => {
    const serialStart = booklet.serialStartNumber;
    const prefix = serialStart.replace(/\d+$/, "");
    const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
    const endNum = startNum + 49;
    const paddingLength = serialStart.match(/\d+$/)?.[0]?.length || 3;
    const serialEnd = `${prefix}${endNum
      .toString()
      .padStart(paddingLength, "0")}`;

    const statusText = booklet.status === "InUse" ? "in use" : "available";
    const damagedCount = Array.isArray(booklet.damagedPages)
      ? booklet.damagedPages.length
      : 0;
    const usageText = `${booklet._count.applications}/${booklet.totalPages} used`;
    const damageText =
      damagedCount > 0 ? `${damagedCount} damaged` : "no damage";

    const searchTerms = [
      prefix,
      usageText,
      serialEnd,
      statusText,
      damageText,
      serialStart,
      `#${booklet.bookletNumber}`,
      booklet.status.toLowerCase(),
      `${booklet.totalPages} total`,
      booklet.bookletNumber.toString(),
      `booklet ${booklet.bookletNumber}`,
      `${booklet._count.applications} used`,
      `${damagedCount} damaged pages`,
      `${
        booklet.totalPages - booklet._count.applications - damagedCount
      } remaining`,
    ].join(" ");

    return searchTerms;
  };

  const handleBookletChange = (bookletId: string) => {
    setSelectedBookletId(bookletId);
    const selectedBooklet = availableBooklets.find((b) => b.id === bookletId);
    if (selectedBooklet) {
      calculateNextSerialNumber(selectedBooklet);
    }
  };

  const handleApprove = async () => {
    if (!application || !selectedBookletId) {
      toast.error("Selection Required", {
        description:
          "Please select a booklet before approving the application.",
      });
      return;
    }

    setIsApproving(true);
    try {
      await onApprove(application.id, selectedBookletId);
      onClose();
    } catch (error) {
      console.error("Error approving application:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleClose = () => {
    setSelectedBookletId("");
    setNextSerialNumber("");
    setAvailableBooklets([]);
    onClose();
  };

  const handleMarkCurrentPageAsDamaged = async () => {
    const selectedBooklet = availableBooklets.find(
      (b) => b.id === selectedBookletId
    );
    if (!selectedBooklet) return;

    setIsMarkingDamaged(true);
    try {
      const damagedPages = Array.isArray(selectedBooklet.damagedPages)
        ? selectedBooklet.damagedPages
        : [];

      const currentPageOffset = calculateNextSerialNumber(selectedBooklet);

      if (damagedPages.includes(currentPageOffset)) {
        toast.error("Page Already Marked", {
          description: "This page is already marked as damaged.",
        });
        return;
      }

      const updatedDamagedPages = [...damagedPages, currentPageOffset].sort(
        (a, b) => a - b
      );

      const result = await updateBookletDamagedPages(
        selectedBookletId,
        updatedDamagedPages
      );

      if (result.isSuccess) {
        const updatedBooklet = result.data;
        setAvailableBooklets((prev) =>
          prev.map((b) =>
            b.id === selectedBookletId
              ? { ...b, damagedPages: updatedBooklet.damagedPages }
              : b
          )
        );

        calculateNextSerialNumber({
          ...selectedBooklet,
          damagedPages: updatedBooklet.damagedPages,
        });

        const humanPageNumber = currentPageOffset + 1;
        toast.success("Page Marked as Damaged", {
          description: `Page ${humanPageNumber} has been marked as damaged.`,
        });
      } else {
        toast.error("Failed to Mark as Damaged", {
          description: "Could not mark the page as damaged. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error marking page as damaged:", error);
      toast.error("Error", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsMarkingDamaged(false);
    }
  };

  useEffect(() => {
    if (isOpen && application) {
      loadAvailableBooklets();
    }
  }, [isOpen, application, loadAvailableBooklets]);

  const selectedBooklet = availableBooklets.find(
    (b) => b.id === selectedBookletId
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Approve Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {application && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Application Details</div>
              <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Application ID
                    </div>
                    <div className="font-mono text-sm">
                      #{application.shortId}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Type
                    </div>
                    <div className="text-sm font-medium">
                      {application.applicationType}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Student
                  </div>
                  <div className="text-sm font-medium">
                    {application.student.firstName}{" "}
                    {application.student.lastName}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booklet-select" className="text-sm font-medium">
                Select Booklet
              </Label>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-7 w-24" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : availableBooklets.length === 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    No available booklets found. Please create a new booklet
                    first.
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      router.push("/dashboard/admin/booklets");
                    }}
                  >
                    <ExternalLink className="size-4" />
                    Go to Booklets Management
                  </Button>
                </div>
              ) : (
                <Combobox
                  options={availableBooklets.map((booklet) => ({
                    data: booklet,
                    value: booklet.id,
                    label: `Booklet #${booklet.bookletNumber}`,
                    searchTerms: generateBookletSearchTerms(booklet),
                  }))}
                  className="w-full"
                  value={selectedBookletId}
                  showFullOptionInTrigger={true}
                  onValueChange={handleBookletChange}
                  placeholder="Search and select a booklet..."
                  emptyText="No booklets found matching your search."
                  searchPlaceholder="Search by booklet number, serial, status..."
                  renderOption={(option) => {
                    const booklet = option.data as AvailableBooklet;
                    const damagedCount = Array.isArray(booklet.damagedPages)
                      ? booklet.damagedPages.length
                      : 0;

                    return (
                      <div className="flex items-center justify-between w-full min-w-0">
                        <span className="font-medium pointer-events-none">
                          Booklet #{booklet.bookletNumber}
                        </span>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0 pointer-events-none">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {booklet._count.applications}/{booklet.totalPages}{" "}
                            used
                            {damagedCount > 0 && (
                              <span className="text-destructive ml-1">
                                • {damagedCount} damaged
                              </span>
                            )}
                          </span>
                          <Badge
                            className="text-xs whitespace-nowrap pointer-events-none"
                            variant={
                              booklet.status === "InUse" ? "default" : "outline"
                            }
                          >
                            {booklet.status === "InUse"
                              ? "In Use"
                              : "Available"}
                          </Badge>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </div>

            {selectedBooklet && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="serial-number"
                    className="text-sm font-medium"
                  >
                    Next Serial Number
                  </Label>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isMarkingDamaged}
                    className="h-7 px-3 text-xs"
                    onClick={handleMarkCurrentPageAsDamaged}
                  >
                    <AlertTriangle className="size-3 mr-1" />
                    {isMarkingDamaged ? "Marking..." : "Mark as Damaged"}
                  </Button>
                </div>
                <Input
                  readOnly
                  id="serial-number"
                  value={nextSerialNumber}
                  className="font-mono bg-muted/50 text-center text-lg font-semibold"
                />
                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serial Range:</span>
                    <span className="font-mono">
                      {selectedBooklet.serialStartNumber} -{" "}
                      {selectedBooklet.serialStartNumber.replace(/\d+$/, "") +
                        (
                          parseInt(
                            selectedBooklet.serialStartNumber.match(
                              /\d+$/
                            )?.[0] || "0"
                          ) + 49
                        )
                          .toString()
                          .padStart(
                            selectedBooklet.serialStartNumber.match(/\d+$/)?.[0]
                              ?.length || 3,
                            "0"
                          )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage:</span>
                    <span>
                      {selectedBooklet._count.applications}/
                      {selectedBooklet.totalPages} pages used
                    </span>
                  </div>
                  {Array.isArray(selectedBooklet.damagedPages) &&
                    selectedBooklet.damagedPages.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Damaged:</span>
                        <span className="text-destructive font-medium">
                          {selectedBooklet.damagedPages
                            .map((page) => page + 1)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isApproving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={
              isApproving ||
              !selectedBookletId ||
              availableBooklets.length === 0
            }
          >
            {isApproving ? "Approving..." : "Approve Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveApplicationDialog;
