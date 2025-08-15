"use client";

import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
                <Select
                  value={selectedBookletId}
                  onValueChange={handleBookletChange}
                >
                  <SelectTrigger id="booklet-select" className="w-full">
                    <SelectValue placeholder="Choose a booklet..." />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {availableBooklets.map((booklet) => (
                      <SelectItem
                        key={booklet.id}
                        value={booklet.id}
                        className="w-full"
                      >
                        <div className="flex items-center justify-between w-full min-w-0">
                          <span className="font-medium">
                            Booklet #{booklet.bookletNumber}
                          </span>
                          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {booklet._count.applications}/{booklet.totalPages}{" "}
                              used
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${
                                booklet.status === "InUse"
                                  ? "bg-primary text-white"
                                  : "bg-green-600 text-white"
                              }`}
                            >
                              {booklet.status === "InUse"
                                ? "In Use"
                                : "Available"}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  Serial range: {selectedBooklet.serialStartNumber} -
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
