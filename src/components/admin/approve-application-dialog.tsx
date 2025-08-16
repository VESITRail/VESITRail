"use client";

import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminApplication } from "@/actions/concession";
import { useState, useEffect, useCallback } from "react";
import { AvailableBooklet, getAvailableBooklets } from "@/actions/booklets";

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
    const nextNum = startNum + booklet._count.applications;
    const paddingLength = serialStart.match(/\d+$/)?.[0]?.length || 3;

    const nextSerial = `${prefix}${nextNum
      .toString()
      .padStart(paddingLength, "0")}`;
    setNextSerialNumber(nextSerial);
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
    const usageText = `${booklet._count.applications}/${booklet.totalPages} used`;

    const searchTerms = [
      prefix,
      usageText,
      serialEnd,
      statusText,
      serialStart,
      `#${booklet.bookletNumber}`,
      booklet.status.toLowerCase(),
      `${booklet.totalPages} total`,
      booklet.bookletNumber.toString(),
      `booklet ${booklet.bookletNumber}`,
      `${booklet._count.applications} used`,
      `${booklet.totalPages - booklet._count.applications} remaining`,
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
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono">#{application.shortId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{application.applicationType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Student:</span>
                  <span>
                    {application.student.firstName}{" "}
                    {application.student.lastName}
                  </span>
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
                <Skeleton className="h-10 w-full" />
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

                    return (
                      <div className="flex items-center justify-between w-full min-w-0">
                        <span className="font-medium">
                          Booklet #{booklet.bookletNumber}
                        </span>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {booklet._count.applications}/{booklet.totalPages}{" "}
                            used
                          </span>
                          <Badge
                            variant={
                              booklet.status === "InUse" ? "default" : "outline"
                            }
                            className={`text-xs whitespace-nowrap ${
                              booklet.status === "InUse"
                                ? ""
                                : "bg-green-600 text-white border-green-600"
                            }`}
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
                <Label htmlFor="serial-number" className="text-sm font-medium">
                  Next Serial Number
                </Label>
                <Input
                  readOnly
                  id="serial-number"
                  value={nextSerialNumber}
                  className="font-mono bg-muted/50"
                />
                <div className="text-xs text-muted-foreground">
                  Serial range: {selectedBooklet.serialStartNumber} -{" "}
                  {selectedBooklet.serialStartNumber.replace(/\d+$/, "") +
                    (
                      parseInt(
                        selectedBooklet.serialStartNumber.match(/\d+$/)?.[0] ||
                          "0"
                      ) + 49
                    )
                      .toString()
                      .padStart(
                        selectedBooklet.serialStartNumber.match(/\d+$/)?.[0]
                          ?.length || 3,
                        "0"
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
