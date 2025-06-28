"use client";

import {
  Mail,
  Info,
  Send,
  Clock,
  Loader2,
  XCircle,
  History,
  FileText,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  MapPin,
  Upload,
  Eye,
  FileUp,
  Check,
  Trash2,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Status from "@/components/ui/status";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CldUploadButton } from "next-cloudinary";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  submitAddressChangeApplication,
  getStudentAddressAndStation,
  getLastAddressChangeApplication,
  type AddressChangeData,
} from "@/actions/change-address";
import { getStations } from "@/actions/utils";
import { deleteCloudinaryFile } from "@/actions/cloudinary"; // Assuming you have these actions

type AddressChangeStatusType = "Pending" | "Approved" | "Rejected";

interface AddressChange {
  id: string;
  newAddress: string;
  currentAddress: string;
  status: AddressChangeStatusType;
  verificationDocUrl: string;
  createdAt: Date;
  reviewedAt: Date | null;
  newStation: {
    id: string;
    code: string;
    name: string;
  };
  currentStation: {
    id: string;
    code: string;
    name: string;
  };
}

interface Student {
  address: string;
  station: {
    id: string;
    code: string;
    name: string;
  };
}

interface Station {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

const AddressChangeSchema = z.object({
  newStationId: z.string().min(1, "Please select a new station"),
  newAddress: z.string().min(5, "Address must be at least 5 characters"),
  verificationDocUrl: z.string().min(1, "Please upload verification document"),
});

type AddressChangeForm = z.infer<typeof AddressChangeSchema>;

const StatusBadge = ({ status }: { status: AddressChangeStatusType }) => {
  const variants: Record<AddressChangeStatusType, string> = {
    Rejected: "bg-red-600 text-white",
    Pending: "bg-amber-600 text-white",
    Approved: "bg-green-600 text-white",
  };

  return <Badge className={`${variants[status]} font-medium`}>{status}</Badge>;
};

const AddressChangePage = () => {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [canApply, setCanApply] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loadingStations, setLoadingStations] = useState<boolean>(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [publicId, setPublicId] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  const [student, setStudent] = useState<Student | null>(null);
  const [lastApplication, setLastApplication] = useState<AddressChange | null>(
    null
  );
  const [stations, setStations] = useState<Station[]>([]);

  const [status, setStatus] = useState<{
    title: string;
    iconBg: string;
    icon: LucideIcon;
    iconColor: string;
    description: string;
    iconClassName?: string;
    button?: {
      href: string;
      label: string;
      icon: LucideIcon;
      variant?: "default" | "outline" | "ghost";
    };
  } | null>(null);

  const form = useForm<AddressChangeForm>({
    resolver: zodResolver(AddressChangeSchema),
    defaultValues: {
      newStationId: "",
      newAddress: "",
      verificationDocUrl: "",
    },
  });

  const watchedUrl = form.watch("verificationDocUrl");

  useEffect(() => {
    if (watchedUrl) {
      const id = watchedUrl.split("/").pop()?.split(".")[0];
      if (id) {
        setPublicId(`VESITRail/${id}.pdf`);
      }
    }
  }, [watchedUrl]);

  const fetchStations = async () => {
    setLoadingStations(true);
    try {
      const result = await getStations();

      if (result.isSuccess) {
        setStations(result.data.filter((station: Station) => station.isActive));
      } else {
        toast.error("Failed to load stations");
      }
    } catch (error) {
      toast.error("Failed to load stations");
    } finally {
      setLoadingStations(false);
    }
  };

  const fetchStudentDetails = async () => {
    if (isPending || !data?.user?.id) return;

    try {
      const result = await getStudentAddressAndStation(data.user.id);

      if (result.isSuccess) {
        setStudent(result.data);
      } else {
        toast.error("Failed to load student details");
      }
    } catch (error) {
      toast.error("Failed to load student details");
    }
  };

  const checkLastAddressChange = async () => {
    if (isPending || !data?.user?.id) return;

    setLoading(true);

    try {
      const result = await getLastAddressChangeApplication(data.user.id);

      if (!result.isSuccess) {
        setCanApply(false);
        setStatus({
          icon: XCircle,
          iconColor: "text-white",
          iconBg: "bg-destructive",
          title: "Error Loading Application",
          description:
            "Unable to fetch your application status. Please try again later or contact support if the issue persists.",
          button: {
            icon: Mail,
            label: "Contact",
            href: "/#contact",
            variant: "default",
          },
        });
        return;
      }

      const application = result.data;
      setLastApplication(application);

      if (!application) {
        setStatus(null);
        setCanApply(true);
      } else {
        switch (application.status) {
          case "Rejected":
            setStatus(null);
            setCanApply(true);
            break;

          case "Pending":
            setCanApply(false);
            setStatus({
              icon: Clock,
              iconBg: "bg-yellow-600",
              iconColor: "text-white",
              title: "Address Change Under Review",
              description:
                "Your address change request is currently being reviewed. Please wait for approval before submitting a new request.",
            });
            break;

          case "Approved":
            setStatus(null);
            setCanApply(true);
            break;

          default:
            setStatus(null);
            setCanApply(true);
        }
      }
    } catch (error) {
      setCanApply(false);
      setStatus({
        icon: XCircle,
        iconColor: "text-white",
        iconBg: "bg-destructive",
        title: "Error Loading Application",
        description:
          "An unexpected error occurred while checking your application status. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    fetchStudentDetails();
    checkLastAddressChange();
  }, [data?.user?.id, isPending]);

  const availableStations = stations.filter(
    (station) => station.id !== student?.station.id
  );

  const handleUploadSuccess = (result: any) => {
    try {
      const { public_id, secure_url } = result.info;
      setPublicId(public_id);
      form.setValue("verificationDocUrl", secure_url);

      toast.success("Document uploaded successfully!", {
        description: "Your verification document has been uploaded.",
      });
    } catch (error) {
      toast.error("Upload processing failed", {
        description: "Failed to process the uploaded document.",
      });
    } finally {
      setIsUploading(false);
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
      const result = await deleteCloudinaryFile(publicId);

      if (result.isSuccess) {
        setPublicId("");
        form.setValue("verificationDocUrl", "");

        toast.dismiss(deleteToastId);
        toast.success("Document removed successfully!", {
          description: "You can now upload a new document.",
        });
      } else {
        throw new Error("Failed to delete file");
      }
    } catch (error: any) {
      toast.dismiss(deleteToastId);
      toast.error("Failed to remove document", {
        description: error.message || "Please try again or contact support.",
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

  const onSubmit = async (formData: AddressChangeForm) => {
    if (!student || !data?.user?.id) {
      toast.error("Missing required information");
      return;
    }

    setIsSubmitting(true);

    const submissionData: AddressChangeData = {
      studentId: data.user.id,
      newStationId: formData.newStationId,
      newAddress: formData.newAddress,
      currentStationId: student.station.id,
      currentAddress: student.address,
      verificationDocUrl: formData.verificationDocUrl,
    };

    try {
      const result = await submitAddressChangeApplication(submissionData);

      if (result.isSuccess) {
        toast.success(
          "Address change request submitted successfully! Redirecting..."
        );
        router.push("/dashboard/student");
      } else {
        throw new Error("Failed to submit request");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit address change request");
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  if (isPending || loading || loadingStations || !student) {
    return (
      <div className="container max-w-5xl mx-auto py-12 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-8 w-56" />
          </div>
          <Skeleton className="size-10 rounded-md" />
        </div>

        <Skeleton className="h-px w-full my-6" />

        <div className="mb-6 rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-4 w-full" />
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="py-4 p-6">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <Skeleton className="h-48 w-full rounded-md" />
              <div className="flex justify-end pt-4">
                <Skeleton className="h-11 w-40 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canApply && status) {
    return (
      <Status
        icon={status.icon}
        title={status.title}
        iconBg={status.iconBg}
        button={status.button}
        iconColor={status.iconColor}
        description={status.description}
        containerClassName="min-h-[88vh]"
        iconClassName={status.iconClassName}
      />
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-3">
          <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <MapPin className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold">Change Address</h1>
        </span>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="outline" className="size-10">
              <Info className="size-5" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            side="bottom"
            className="text-sm bg-background"
          >
            <p className="font-medium mb-4">Important Information</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Upload clear verification documents for address change</li>
              <li>Ensure new address details are accurate</li>
              <li>Changes require admin approval</li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <Separator className="my-6" />

      {lastApplication?.status === "Rejected" && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Previous Request Rejected</AlertTitle>
          <AlertDescription>
            Your previous address change request was rejected. You can submit a
            new request.
            {lastApplication && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 p-0 h-auto ml-2"
                  >
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Previous Request Details</DialogTitle>
                  </DialogHeader>
                  <Separator className="my-2" />
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Status
                        </p>
                        <StatusBadge status={lastApplication.status} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Submitted
                        </p>
                        <p className="font-medium text-foreground/90">
                          {format(
                            new Date(lastApplication.createdAt),
                            "MMMM dd, yyyy"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          From
                        </p>
                        <p className="font-medium text-foreground/90">
                          {lastApplication.currentStation.name} (
                          {lastApplication.currentStation.code})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lastApplication.currentAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          To
                        </p>
                        <p className="font-medium text-foreground/90">
                          {lastApplication.newStation.name} (
                          {lastApplication.newStation.code})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lastApplication.newAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </AlertDescription>
        </Alert>
      )}

      {lastApplication?.status === "Approved" && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Previous Request Approved</AlertTitle>
          <AlertDescription>
            Your previous address change was approved. You can submit a new
            request if needed.
            {lastApplication && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-green-600 hover:text-green-700 p-0 h-auto ml-2"
                  >
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Previous Request Details</DialogTitle>
                  </DialogHeader>
                  <Separator className="my-2" />
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Status
                        </p>
                        <StatusBadge status={lastApplication.status} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Approved
                        </p>
                        <p className="font-medium text-foreground/90">
                          {lastApplication.reviewedAt
                            ? format(
                                new Date(lastApplication.reviewedAt),
                                "MMMM dd, yyyy"
                              )
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          From
                        </p>
                        <p className="font-medium text-foreground/90">
                          {lastApplication.currentStation.name} (
                          {lastApplication.currentStation.code})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lastApplication.currentAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          To
                        </p>
                        <p className="font-medium text-foreground/90">
                          {lastApplication.newStation.name} (
                          {lastApplication.newStation.code})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lastApplication.newAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardContent className="py-4">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">
                      Current Station
                    </Label>
                    <div className="flex text-sm items-center justify-between h-10 px-3 bg-input/30 rounded-md border border-border">
                      {student.station.name} ({student.station.code})
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">
                      Current Address
                    </Label>
                    <div className="flex text-sm items-center justify-between h-10 px-3 bg-input/30 rounded-md border border-border">
                      <span className="truncate">{student.address}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="newStationId"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-sm font-medium">
                          New Station
                        </FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                role="combobox"
                                variant="outline"
                                aria-expanded={open}
                                disabled={loadingStations}
                                className={cn(
                                  "w-full justify-between h-10 px-3 py-2 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                  loadingStations &&
                                    "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <span className="truncate">
                                  {field.value
                                    ? (() => {
                                        const selectedStation =
                                          availableStations.find(
                                            (station) =>
                                              station.id === field.value
                                          );
                                        return selectedStation
                                          ? `${selectedStation.code} - ${selectedStation.name}`
                                          : "Select station...";
                                      })()
                                    : "Select station..."}
                                </span>
                                {loadingStations ? (
                                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                                ) : (
                                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="p-0 w-full min-w-[--radix-popover-trigger-width]"
                            align="start"
                          >
                            <Command>
                              <CommandInput
                                placeholder="Search by name or code"
                                className="h-9"
                              />
                              <CommandList>
                                <CommandEmpty>No station found.</CommandEmpty>
                                <CommandGroup>
                                  {availableStations.map((station) => (
                                    <CommandItem
                                      key={station.id}
                                      value={`${station.code} ${station.name}`}
                                      onSelect={() => {
                                        form.setValue(
                                          "newStationId",
                                          station.id
                                        );
                                        setOpen(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 flex-shrink-0",
                                          field.value === station.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <span className="truncate">
                                        {`${station.code} - ${station.name}`}
                                      </span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newAddress"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-sm font-medium">
                          New Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your new address"
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                                "bg-muted/50 transition-colors duration-200 relative",
                                !form.getValues("newStationId")
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-muted/80",
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
                                ) : !form.getValues("newStationId") ? (
                                  <>
                                    <FileUp className="h-10 w-10 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-foreground font-semibold">
                                      Select new station first
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Please select a new station before
                                      uploading document
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
                              {!isUploading &&
                                form.getValues("newStationId") && (
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
                                      publicId: `${
                                        data?.user.id
                                      }-${form.getValues("newStationId")}.pdf`,
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
                                      Address Change Verification Document
                                    </p>
                                    <p className="text-xs text-muted-foreground break-all">
                                      {data?.user.id}-
                                      {form.getValues("newStationId")}.pdf
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
                                      Remove the current document to upload a
                                      new one
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
                                        <Trash2 className="h-4 w-4" />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={
                      isSubmitting ||
                      !form.formState.isValid ||
                      !form.getValues("verificationDocUrl")
                    }
                    className="min-w-32"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Address Change Request</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Please review your address change details before submitting.
                  Once submitted, you cannot modify this request.
                </p>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Current Station
                      </p>
                      <p className="font-medium">
                        {student?.station.name} ({student?.station.code})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        New Station
                      </p>
                      <p className="font-medium">
                        {(() => {
                          const selectedStation = stations.find(
                            (station) =>
                              station.id === form.getValues("newStationId")
                          );
                          return selectedStation
                            ? `${selectedStation.name} (${selectedStation.code})`
                            : "N/A";
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        New Address
                      </p>
                      <p className="font-medium">
                        {form.getValues("newAddress")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-destructive">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>This request will be reviewed by administrators</li>
                      <li>You will be notified once a decision is made</li>
                      <li>
                        Ensure all information is accurate before submitting
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => form.handleSubmit(onSubmit)()}
              disabled={isSubmitting}
              className="min-w-32 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddressChangePage;
