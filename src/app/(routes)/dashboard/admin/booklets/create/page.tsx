"use client";

import {
  Eye,
  FileUp,
  Trash2,
  Loader2,
  BookOpen,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import type {
  CloudinaryUploadWidgetInfo,
  CloudinaryUploadWidgetError,
  CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CldUploadButton } from "next-cloudinary";
import { Separator } from "@/components/ui/separator";
import { deleteCloudinaryFile } from "@/actions/cloudinary";
import { createBooklet, CreateBookletInput } from "@/actions/booklets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CreateBookletPage = () => {
  const router = useRouter();
  const [publicId, setPublicId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [formData, setFormData] = useState<CreateBookletInput>({
    status: "Available",
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

    if (!formData.overlayTemplateUrl.trim()) {
      newErrors.overlayTemplateUrl = "Overlay template is required";
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

    setIsCreating(true);

    const createPromise = async () => {
      const result = await createBooklet({
        ...formData,
        serialStartNumber: formData.serialStartNumber.toUpperCase().trim(),
      });

      if (result.isSuccess) {
        setFormData({
          status: "Available",
          serialStartNumber: "",
          overlayTemplateUrl: "",
        });
        setErrors({});
        setPublicId("");
        setIsUploading(false);
        setIsDeleting(false);
        router.push("/dashboard/admin/booklets");
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
    setFormData({
      status: "Available",
      serialStartNumber: "",
      overlayTemplateUrl: "",
    });
    setErrors({});
    setPublicId("");
    setIsUploading(false);
    setIsDeleting(false);
    router.push("/dashboard/admin/booklets");
  };

  const serialEndNumber = formData.serialStartNumber.trim()
    ? calculateSerialEndNumber(formData.serialStartNumber)
    : "";

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
            <h1 className="text-2xl font-semibold">Create New Booklet</h1>
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

          <div className="space-y-2">
            <Label className="text-base font-medium">
              Overlay Template <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-col items-center justify-center w-full">
              {!formData.overlayTemplateUrl ? (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg",
                    "flex flex-col items-center justify-center w-full h-48",
                    "bg-muted/50 transition-colors duration-200 relative",
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

          <div className="flex justify-end gap-4 py-1">
            <Button
              variant="outline"
              disabled={isCreating}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              className="min-w-32"
              onClick={handleSubmit}
              disabled={
                isCreating ||
                !formData.serialStartNumber.trim() ||
                !formData.overlayTemplateUrl.trim()
              }
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BookOpen className="size-4" />
                  Create Booklet
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateBookletPage;
