"use client";

import {
  BookletItem,
  updateBooklet,
  UpdateBookletInput,
} from "@/actions/booklets";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useCallback, useEffect } from "react";

type UpdateBookletDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  booklet: BookletItem | null;
  onBookletUpdated?: (booklet: BookletItem) => void;
};

const UpdateBookletDialog = ({
  isOpen,
  onClose,
  booklet,
  onBookletUpdated,
}: UpdateBookletDialogProps) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [formData, setFormData] = useState<UpdateBookletInput>({
    isDamaged: false,
    serialStartNumber: "",
  });

  const [errors, setErrors] = useState<{
    serialStartNumber?: string;
  }>({});

  const calculateSerialEndNumber = useCallback(
    (startNumber: string): string => {
      const upperStart = startNumber.toUpperCase();
      const match = upperStart.match(/^([A-Z])(\d+)$/);

      if (!match) {
        return "";
      }

      const prefix = match[1];
      const startNum = parseInt(match[2], 10);
      const endNum = startNum + 49;

      return `${prefix}${endNum.toString().padStart(match[2].length, "0")}`;
    },
    []
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: { serialStartNumber?: string } = {};

    if (!formData.serialStartNumber.trim()) {
      newErrors.serialStartNumber = "Serial start number is required";
    } else {
      const upperSerial = formData.serialStartNumber.toUpperCase().trim();
      if (!/^[A-Z]\d+$/.test(upperSerial)) {
        newErrors.serialStartNumber =
          "Invalid format. Use one letter followed by numbers (e.g., A0807551)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback(
    (field: keyof UpdateBookletInput, value: string | boolean) => {
      let processedValue = value;

      if (field === "serialStartNumber" && typeof value === "string") {
        processedValue = value.toUpperCase();
      }

      setFormData((prev) => ({ ...prev, [field]: processedValue }));
      if (field === "serialStartNumber" && errors.serialStartNumber) {
        setErrors((prev) => ({ ...prev, serialStartNumber: undefined }));
      }
    },
    [errors]
  );

  const handleSubmit = async () => {
    if (!booklet || !validateForm()) {
      return;
    }

    setIsUpdating(true);

    const updatePromise = async () => {
      const result = await updateBooklet(booklet.id, {
        ...formData,
        serialStartNumber: formData.serialStartNumber.toUpperCase().trim(),
      });

      if (result.isSuccess) {
        onBookletUpdated?.(result.data);
        onClose();
        return result.data;
      } else {
        throw new Error(result.error.message || "Failed to update booklet");
      }
    };

    toast.promise(updatePromise, {
      loading: "Updating Booklet...",
      success: "Booklet Updated Successfully",
      error: (error) => error.message || "Failed to update booklet",
      finally: () => {
        setIsUpdating(false);
      },
    });
  };

  const handleCancel = () => {
    onClose();
    if (booklet) {
      setFormData({
        isDamaged: booklet.status === "Damaged",
        serialStartNumber: booklet.serialStartNumber,
      });
    }
    setErrors({});
  };

  useEffect(() => {
    if (booklet && isOpen) {
      setFormData({
        isDamaged: booklet.status === "Damaged",
        serialStartNumber: booklet.serialStartNumber,
      });
      setErrors({});
    }
  }, [booklet, isOpen]);

  const serialEndNumber = formData.serialStartNumber.trim()
    ? calculateSerialEndNumber(formData.serialStartNumber)
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="size-5" />
            Update Booklet #{booklet?.bookletNumber}
          </DialogTitle>
          <DialogDescription>
            Update the booklet serial number and status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="serialStartNumber" className="text-sm font-medium">
              Serial Start Number <span className="text-destructive">*</span>
            </Label>

            <Input
              autoComplete="off"
              id="serialStartNumber"
              placeholder="e.g., A0807551"
              value={formData.serialStartNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange("serialStartNumber", e.target.value)
              }
              className={`${
                errors.serialStartNumber ? "border-destructive" : ""
              }`}
            />

            {errors.serialStartNumber && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {errors.serialStartNumber}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Format: One letter followed by numbers (e.g., A0807551)
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Serial End Number (Auto-calculated)
            </Label>

            <div className="p-2 bg-muted rounded-md">
              <span className="font-mono text-sm">
                {serialEndNumber ||
                  "Enter serial start number to see end number"}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              Automatically calculated based on 50 pages
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="isDamaged"
                className="cursor-pointer"
                checked={formData.isDamaged}
                onCheckedChange={(checked) =>
                  handleInputChange("isDamaged", checked === true)
                }
              />
              <Label htmlFor="isDamaged" className="text-sm cursor-pointer">
                Is the booklet damaged?
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isUpdating}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUpdating || !formData.serialStartNumber.trim()}
          >
            {isUpdating ? "Updating..." : "Update Booklet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateBookletDialog;
