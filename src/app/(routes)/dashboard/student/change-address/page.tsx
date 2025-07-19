"use client";

import {
  Eye,
  Mail,
  Info,
  Send,
  Check,
  Clock,
  FileUp,
  Trash2,
  MapPin,
  Loader2,
  XCircle,
  CheckCircle,
  AlertTriangle,
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
  FormDescription,
} from "@/components/ui/form";
import {
  Station,
  AddressChange,
  AddressChangeStatusType,
} from "@/generated/zod";
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
  CommandList,
  CommandItem,
  CommandInput,
  CommandGroup,
  CommandEmpty,
} from "@/components/ui/command";
import {
  type AddressChangeData,
  StudentAddressAndStation,
  getStudentAddressAndStation,
  submitAddressChangeApplication,
  getLastAddressChangeApplication,
} from "@/actions/change-address";
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
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Status from "@/components/ui/status";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getStations } from "@/actions/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { CldUploadButton } from "next-cloudinary";
import { capitalizeWords, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { deleteCloudinaryFile } from "@/actions/cloudinary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AddressChangeSchema = z.object({
  verificationDocUrl: z.string().url(),
  newStationId: z.string().min(1, "Please select a new station"),
  newAddress: z
    .string()
    .min(1, "Address is required")
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address cannot exceed 500 characters")
    .transform((val) => val.trim())
    .refine(
      (val) => val.length >= 10,
      "Address must be at least 10 characters after trimming"
    ),
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
  const [open, setOpen] = useState<boolean>(false);
  const { data, isPending } = authClient.useSession();
  const [publicId, setPublicId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [canApply, setCanApply] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loadingStations, setLoadingStations] = useState<boolean>(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  const [stations, setStations] = useState<Station[]>([]);
  const [student, setStudent] = useState<StudentAddressAndStation | null>(null);
  const [lastApplication, setLastApplication] = useState<
    | (AddressChange & {
        newStation: Station;
        currentStation: Station;
      })
    | null
  >(null);

  const [status, setStatus] = useState<{
    title: string;
    iconBg?: string;
    icon: LucideIcon;
    iconColor?: string;
    description: string;
    cardClassName?: string;
    iconClassName?: string;
    containerClassName?: string;
    button?: {
      href?: string;
      label: string;
      icon: LucideIcon;
      onClick?: () => void;
    };
  } | null>(null);

  const form = useForm<AddressChangeForm>({
    resolver: zodResolver(AddressChangeSchema),
    defaultValues: {
      newAddress: "",
      newStationId: "",
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
        toast.error("Stations Not Loading", {
          description: "Unable to load station data. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Stations Not Loading", {
        description: "Unable to load station data. Please try again.",
      });
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
        toast.error("Details Not Loading", {
          description: "Unable to load your student details. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Details Not Loading", {
        description: "Unable to load your student details. Please try again.",
      });
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
          },
        });
        return;
      }

      const application = result.data as AddressChange & {
        newStation: Station;
        currentStation: Station;
      };
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

      form.setValue("verificationDocUrl", secure_url, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

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
      description: "Please try again with a valid PDF file.",
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

        form.setValue("verificationDocUrl", "", {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });

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
        description: "Please try again or contact support.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCapitalFirstChange = (
    value: string,
    onChange: (value: string) => void
  ) => {
    const capitalizedValue = capitalizeWords(value);
    onChange(capitalizedValue);
  };

  const handlePreviewFile = () => {
    if (watchedUrl) {
      window.open(watchedUrl, "_blank");
    }
  };

  const onSubmit = async (formData: AddressChangeForm) => {
    if (!student || !data?.user?.id) {
      toast.error("Information Required", {
        description: "Please fill in all required fields to continue.",
      });
      return;
    }

    setIsSubmitting(true);

    const submissionData: AddressChangeData = {
      studentId: data.user.id,
      newAddress: formData.newAddress,
      currentAddress: student.address,
      newStationId: formData.newStationId,
      currentStationId: student.station.id,
      verificationDocUrl: formData.verificationDocUrl,
    };

    const submitPromise = submitAddressChangeApplication(submissionData);

    toast.promise(submitPromise, {
      loading: "Submitting address change request...",
      error: "Failed to submit address change request",
      success: "Address change request submitted successfully!",
    });

    try {
      const result = await submitPromise;

      if (result.isSuccess) {
        setCanApply(false);
        setStatus({
          icon: Clock,
          iconBg: "bg-yellow-600",
          iconColor: "text-white",
          title: "Address Change Under Review",
          description:
            "Your address change request is currently being reviewed. Please wait for approval before submitting a new request.",
        });
      } else {
        setStatus({
          icon: XCircle,
          iconColor: "text-white",
          iconBg: "bg-destructive",
          title: "Submission Failed",
          description:
            "We couldn't process your address change request at the moment. Please try again or contact support if the issue persists.",
          button: {
            icon: Mail,
            href: "/#contact",
            label: "Contact Support",
          },
        });
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  if (isPending || loading || loadingStations || !student) {
    return (
      <div className="container max-w-5xl mx-auto py-12 px-4">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-8 w-48" />
          </span>
          <Skeleton className="size-10 rounded-lg" />
        </div>

        <Separator className="my-6" />

        <Skeleton className="h-20 w-full mb-6 rounded-lg" />

        <Card>
          <CardContent className="py-4">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-48 w-full rounded-lg" />
              </div>

              <div className="flex justify-end pt-4">
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
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
      <div className="flex w-full gap-4 justify-between items-start">
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
              <li>
                Upload a clear document showing both front and back of your
                Aadhar card
              </li>
              <li>Ensure new address details are accurate</li>
              <li>Changes require admin approval</li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <Separator className="my-6" />

      {lastApplication?.status === "Rejected" && (
        <Alert variant="destructive" className="mb-6 flex flex-col gap-1">
          <div className="flex w-full justify-between items-start">
            <div className="flex items-start gap-2">
              <XCircle className="size-4 mt-0.5 text-destructive" />

              <div>
                <AlertTitle>Previous Request Rejected</AlertTitle>
                <AlertDescription>
                  Your previous address change request was rejected. You can
                  submit a new request.
                </AlertDescription>
              </div>
            </div>

            {lastApplication && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-foreground border-muted-foreground/20 hover:border-muted-foreground/40"
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
                          Applied Date
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
          </div>
        </Alert>
      )}

      {lastApplication?.status === "Approved" && (
        <Alert className="mb-6 flex flex-col gap-1">
          <div className="flex w-full flex-col gap-4 md:flex-row justify-between items-start">
            <div className="flex items-start gap-2">
              <CheckCircle className="size-4 mt-0.5 text-green-600" />

              <div>
                <AlertTitle>Previous Request Approved</AlertTitle>
                <AlertDescription>
                  Your previous address change was approved. You can submit a
                  new request if needed.
                </AlertDescription>
              </div>
            </div>

            {lastApplication && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-foreground border-muted-foreground/20 hover:border-muted-foreground/40"
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
                          Applied Date
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
          </div>
        </Alert>
      )}

      <Form {...form}>
        <form
          className="space-y-8"
          onSubmit={form.handleSubmit((data) => {
            setShowConfirmDialog(true);
          })}
        >
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
                    name="newStationId"
                    control={form.control}
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
                                          ? `${selectedStation.name} (${selectedStation.code})`
                                          : "Select station...";
                                      })()
                                    : "Select station..."}
                                </span>
                                {loadingStations ? (
                                  <Loader2 className="size-4 animate-spin flex-shrink-0" />
                                ) : (
                                  <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="p-0 w-full min-w-[--radix-popover-trigger-width]"
                          >
                            <Command>
                              <CommandInput
                                className="h-9"
                                placeholder="Search by name or code"
                              />
                              <CommandList>
                                <CommandEmpty>No station found.</CommandEmpty>
                                <CommandGroup>
                                  {availableStations.map((station) => (
                                    <CommandItem
                                      key={station.id}
                                      value={`${station.name} (${station.code})`}
                                      onSelect={() => {
                                        form.setValue(
                                          "newStationId",
                                          station.id,
                                          {
                                            shouldDirty: true,
                                            shouldTouch: true,
                                            shouldValidate: true,
                                          }
                                        );

                                        setOpen(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 size-4 flex-shrink-0",
                                          field.value === station.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <span className="truncate">
                                        {`${station.name} (${station.code})`}
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
                            {...field}
                            className="h-10"
                            autoComplete="off"
                            placeholder="Enter your new address"
                            onChange={(e) =>
                              handleCapitalFirstChange(
                                e.target.value,
                                field.onChange
                              )
                            }
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
                      </FormControl>

                      {!watchedUrl && (
                        <FormDescription className="text-xs text-center mt-2">
                          Upload a valid Aadhaar Card. Make sure both the front
                          and back sides are included.
                        </FormDescription>
                      )}

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    className="min-w-32"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="size-4 mr-2" />
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

                <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Current Station
                      </p>
                      <p className="font-medium">
                        {student?.station.name} ({student?.station.code})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
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
                      <p className="text-sm font-medium text-foreground">
                        New Address
                      </p>
                      <p className="font-medium">
                        {form.getValues("newAddress")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10">
                  <AlertTriangle className="size-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-destructive text-left">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>This request will be reviewed by admins</li>
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
              disabled={isSubmitting}
              className="min-w-32 cursor-pointer"
              onClick={() => {
                const formData = form.getValues();
                onSubmit(formData);
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
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
