"use client";

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
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OnboardingSchema } from "@/lib/validations/onboarding";
import { getReviewData, submitOnboarding } from "@/actions/onboarding";

type ReviewProps = {
  defaultValues: z.infer<typeof OnboardingSchema>;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
};

type StudentDetails = {
  year: { id: string; name: string } | null;
  class: { id: string; code: string } | null;
  branch: { id: string; name: string } | null;
  station: { id: string; name: string } | null;
  concessionClass: { id: string; name: string } | null;
  concessionPeriod: { id: string; name: string } | null;
};

const Review = ({ defaultValues, setCurrentStep }: ReviewProps) => {
  const router = useRouter();
  const session = authClient.useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const result = await getReviewData({
        yearId: defaultValues.year,
        classId: defaultValues.class,
        branchId: defaultValues.branch,
        stationId: defaultValues.station,
        preferredConcessionClassId: defaultValues.preferredConcessionClass,
        preferredConcessionPeriodId: defaultValues.preferredConcessionPeriod,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setDetails(result.data);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load details";
      setError(errorMessage);
      toast.error("Loading Error", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [defaultValues]);

  if (isLoading || session.isPending) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-48 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" />

        <div className="space-y-2 flex flex-col justify-center items-center">
          <h3 className="text-base font-semibold">Loading your details...</h3>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your information
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-48 space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>

        <Button
          variant="outline"
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Try Again
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:p-6">
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5" />
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
              <Edit3 className="w-4 h-4" />
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
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 " />
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
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Year</p>
              <Badge variant="outline">{details?.year?.name}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Branch
              </p>
              <p className="font-medium">{details?.branch?.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Class</p>
              <Badge variant="secondary">{details?.class?.code}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 " />
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
              <Edit3 className="w-4 h-4" />
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
              <p className="font-medium">{details?.station?.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Preferred Concession Class
              </p>
              <Badge variant="outline">{details?.concessionClass?.name}</Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Preferred Concession Period
            </p>
            <Badge variant="outline">{details?.concessionPeriod?.name}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 " />
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
              <Edit3 className="w-4 h-4" />
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
                <ExternalLink className="w-4 h-4" />
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
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
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm font-medium">Important Notice:</p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li key="undo">• This action cannot be undone</li>
                <li key="review">• Please review all details one final time</li>
                <li key="edit">
                  • You won't be able to edit your application after submission
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
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
              onClick={async () => {
                setIsSubmitting(true);

                const submissionPromise = submitOnboarding(
                  session.data!!.user.id,
                  defaultValues
                ).then((result) => {
                  if (result.error) {
                    throw new Error(
                      typeof result.error === "string"
                        ? result.error
                        : JSON.stringify(result.error)
                    );
                  }
                  return result;
                });

                toast.promise(submissionPromise, {
                  loading: "Submitting your application...",
                  success: "Application submitted successfully! Redirecting...",
                  error: (error) =>
                    error.message || "Failed to submit application",
                });

                try {
                  await submissionPromise;
                  router.push("/dashboard/student");
                } catch (error) {
                } finally {
                  setIsSubmitting(false);
                  setShowConfirmDialog(false);
                }
              }}
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

export default Review;
