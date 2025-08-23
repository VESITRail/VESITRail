"use client";

import {
  Eye,
  Trash2,
  FileUp,
  Loader2,
  BookOpen,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import {
  getBooklet,
  BookletItem,
  updateBooklet,
  UpdateBookletInput,
} from "@/actions/booklets";
import type {
  CloudinaryUploadWidgetInfo,
  CloudinaryUploadWidgetError,
  CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CldUploadButton } from "next-cloudinary";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useRouter, useParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { deleteCloudinaryFile } from "@/actions/cloudinary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UpdateBookletPage = () => {
  const router = useRouter();
  const params = useParams();
  const bookletId = params.id as string;

  const [publicId, setPublicId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [booklet, setBooklet] = useState<BookletItem | null>(null);

  const [formData, setFormData] = useState<UpdateBookletInput>({
    isDamaged: false,
    serialStartNumber: "",
    overlayTemplateUrl: "",
  });

  const [errors, setErrors] = useState<{
    serialStartNumber?: string;
    overlayTemplateUrl?: string;
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
      overlayTemplateUrl?: string;
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

    if (!formData.overlayTemplateUrl?.trim()) {
      newErrors.overlayTemplateUrl = "Overlay template is required";
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
          overlayTemplateUrl: bookletData.overlayTemplateUrl || "",
        });

        if (bookletData.overlayTemplateUrl) {
          const verifyAndSetDocument = async () => {
            setIsVerifying(true);

            const verifyToastId = toast.loading("Verifying template...", {
              description: "Please wait while we check your uploaded template.",
            });

            try {
              const response = await fetch(bookletData.overlayTemplateUrl!, {
                method: "HEAD",
              });

              if (response.ok) {
                const url = new URL(bookletData.overlayTemplateUrl!);
                const pathSegments = url.pathname.split("/");

                const uploadIndex = pathSegments.findIndex(
                  (segment) => segment === "upload"
                );
                if (
                  uploadIndex !== -1 &&
                  uploadIndex + 2 < pathSegments.length
                ) {
                  const publicIdParts = pathSegments.slice(uploadIndex + 2);
                  let publicId = publicIdParts.join("/");

                  if (publicId.includes(".")) {
                    publicId = publicId.substring(0, publicId.lastIndexOf("."));
                  }

                  setPublicId(`${decodeURIComponent(publicId)}.pdf`);
                }

                toast.dismiss(verifyToastId);
                toast.success("Template verified successfully!", {
                  description: "Your existing template is available.",
                });
              } else {
                setFormData((prev) => ({
                  ...prev,
                  overlayTemplateUrl: "",
                }));

                toast.dismiss(verifyToastId);
                toast.warning("Template not accessible", {
                  description:
                    "The existing template file could not be accessed. Please upload a new one.",
                });
              }
            } catch (error) {
              console.error("Error while verifying template:", error);
              setFormData((prev) => ({
                ...prev,
                overlayTemplateUrl: "",
              }));

              toast.dismiss(verifyToastId);
              toast.warning("Template verification failed", {
                description:
                  "Could not verify the existing template. Please upload a new one.",
              });
            } finally {
              setIsVerifying(false);
            }
          };

          verifyAndSetDocument();
        }
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

  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, []);

  const handleUploadSuccess = (result: CloudinaryUploadWidgetResults) => {
    try {
      const { public_id, secure_url } =
        result.info as CloudinaryUploadWidgetInfo;

      setPublicId(public_id);
      setFormData((prev) => ({
        ...prev,
        overlayTemplateUrl: secure_url,
      }));

      toast.success("Template uploaded successfully!", {
        description: "Your overlay template has been uploaded.",
      });

      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    } catch (error) {
      console.error("Error while processing uploaded template:", error);
      toast.error("Upload processing failed", {
        description: "Failed to process the uploaded template.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadError = (error: CloudinaryUploadWidgetError | null) => {
    setIsUploading(false);

    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    if (error) {
      console.error("Cloudinary upload error:", error);
    } else {
      console.error("Unknown error during Cloudinary upload");
    }

    toast.error("Failed to Upload Template", {
      description: "Please try again with a valid PDF file.",
    });
  };

  const handleDeleteFile = async (showToast = true): Promise<void> => {
    if (!formData.overlayTemplateUrl || !publicId) return;

    setIsDeleting(true);

    const deleteToastId = showToast
      ? toast.loading("Removing template...", {
          description: "Please wait while we remove your template.",
        })
      : null;

    try {
      console.log("Deleting Cloudinary file:", publicId);
      const result = await deleteCloudinaryFile(publicId);

      if (result.isSuccess) {
        setPublicId("");
        setFormData((prev) => ({
          ...prev,
          overlayTemplateUrl: "",
        }));

        if (showToast) {
          toast.dismiss(deleteToastId!);
          toast.success("Template removed successfully!", {
            description: "You can now upload a new template.",
          });
        }
      } else {
        const errorMessage = result.error?.message || "Unknown error";

        if (
          errorMessage.includes("not found") ||
          errorMessage.includes("does not exist")
        ) {
          setPublicId("");
          setFormData((prev) => ({
            ...prev,
            overlayTemplateUrl: "",
          }));

          if (showToast) {
            toast.dismiss(deleteToastId!);
            toast.success("Template cleared successfully!", {
              description:
                "The file was already removed from storage. You can now upload a new template.",
            });
          }
        } else {
          console.error("Cloudinary deletion failed:", errorMessage);
          setPublicId("");
          setFormData((prev) => ({
            ...prev,
            overlayTemplateUrl: "",
          }));

          if (showToast) {
            toast.dismiss(deleteToastId!);
            toast.warning("Template cleared from form", {
              description:
                "There was an issue removing the file from storage, but it has been cleared from your form. You can now upload a new template.",
            });
          }
        }
      }
    } catch (error) {
      if (showToast) {
        toast.dismiss(deleteToastId!);
      }

      if (error instanceof Error) {
        console.error("Error while deleting Cloudinary file:", error.message);

        if (
          error.message.includes("not found") ||
          error.message.includes("does not exist")
        ) {
          setPublicId("");
          setFormData((prev) => ({
            ...prev,
            overlayTemplateUrl: "",
          }));

          if (showToast) {
            toast.success("Template cleared successfully!", {
              description:
                "The file was already removed from storage. You can now upload a new template.",
            });
          }
        } else {
          setPublicId("");
          setFormData((prev) => ({
            ...prev,
            overlayTemplateUrl: "",
          }));

          if (showToast) {
            toast.warning("Template cleared from form", {
              description:
                "There was an issue removing the file, but it has been cleared from your form. You can now upload a new template.",
            });
          }
        }
      } else {
        console.error("Unknown error while deleting Cloudinary file:", error);

        setPublicId("");
        setFormData((prev) => ({
          ...prev,
          overlayTemplateUrl: "",
        }));

        if (showToast) {
          toast.warning("Template cleared from form", {
            description:
              "An unexpected error occurred, but the template has been cleared from your form. You can now upload a new template.",
          });
        }
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreviewFile = () => {
    if (formData.overlayTemplateUrl) {
      window.open(formData.overlayTemplateUrl, "_blank");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);

    const updatePromise = async () => {
      const result = await updateBooklet(bookletId, {
        isDamaged: formData.isDamaged,
        serialStartNumber: formData.serialStartNumber.toUpperCase().trim(),
        overlayTemplateUrl: formData.overlayTemplateUrl,
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

  if (loading || isVerifying) {
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
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-64" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-48 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-48" />
            </div>

            <div className="flex justify-end gap-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-32" />
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
            <h1 className="text-2xl font-semibold">
              Update Booklet #{booklet.bookletNumber}
            </h1>
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
            <Label className="text-base font-medium">
              Overlay Template <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-col items-center justify-center w-full">
              {!formData.overlayTemplateUrl ? (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg",
                    "bg-muted/50 transition-colors duration-200 relative",
                    "flex flex-col items-center justify-center w-full h-48",
                    !formData.serialStartNumber.trim() ||
                      !/^[A-Z]\d+$/.test(
                        formData.serialStartNumber.toUpperCase().trim()
                      )
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted/80",
                    isUploading && "pointer-events-none opacity-50"
                  )}
                >
                  <div className="flex flex-col items-center justify-center pt-6 pb-6 px-4 text-center">
                    {isUploading ? (
                      <>
                        <Loader2 className="size-10 mb-3 animate-spin text-primary" />
                        <p className="mb-2 text-base text-foreground font-semibold">
                          Uploading...
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Please wait while we upload your template
                        </p>
                      </>
                    ) : !formData.serialStartNumber.trim() ||
                      !/^[A-Z]\d+$/.test(
                        formData.serialStartNumber.toUpperCase().trim()
                      ) ? (
                      <>
                        <FileUp className="size-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-foreground font-semibold">
                          Enter serial start number first
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valid serial number required to upload template
                        </p>
                      </>
                    ) : (
                      <>
                        <FileUp className="size-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-foreground font-semibold">
                          Click to upload PDF
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF (MAX. 2MB)
                        </p>
                      </>
                    )}
                  </div>
                  {!isUploading &&
                    formData.serialStartNumber.trim() &&
                    /^[A-Z]\d+$/.test(
                      formData.serialStartNumber.toUpperCase().trim()
                    ) && (
                      <CldUploadButton
                        onError={handleUploadError}
                        onSuccess={handleUploadSuccess}
                        onUpload={() => setIsUploading(true)}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        options={{
                          maxFiles: 1,
                          resourceType: "raw",
                          maxFileSize: 2097152,
                          clientAllowedFormats: ["pdf"],
                          folder: "VESITRail/Concession Booklets",
                          uploadPreset: "VESITRail_Concession_Booklets",
                          publicId: `booklet-${Date.now()}-${Math.random()
                            .toString(36)
                            .substr(2, 9)}.pdf`,
                        }}
                      />
                    )}
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div className="border-2 border-solid border-border rounded-lg bg-muted/50 p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileUp className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground break-words">
                          Overlay Template
                        </p>
                        <p className="text-xs text-muted-foreground break-all">
                          PDF Document Uploaded Successfully
                        </p>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          title="Preview template"
                          onClick={handlePreviewFile}
                        >
                          <Eye className="size-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="w-full border-2 border-dashed border-border rounded-lg bg-accent/10 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground break-words">
                          Want to upload a different template?
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Remove the current template to upload a new one
                        </p>
                      </div>

                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        className="flex-shrink-0 gap-2"
                        onClick={() => handleDeleteFile()}
                        disabled={isDeleting || isUploading}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="size-4" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {errors.overlayTemplateUrl && (
              <p className="text-sm text-destructive">
                {errors.overlayTemplateUrl}
              </p>
            )}
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
              disabled={
                isUpdating ||
                !formData.serialStartNumber.trim() ||
                !formData.overlayTemplateUrl?.trim()
              }
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
