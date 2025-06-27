"use client";

import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import type { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { CldUploadButton } from "next-cloudinary";
import { Skeleton } from "@/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteCloudinaryFile } from "@/actions/cloudinary";
import { DocumentSchema } from "@/lib/validations/onboarding";
import { OnboardingSchema } from "@/lib/validations/onboarding";
import { FileUp, Upload, Loader2, Eye, X, Trash } from "lucide-react";

type DocumentProps = {
  errors?: Record<string, string>;
  defaultValues?: z.infer<typeof OnboardingSchema>;
  setFormData: (data: z.infer<typeof OnboardingSchema>) => void;
};

const Document = ({ errors, setFormData, defaultValues }: DocumentProps) => {
  const router = useRouter();
  const session = authClient.useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [publicId, setPublicId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (defaultValues?.verificationDocUrl) {
      const id = defaultValues.verificationDocUrl
        .split("/")
        .pop()
        ?.split(".")[0];

      if (id) {
        setPublicId(`VESITRail/${id}.pdf`);
      }
    }
  }, [defaultValues?.verificationDocUrl]);

  if (session.isPending) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <div className="border-2 border-dashed rounded-lg p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 text-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    );
  }

  if (!session.data?.user) {
    router.push("/");
    return null;
  }

  const form = useForm<z.infer<typeof DocumentSchema>>({
    resolver: zodResolver(DocumentSchema),
    defaultValues: {
      verificationDocUrl: defaultValues?.verificationDocUrl || "",
    },
  });

  const watchedUrl = form.watch("verificationDocUrl");

  useEffect(() => {
    if (errors) {
      Object.entries(errors).forEach(([key, value]) => {
        form.setError(key as keyof z.infer<typeof DocumentSchema>, {
          type: "manual",
          message: value,
        });
      });
    }
  }, [errors, form]);

  const onSubmit = (data: z.infer<typeof DocumentSchema>) => {
    if (defaultValues) {
      setFormData({
        ...defaultValues,
        ...data,
      });
    } else {
      setFormData({
        ...data,
        year: "",
        class: "",
        branch: "",
        station: "",
        address: "",
        lastName: "",
        firstName: "",
        middleName: "",
        gender: "Male",
        dateOfBirth: "",
        preferredConcessionClass: "",
        preferredConcessionPeriod: "",
      });
    }
  };

  const handleUploadSuccess = (result: any) => {
    setIsUploading(false);

    try {
      const { public_id, secure_url } = result.info;

      setPublicId(public_id);
      form.clearErrors("verificationDocUrl");
      form.setValue("verificationDocUrl", secure_url);

      onSubmit({ verificationDocUrl: secure_url });

      toast.success("Document uploaded successfully!", {
        description: "Your verification document has been uploaded.",
        duration: 4000,
      });
    } catch (error) {
      console.error("Upload processing error:", error);
      toast.error("Upload processing failed", {
        description:
          "Failed to process the uploaded document. Please try again.",
        duration: 5000,
      });
    }
  };

  const handleUploadError = (error: any) => {
    setIsUploading(false);
    console.error("Upload error:", error);
    toast.error("Failed to upload document", {
      description: error?.message || "Please try again with a valid PDF file.",
      duration: 5000,
    });
  };

  const handleRemoveFile = async () => {
    if (!watchedUrl || !publicId) return;

    setIsDeleting(true);

    const deletePromise = deleteCloudinaryFile(publicId);

    toast.promise(deletePromise, {
      loading: "Removing document...",
      success: (result) => {
        if (result.isSuccess) {
          setPublicId("");
          form.setValue("verificationDocUrl", "");

          if (defaultValues) {
            setFormData({
              ...defaultValues,
              verificationDocUrl: "",
            });
          } else {
            setFormData({
              year: "",
              class: "",
              branch: "",
              station: "",
              address: "",
              lastName: "",
              firstName: "",
              middleName: "",
              gender: "Male",
              dateOfBirth: "",
              verificationDocUrl: "",
              preferredConcessionClass: "",
              preferredConcessionPeriod: "",
            });
          }

          return "Document removed successfully! You can now upload a new document.";
        } else {
          throw new Error(result.error.message);
        }
      },
      error: (error) => {
        console.error("Delete error:", error);
        return "Failed to remove document. Please try again or contact support.";
      },
      finally: () => {
        setIsDeleting(false);
      },
    });

    try {
      await deletePromise;
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const handlePreviewFile = () => {
    if (watchedUrl) {
      window.open(watchedUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="verificationDocUrl"
          render={() => (
            <FormItem>
              <FormLabel className="text-base space-y-1 mb-2">
                Verification Document
              </FormLabel>
              <FormControl>
                <div className="flex flex-col items-center justify-center w-full">
                  {!watchedUrl ? (
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg",
                        "flex flex-col items-center justify-center w-full h-48",
                        "bg-muted/50 hover:bg-muted/80 transition-colors duration-200 relative",
                        isUploading && "pointer-events-none opacity-50"
                      )}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                        {isUploading ? (
                          <>
                            <Loader2 className="h-10 w-10 mb-3 animate-spin text-primary" />
                            <p className="mb-2 text-base text-foreground font-semibold">
                              Uploading...
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Please wait while we upload your document
                            </p>
                          </>
                        ) : (
                          <>
                            <FileUp className="h-10 w-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-foreground font-semibold">
                              Click to upload PDF
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF (MAX. 2MB)
                            </p>
                          </>
                        )}
                      </div>
                      {!isUploading && (
                        <CldUploadButton
                          onError={handleUploadError}
                          onSuccess={handleUploadSuccess}
                          onUpload={() => setIsUploading(true)}
                          className="absolute inset-0 cursor-pointer opacity-0"
                          options={{
                            maxFiles: 1,
                            resourceType: "raw",
                            folder: "VESITRail",
                            maxFileSize: 2097152,
                            uploadPreset: "VESITRail",
                            clientAllowedFormats: ["pdf"],
                            publicId: `${session.data?.user.id}-${
                              defaultValues?.station || "default"
                            }.pdf`,
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="border-2 border-solid border-border rounded-lg bg-muted/50 p-4">
                        <div className="flex flex-wrap items-start gap-4">
                          <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileUp className="size-5" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-medium text-foreground break-words">
                              Document uploaded successfully
                            </p>
                            <p
                              className="text-xs text-muted-foreground break-all"
                              title={`${session.data?.user.id}-${
                                defaultValues?.station || "default"
                              }.pdf`}
                            >
                              {session.data?.user.id}-
                              {defaultValues?.station || "default"}.pdf
                            </p>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              type="button"
                              variant="outline"
                              className="size-8 p-0"
                              title="Preview document"
                              onClick={handlePreviewFile}
                            >
                              <Eye className="size-4" />
                              <span className="sr-only">Preview</span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="w-full border-2 border-dashed border-border rounded-lg bg-accent/10 p-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground break-words">
                              Want to upload a different document?
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Remove the current document to upload a new one
                            </p>
                          </div>

                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={handleRemoveFile}
                            className="flex-shrink-0 gap-2"
                            disabled={isDeleting || isUploading}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <Trash className="h-4 w-4" />
                                Remove
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </FormControl>

              {!watchedUrl && (
                <FormDescription className="text-xs text-center mt-2">
                  Upload a valid Aadhaar Card. Make sure both the front and back
                  sides are included.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default Document;
