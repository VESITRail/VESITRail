"use client";

import {
  type Review,
  getReviewData,
  submitOnboarding,
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
  AlertCircle,
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
import { useEffect, useState } from "react";
import Status from "@/components/ui/status";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { OnboardingSchema } from "@/lib/validations/onboarding";

type ReviewProps = {
  defaultValues: z.infer<typeof OnboardingSchema>;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
};

const ReviewSkeleton = () => (
  <div className="max-w-5xl mx-auto space-y-6 md:p-6">
    {[1, 2, 3, 4].map((index) => (
      <Card key={index} className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="w-16 h-8 rounded-md" />
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
      <Skeleton className="w-48 h-12 rounded-lg" />
    </div>
  </div>
);

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
  const session = authClient.useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState<Review | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  const loadReviewData = async (isRetry = false) => {
    try {
      setError(null);
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setIsLoading(true);
      }

      if (!session.data?.user?.id) {
        toast.error("User session not found");
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
        toast.error("Failed to load review data");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);

      if (!isRetry) {
        toast.error("Loading Error", {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (!session.data?.user?.id) {
        toast.error("User session not found");
        router.push("/");
        return;
      }

      const submissionPromise = submitOnboarding(session.data.user.id, {
        status: "Pending",
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
      const errorMessage =
        error instanceof Error ? error.message : "Submission failed";
      toast.error("Submission Error", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  useEffect(() => {
    if (session.data?.user?.id) {
      loadReviewData();
    }
  }, [session.data?.user?.id, defaultValues]);

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
    <div className="max-w-5xl mx-auto space-y-6 md:p-6">
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
                View Document
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
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
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-sm mx-auto">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
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
                <AlertCircle className="size-4 text-destructive" />
                <p className="text-sm font-medium">Important Notice:</p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• This action cannot be undone</li>
                <li>• Please review all details one final time</li>
                <li>
                  • You won't be able to edit your application after submission
                </li>
              </ul>
            </div>
          </div>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
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
