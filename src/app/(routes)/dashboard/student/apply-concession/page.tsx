"use client";

import {
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
  type LucideIcon,
} from "lucide-react";
import {
  StudentStation,
  getStudentStation,
  StudentPreferences,
  getConcessionPeriods,
  getConcessionClasses,
  getStudentPreferences,
} from "@/actions/utils";
import {
  Concession,
  getLastApplication,
  submitConcessionApplication,
} from "@/actions/concession";
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
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Status from "@/components/ui/status";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { calculateConcessionValidity } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ConcessionClass,
  ConcessionPeriod,
  ConcessionApplicationStatusType,
} from "@/generated/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { ConcessionApplicationType } from "@/generated/prisma";

const ApplicationTypeBadge = ({
  type,
}: {
  type: ConcessionApplicationType;
}) => {
  return <Badge variant="secondary">{type}</Badge>;
};

const StatusBadge = ({
  status,
}: {
  status: ConcessionApplicationStatusType;
}) => {
  const variants: Record<ConcessionApplicationStatusType, string> = {
    Rejected: "bg-red-600 text-white",
    Pending: "bg-amber-600 text-white",
    Approved: "bg-green-600 text-white",
  };

  return <Badge className={`${variants[status]} font-medium`}>{status}</Badge>;
};

const ConcessionApplicationForm = () => {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [canApply, setCanApply] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  const [student, setStudent] = useState<
    | (StudentPreferences & {
        station: StudentStation;
      })
    | null
  >(null);
  const [lastApplication, setLastApplication] = useState<Concession | null>(
    null
  );

  const [selectedConcessionClass, setSelectedConcessionClass] =
    useState<string>("");
  const [selectedConcessionPeriod, setSelectedConcessionPeriod] =
    useState<string>("");

  const [concessionClasses, setConcessionClasses] = useState<ConcessionClass[]>(
    []
  );
  const [concessionPeriods, setConcessionPeriods] = useState<
    ConcessionPeriod[]
  >([]);

  const [selectedApplicationType, setSelectedApplicationType] =
    useState<ConcessionApplicationType>("New");

  const [status, setStatus] = useState<{
    title: string;
    iconBg?: string;
    icon: LucideIcon;
    iconColor?: string;
    description: string;
    iconClassName?: string;
    containerClassName?: string;
    button?: {
      href?: string;
      label: string;
      icon: LucideIcon;
      onClick?: () => void;
    };
  } | null>(null);

  useEffect(() => {
    if (lastApplication) {
      setSelectedApplicationType("Renewal");
    }
  }, [lastApplication]);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);

      try {
        const [classesResult, periodsResult] = await Promise.all([
          getConcessionClasses(),
          getConcessionPeriods(),
        ]);

        if (classesResult.error) {
          toast.error("Classes Not Loading", {
            description:
              "Unable to load your concession classes. Please try again.",
          });
        } else if (classesResult.data) {
          setConcessionClasses(classesResult.data);
        }

        if (periodsResult.error) {
          toast.error("Periods Not Loading", {
            description:
              "Unable to load your concession periods. Please try again.",
          });
        } else if (periodsResult.data) {
          setConcessionPeriods(periodsResult.data);
        }
      } catch (error) {
        console.error("Error while loading form options:", error);
        toast.error("Options Not Loading", {
          description: "Unable to load form options. Please try again.",
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (isPending || !data?.user?.id) return;

      try {
        const [prefResult, stationResult] = await Promise.all([
          getStudentPreferences(data.user.id),
          getStudentStation(data.user.id),
        ]);

        if (prefResult.error || stationResult.error) {
          toast.error("Details Not Loading", {
            description: "Unable to load student details. Please try again.",
          });
          return;
        }

        if (prefResult.data && stationResult.data) {
          setStudent({
            station: stationResult.data,
            ...prefResult.data,
          });
        }
      } catch (error) {
        console.error("Error while loading student details:", error);
        toast.error("Details Not Loading", {
          description: "Unable to load your student details. Please try again.",
        });
      }
    };

    fetchStudentDetails();
  }, [data?.user?.id, isPending]);

  useEffect(() => {
    if (student) {
      setSelectedConcessionClass(student.preferredConcessionClass.id);
      setSelectedConcessionPeriod(student.preferredConcessionPeriod.id);
    }
  }, [student]);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (isPending || !data?.user?.id) {
        return;
      }

      setLoading(true);

      try {
        const result = await getLastApplication(data.user.id);

        if (result.error) {
          setCanApply(false);
          setStatus({
            icon: XCircle,
            iconColor: "text-white",
            iconBg: "bg-destructive",
            title: "Failed to Load Previous Application",
            description:
              "We couldn't retrieve your previous application details. This might be due to a network issue or server error. Please try again shortly.",
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
                iconBg: "bg-amber-500",
                iconColor: "text-white",
                title: "Application Under Review",
                description:
                  "Your concession application is currently being reviewed. Please wait for approval before applying again.",
              });
              break;

            case "Approved":
              if (application.reviewedAt) {
                const validity = calculateConcessionValidity(
                  new Date(application.reviewedAt),
                  application.concessionPeriod.duration
                );

                if (validity.isValid) {
                  setCanApply(false);
                  setStatus({
                    icon: CheckCircle,
                    iconBg: "bg-green-600",
                    iconColor: "text-white",
                    title: "Active Concession",
                    description: `Your concession is currently active and valid until ${format(
                      new Date(validity.expiryDate),
                      "MMMM dd, yyyy"
                    )}. You have ${validity.daysRemaining} day${
                      validity.daysRemaining !== 1 ? "s" : ""
                    } remaining.`,
                  });
                } else {
                  setStatus(null);
                  setCanApply(true);
                }
              } else {
                console.error(
                  "Approved application missing reviewedAt:",
                  application.id
                );

                setCanApply(false);
                setStatus({
                  icon: AlertTriangle,
                  iconBg: "bg-amber-600",
                  iconColor: "text-white",
                  title: "Data Verification Required",
                  description:
                    "Your approved application needs verification. Please contact support before applying for a new concession.",
                });
              }
              break;

            default:
              setStatus(null);
              setCanApply(true);
          }
        }
      } catch (error) {
        console.error("Error while checking application status:", error);

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

    checkApplicationStatus();
  }, [data?.user?.id, isPending]);

  const selectedClassExists = concessionClasses.some(
    (c) => c.id === selectedConcessionClass
  );

  const selectedPeriodExists = concessionPeriods.some(
    (p) => p.id === selectedConcessionPeriod
  );

  const handleSubmit = async () => {
    if (
      !student ||
      !data?.user?.id ||
      !selectedConcessionClass ||
      !selectedConcessionPeriod
    ) {
      toast.error("Selection Required", {
        description:
          "Please select both a concession class and period to continue.",
      });
      return;
    }

    setIsSubmitting(true);

    const applicationData = {
      studentId: data.user.id,
      stationId: student.station.id,
      applicationType: selectedApplicationType,
      concessionClassId: selectedConcessionClass,
      concessionPeriodId: selectedConcessionPeriod,
      previousApplicationId:
        selectedApplicationType === "Renewal"
          ? lastApplication?.id || null
          : null,
    };

    const submissionPromise = submitConcessionApplication(applicationData);

    toast.promise(submissionPromise, {
      loading: "Submitting your application...",
      success: "Application submitted successfully! Redirecting...",
      error: (error) => error.message || "Failed to submit application",
    });

    try {
      const result = await submissionPromise;

      if (result.isSuccess) {
        router.push("/dashboard/student");
      } else {
        toast.error("Submission Failed", {
          description: "Unable to submit your application. Please try again.",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const isFormValid = selectedConcessionClass && selectedConcessionPeriod;

  if (isPending || loading || loadingOptions || !student) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
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
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex items-center justify-between h-10 px-3 rounded-md border">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                  </div>
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-28" />
                  <div className="flex items-center justify-between h-10 px-3 rounded-md border">
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>

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
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-3">
          <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <FileText className="size-5" />
          </div>

          <h1 className="text-2xl font-semibold">Apply for concession</h1>
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
            <p className="font-medium mb-4">Heads up!</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                These details are autofilled based on the information you
                provided during onboarding.
              </li>
              <li>
                You can review and change them before submitting your
                application.
              </li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <Separator className="my-6" />

      {lastApplication?.status === "Rejected" && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Previous Application Rejected</AlertTitle>
          <AlertDescription>You can submit a new application.</AlertDescription>
        </Alert>
      )}

      {!lastApplication && (
        <Alert className="mb-6">
          <Info className="size-4" />
          <AlertTitle>First Time Application</AlertTitle>
          <AlertDescription>
            This is your first time applying for a concession. Please make sure
            all required details are accurate to avoid delays in processing your
            application.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="py-4">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label
                  htmlFor="application-type"
                  className="text-sm font-medium"
                >
                  Application Type
                </Label>

                {!lastApplication ? (
                  <div className="flex items-center text-sm justify-between h-10 px-3 bg-input/30 rounded-md border border-border">
                    New
                  </div>
                ) : (
                  <div className="relative">
                    <Select
                      value={selectedApplicationType}
                      onValueChange={(value: ConcessionApplicationType) =>
                        setSelectedApplicationType(value)
                      }
                    >
                      <SelectTrigger className="w-full !h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Renewal">Renewal</SelectItem>
                        <SelectItem value="New">New</SelectItem>
                      </SelectContent>
                    </Select>

                    {selectedApplicationType === "Renewal" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="View previous application details"
                            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors h-8 px-2"
                          >
                            <History className="size-4" />
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>
                              Previous Application Details
                            </DialogTitle>
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
                                  Type
                                </p>
                                <ApplicationTypeBadge
                                  type={lastApplication.applicationType}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Class
                                </p>
                                <p className="font-medium text-foreground/90">
                                  {lastApplication.concessionClass.name} (
                                  {lastApplication.concessionClass.code})
                                </p>
                              </div>

                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Period
                                </p>
                                <p className="font-medium text-foreground/90">
                                  {lastApplication.concessionPeriod.name} (
                                  {lastApplication.concessionPeriod.duration}{" "}
                                  {lastApplication.concessionPeriod.duration ===
                                  1
                                    ? "month"
                                    : "months"}
                                  )
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Home Station
                                </p>
                                <p className="font-medium text-foreground/90">
                                  {lastApplication.station.name} (
                                  {lastApplication.station.code})
                                </p>
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
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label htmlFor="home-station" className="text-sm font-medium">
                  Home Station
                </Label>

                <div className="flex text-sm items-center justify-between h-10 px-3 bg-input/30 rounded-md border border-border">
                  {student.station.name} ({student.station.code})
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label
                  htmlFor="concession-class"
                  className="text-sm font-medium"
                >
                  Concession Class
                </Label>

                <Select
                  onValueChange={setSelectedConcessionClass}
                  value={
                    selectedClassExists ? selectedConcessionClass : undefined
                  }
                >
                  <SelectTrigger className="w-full !h-10">
                    <SelectValue placeholder="Select concession class" />
                  </SelectTrigger>

                  <SelectContent>
                    {concessionClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label
                  htmlFor="concession-period"
                  className="text-sm font-medium"
                >
                  Concession Period
                </Label>

                <Select
                  onValueChange={setSelectedConcessionPeriod}
                  value={
                    selectedPeriodExists ? selectedConcessionPeriod : undefined
                  }
                >
                  <SelectTrigger className="w-full !h-10">
                    <SelectValue placeholder="Select concession period" />
                  </SelectTrigger>

                  <SelectContent>
                    {concessionPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name} ({period.duration}{" "}
                        {period.duration === 1 ? "month" : "months"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                onClick={() => {
                  setShowConfirmDialog(true);
                }}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1 size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-1 size-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-sm mx-auto">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle>Final Submission</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you absolutely sure you want to submit?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm font-medium">Important Notice:</p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li key="undo">• This action cannot be undone</li>
                <li key="review">• Please review all details one final time</li>
                <li key="edit">
                  • You won&apos;t be able to edit your application after
                  submission.
                </li>
              </ul>
            </div>
          </div>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Yes, Submit Now
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConcessionApplicationForm;
