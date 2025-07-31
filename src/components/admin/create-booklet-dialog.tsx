"use client";

import {
  BookletItem,
  createBooklet,
  CreateBookletInput,
} from "@/actions/booklets";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, AlertCircle } from "lucide-react";

type CreateBookletDialogProps = {
  onBookletCreated?: (booklet: BookletItem) => void;
};

const CreateBookletDialog = ({
  onBookletCreated,
}: CreateBookletDialogProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const [formData, setFormData] = useState<CreateBookletInput>({
    status: "Available",
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
    (field: keyof CreateBookletInput, value: string) => {
      let processedValue = value;

      if (field === "serialStartNumber") {
        processedValue = value.toUpperCase();
      }

      setFormData((prev) => ({ ...prev, [field]: processedValue }));
      if (errors[field as keyof typeof errors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);

    const createPromise = async () => {
      const result = await createBooklet({
        ...formData,
        serialStartNumber: formData.serialStartNumber.toUpperCase().trim(),
      });

      if (result.isSuccess) {
        onBookletCreated?.(result.data);
        setIsOpen(false);
        setFormData({
          status: "Available",
          serialStartNumber: "",
        });
        setErrors({});
        return result.data;
      } else {
        throw new Error(result.error.message || "Failed to create booklet");
      }
    };

    toast.promise(createPromise, {
      loading: "Creating Booklet...",
      success: "Booklet Created Successfully",
      error: (error) => error.message || "Failed to create booklet",
      finally: () => {
        setIsCreating(false);
      },
    });
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFormData({
      status: "Available",
      serialStartNumber: "",
    });
    setErrors({});
  };

  const serialEndNumber = formData.serialStartNumber.trim()
    ? calculateSerialEndNumber(formData.serialStartNumber)
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          Create Booklet
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            Create New Booklet
          </DialogTitle>
          <DialogDescription>
            Create a new concession booklet with 50 pages.
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isCreating}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || !formData.serialStartNumber.trim()}
          >
            {isCreating ? "Creating..." : "Create Booklet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBookletDialog;
