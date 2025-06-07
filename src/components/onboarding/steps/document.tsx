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
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Upload, Loader2, Eye } from "lucide-react";
import { DocumentSchema } from "@/lib/validations/onboarding";
import { OnboardingSchema } from "@/lib/validations/onboarding";

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
      <div className="flex flex-col items-center justify-center w-full h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-lg text-foreground">Loading...</p>
      </div>
    );
  }

  if (!session.data?.user) {
    router.push("/");
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
      form.setValue("verificationDocUrl", secure_url);

      onSubmit({ verificationDocUrl: secure_url });

      toast.success("Document uploaded successfully!", {
        description: "Your verification document has been uploaded.",
      });
    } catch (error) {
      toast.error("Upload processing failed", {
        description: "Failed to process the uploaded document.",
      });
    }
  };

  const handleUploadError = (error: any) => {
    setIsUploading(false);
    toast.error("Failed to upload document", {
      description: error.message || "Please try again with a valid PDF file.",
    });
  };

  const handleRemoveFile = async () => {
    if (!watchedUrl || !publicId) return;

    setIsDeleting(true);
    const deleteToastId = toast.loading("Removing document...", {
      description: "Please wait while we remove your document.",
    });

    try {
      const response = await fetch("/api/delete-file", {
        method: "POST",
        body: JSON.stringify({ publicId }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      setPublicId("");
      form.setValue("verificationDocUrl", "");
      if (defaultValues) {
        setFormData({
          ...defaultValues,
          verificationDocUrl: "",
        });
      } else {
        setFormData({
          verificationDocUrl: "",
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

      toast.dismiss(deleteToastId);
      toast.success("Document removed successfully!", {
        description: "You can now upload a new document.",
      });
    } catch (error) {
      toast.dismiss(deleteToastId);
      toast.error("Failed to remove document", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreviewFile = () => {
    if (watchedUrl) {
      window.open(watchedUrl, "_blank");
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
                            <Loader2 className="h-10 w-10 mb-3 animate-spin" />
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
                          className="absolute inset-0 cursor-pointer opacity-0"
                          options={{
                            maxFiles: 1,
                            resourceType: "raw",
                            folder: "VESITRail",
                            maxFileSize: 2097152,
                            uploadPreset: "VESITRail",
                            clientAllowedFormats: ["pdf"],
                            publicId: `${session.data?.user.id}-${defaultValues?.station}.pdf`,
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="border-2 border-solid border-border rounded-lg bg-muted/50 p-4">
                        <div className="flex flex-wrap items-start gap-4">
                          <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileUp className="h-5 w-5 text-accent-foreground" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-medium text-foreground break-words">
                              Document uploaded successfully
                            </p>
                            <p
                              className="text-xs text-muted-foreground break-all"
                              title={`${session.data?.user.id}-${defaultValues?.station}.pdf`}
                            >
                              {session.data?.user.id}-{defaultValues?.station}
                              .pdf
                            </p>
                          </div>

                          <Button
                            size="sm"
                            type="button"
                            variant="default"
                            onClick={handlePreviewFile}
                            className="flex-shrink-0 h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Preview</span>
                          </Button>
                        </div>
                      </div>

                      <div className="w-full border-2 border-dashed border-border rounded-lg bg-accent/10 p-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground break-words">
                              Want to upload a different document?
                            </p>
                          </div>

                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            disabled={isDeleting}
                            onClick={handleRemoveFile}
                            className="flex-shrink-0 h-8 w-8 p-0"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {isDeleting ? "Removing..." : "Replace File"}
                            </span>
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
