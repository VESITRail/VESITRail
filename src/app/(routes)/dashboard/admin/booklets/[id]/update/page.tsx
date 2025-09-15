"use client";

import { BookOpen, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import {
  getBooklet,
  BookletItem,
  updateBooklet,
  UpdateBookletInput,
} from "@/actions/booklets";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useRouter, useParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UpdateBookletPage = () => {
  const router = useRouter();
  const params = useParams();
  const bookletId = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [booklet, setBooklet] = useState<BookletItem | null>(null);

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
    const newErrors: {
      serialStartNumber?: string;
    } = {};

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
      if (errors[field as keyof typeof errors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const fetchBooklet = useCallback(async () => {
    if (!bookletId) return;

    setLoading(true);

    try {
      const result = await getBooklet(bookletId);

      if (result.isSuccess) {
        const bookletData = result.data;
        setBooklet(bookletData);
        setFormData({
          isDamaged: bookletData.status === "Damaged",
          serialStartNumber: bookletData.serialStartNumber,
        });
      } else {
        toast.error("Booklet Not Found", {
          description: "The requested booklet could not be found.",
        });
        router.push("/dashboard/admin/booklets");
      }
    } catch (error) {
      console.error("Error while fetching booklet:", error);
      toast.error("Failed to Load Booklet", {
        description: "Unable to load booklet details. Please try again.",
      });
      router.push("/dashboard/admin/booklets");
    } finally {
      setLoading(false);
    }
  }, [bookletId, router]);

  useEffect(() => {
    fetchBooklet();
  }, [fetchBooklet]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);

    const updatePromise = async () => {
      const result = await updateBooklet(bookletId, {
        ...formData,
        serialStartNumber: formData.serialStartNumber.toUpperCase().trim(),
      });

      if (result.isSuccess) {
        router.push("/dashboard/admin/booklets");
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
    router.push("/dashboard/admin/booklets");
  };

  const serialEndNumber = formData.serialStartNumber.trim()
    ? calculateSerialEndNumber(formData.serialStartNumber)
    : "";

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="flex w-full gap-4 justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-10" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </div>
            <div className="flex justify-end gap-4 py-1">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booklet) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="flex w-full gap-4 justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            className="size-10"
            onClick={() => router.push("/dashboard/admin/booklets")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <BookOpen className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold">Update Booklet</h1>
          </div>
        </div>
      </div>

      <Separator className="mb-8" />

      <Card>
        <CardHeader>
          <CardTitle>Booklet Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

            <div className="h-9 px-3 py-2 bg-muted rounded-md flex items-center">
              <span className="font-mono text-sm">
                {serialEndNumber ||
                  "Enter serial start number to see end number"}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              Automatically calculated based on 50 pages
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm">Mark as Damaged</Label>
              <div className="text-sm text-muted-foreground">
                Check this if the booklet is damaged or unusable
              </div>
            </div>
            <Switch
              checked={formData.isDamaged}
              onCheckedChange={(checked) =>
                handleInputChange("isDamaged", checked)
              }
            />
          </div>

          <div className="flex justify-end gap-4 py-1">
            <Button
              variant="outline"
              disabled={isUpdating}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              className="min-w-32"
              onClick={handleSubmit}
              disabled={isUpdating || !formData.serialStartNumber.trim()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <BookOpen className="size-4" />
                  Update Booklet
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateBookletPage;
