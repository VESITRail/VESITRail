"use client";

import {
  getReviewData,
  submitOnboarding,
  type Review as ReviewType,
} from "@/actions/onboarding";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  User,
  Send,
  Edit3,
  MapPin,
  Loader2,
  XCircle,
  FileText,
  RefreshCw,
  ExternalLink,
  GraduationCap,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import type { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import Status from "@/components/ui/status";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCallback, useEffect, useState, useRef } from "react";
import { OnboardingSchema } from "@/lib/validations/onboarding";
import SlideButton, { type SlideButtonRef } from "@/components/ui/slide-button";

type ReviewProps = {
  defaultValues: z.infer<typeof OnboardingSchema>;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
};

const ReviewSkeleton = () => {
  const isMobile = useIsMobile();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {[1, 2, 3, 4].map((index) => (
        <Card key={index} className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="w-10 h-8 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((item) => (
                <div key={item} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end pt-6">
        <Skeleton
          className={
            isMobile ? "h-12 w-full rounded-lg" : "w-48 h-12 rounded-lg"
          }
        />
      </div>
    </div>
  );
};

const ErrorComponent = ({
  error,
  onRetry,
  isRetrying,
}: {
  error: string;
  onRetry: () => void;
  isRetrying: boolean;
}) => (
  <Status
    icon={XCircle}
    description={error}
    iconBg="bg-destructive"
    iconColor="text-white"
    containerClassName="bg-card"
    cardClassName="bg-background"
    title="Unable to Load Details"
    button={{
      onClick: onRetry,
      icon: isRetrying ? Loader2 : RefreshCw,
      label: isRetrying ? "Retrying..." : "Try Again",
    }}
  />
);

const Review = ({ defaultValues, setCurrentStep }: ReviewProps) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const session = authClient.useSession();
  const slideButtonRef = useRef<SlideButtonRef>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState<ReviewType | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  const loadReviewData = useCallback(
    async (isRetry = false) => {
      try {
        setError(null);
        if (isRetry) {
          setIsRetrying(true);
        } else {
          setIsLoading(true);
        }

        if (!session.data?.user?.id) {
          toast.error("Session Expired", {
            description: "Your session has expired. Please sign in again.",
          });
          router.push("/");
          return;
        }

        const result = await getReviewData({
          classId: defaultValues.class,
          stationId: defaultValues.station,
          preferredConcessionClassId: defaultValues.preferredConcessionClass,
          preferredConcessionPeriodId: defaultValues.preferredConcessionPeriod,
        });

        if (result.isSuccess) {
          setReviewData(result.data);
        } else {
          toast.error("Review Data Not Loading", {
            description:
              "Unable to load your review information. Please try again.",
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setError(errorMessage);

        if (!isRetry) {
          toast.error("Loading Failed", {
            description: "Unable to load the requested data. Please try again.",
          });
        }
      } finally {
        setIsLoading(false);
        setIsRetrying(false);
      }
    },
    [
      router,
      defaultValues.class,
      defaultValues.station,
      session.data?.user?.id,
      defaultValues.preferredConcessionClass,
      defaultValues.preferredConcessionPeriod,
    ]
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    if (isMobile) {
      slideButtonRef.current?.showSubmitting();
    }

    try {
      if (!session.data?.user?.id) {
        toast.error("Session Expired", {
          description: "Your session has expired. Please sign in again.",
        });
        router.push("/");
        return;
      }

      if (!reviewData) {
        toast.error("Review Data Missing", {
          description:
            "Review data is not available. Please try refreshing the page.",
        });
        setIsSubmitting(false);
        return;
      }

      const submissionPromise = submitOnboarding(session.data.user.id, {
        status: "Pending",
        submissionCount: 1,
        rejectionReason: null,
        class: reviewData.class,
        gender: defaultValues.gender,
        classId: defaultValues.class,
        address: defaultValues.address,
        lastName: defaultValues.lastName,
        stationId: defaultValues.station,
        firstName: defaultValues.firstName,
        middleName: defaultValues.middleName,
        dateOfBirth: new Date(defaultValues.dateOfBirth),
        verificationDocUrl: defaultValues.verificationDocUrl,
        preferredConcessionClassId: defaultValues.preferredConcessionClass,
        preferredConcessionPeriodId: defaultValues.preferredConcessionPeriod,
      });

      toast.promise(submissionPromise, {
        error: "Failed to submit application",
        loading: "Submitting your application...",
        success: "Application submitted successfully! Redirecting...",
      });

      const result = await submissionPromise;

      if (result.isSuccess) {
        router.push("/dashboard/student");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Submission Failed:", error.message);
      } else {
        console.error("Unknown Submission Error:", error);
      }

      toast.error("Submission Failed", {
        description: "Unable to submit your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setShowConfirmDialog(open);
    if (!open && isMobile) {
      slideButtonRef.current?.reset();
    }
  };

  useEffect(() => {
    if (session.data?.user?.id) {
      loadReviewData();
    }
  }, [session.data?.user?.id, loadReviewData]);

  if (isLoading || session.isPending) {
    return <ReviewSkeleton />;
  }

  if (error) {
    return (
      <ErrorComponent
        error={error}
        isRetrying={isRetrying}
        onRetry={() => loadReviewData(true)}
      />
    );
  }

  if (!reviewData) {
    return (
      <ErrorComponent
        isRetrying={isRetrying}
        error="No review data available"
        onRetry={() => loadReviewData(true)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <User className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2"
            >
              <Edit3 className="size-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Full Name
              </p>
              <p className="font-medium">
                {defaultValues.firstName} {defaultValues.middleName}{" "}
                {defaultValues.lastName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Date of Birth
              </p>
              <p className="font-medium">
                {format(new Date(defaultValues.dateOfBirth), "MMMM dd, yyyy")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Gender
              </p>
              <Badge variant="secondary">{defaultValues.gender}</Badge>
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p className="font-medium">{defaultValues.address}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Academic Information</CardTitle>
              <CardDescription>Your academic details</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2"
            >
              <Edit3 className="size-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Year</p>
              <Badge variant="outline">
                {reviewData.class.year.name} ({reviewData.class.year.code})
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Branch
              </p>
              <p className="font-medium">
                {reviewData.class.branch.name} ({reviewData.class.branch.code})
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Class</p>
              <Badge variant="outline">{reviewData.class.code}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <MapPin className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Travel Information</CardTitle>
              <CardDescription>Your travel preferences</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2"
            >
              <Edit3 className="size-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Home Station
              </p>
              <p className="font-medium">
                {reviewData.station.name} ({reviewData.station.code})
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Preferred Concession Class
              </p>
              <Badge variant="outline">
                {reviewData.concessionClass.name} (
                {reviewData.concessionClass.code})
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Preferred Concession Period
            </p>
            <Badge variant="outline">
              {reviewData.concessionPeriod.name} (
              {reviewData.concessionPeriod?.duration != null
                ? `${reviewData.concessionPeriod.duration} ${
                    reviewData.concessionPeriod.duration === 1
                      ? "month"
                      : "months"
                  }`
                : "N/A"}
              )
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <FileText className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Document Verification</CardTitle>
              <CardDescription>Your uploaded document</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-2"
            >
              <Edit3 className="size-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <p className="text-sm font-medium">Verification Document</p>
              <p className="text-xs text-muted-foreground">
                Click to view your uploaded document
              </p>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={defaultValues.verificationDocUrl}
              >
                <ExternalLink className="size-4" />
                <span className="hidden md:inline">View Document</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
        {isMobile ? (
          <SlideButton
            fullWidth
            ref={slideButtonRef}
            loadingText="Submitting..."
            text="Slide to submit application"
            onSlideComplete={() => {
              setShowConfirmDialog(true);
            }}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
          />
        ) : (
          <Button
            size="lg"
            disabled={isSubmitting}
            onClick={() => setShowConfirmDialog(true)}
            className="w-full sm:w-auto min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" />
                Submit Application
              </>
            )}
          </Button>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="size-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle>Final Submission</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you absolutely sure you want to submit?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10">
            <div className="text-sm text-destructive text-left">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li key="undo">This action cannot be undone</li>
                <li key="review">Please review all details one final time</li>
                <li key="edit">
                  You won&apos;t be able to edit your application after
                  submission.
                </li>
              </ul>
            </div>
          </div>

          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
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

export default Review;
