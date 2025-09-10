"use client";

import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  Review,
  Document,
  TravelInfo,
  PersonalInfo,
  AcademicInfo,
} from "./steps";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { z } from "zod";
import { toast } from "sonner";
import { isFailure } from "@/lib/result";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn, formatFieldName } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getExistingStudentData } from "@/actions/onboarding";
import { OnboardingSchema } from "@/lib/validations/onboarding";

const MultiStepForm = () => {
  const totalSteps = 5;
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { data: session, isPending } = authClient.useSession();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [rejectionInfo, setRejectionInfo] = useState<{
    reason?: string;
    submissionCount?: number;
  } | null>(null);

  const [formData, setFormData] = useState<z.infer<typeof OnboardingSchema>>({
    year: "",
    class: "",
    branch: "",
    address: "",
    station: "",
    lastName: "",
    firstName: "",
    middleName: "",
    gender: "Male",
    dateOfBirth: "",
    verificationDocUrl: "",
    preferredConcessionClass: "",
    preferredConcessionPeriod: "",
  });

  const activeStepRef = useRef<HTMLDivElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadExistingData = async () => {
      if (isPending || !session?.user?.id) return;

      try {
        const result = await getExistingStudentData(session.user.id);

        if (isFailure(result)) {
          console.error("Failed to load existing data:", result.error);
          setIsLoading(false);
          return;
        }

        if (result.data) {
          const formatDateForInput = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          };

          setFormData({
            class: result.data.classId,
            gender: result.data.gender,
            address: result.data.address,
            station: result.data.stationId,
            lastName: result.data.lastName,
            year: result.data.class.year.id,
            firstName: result.data.firstName,
            middleName: result.data.middleName,
            branch: result.data.class.branch.id,
            verificationDocUrl: result.data.verificationDocUrl,
            dateOfBirth: formatDateForInput(result.data.dateOfBirth),
            preferredConcessionClass: result.data.preferredConcessionClassId,
            preferredConcessionPeriod: result.data.preferredConcessionPeriodId,
          });

          if (result.data.status === "Rejected") {
            setRejectionInfo({
              reason: result.data.rejectionReason || undefined,
              submissionCount: result.data.submissionCount || undefined,
            });
          }
        }
      } catch (error) {
        console.error("Error loading existing data:", error);
        toast.error("Loading Error", {
          description: "Failed to load your previous application data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [session?.user?.id, isPending]);

  useEffect(() => {
    if (stepsContainerRef.current && activeStepRef.current) {
      const container = stepsContainerRef.current;
      const activeStep = activeStepRef.current;

      const scrollLeft =
        activeStep.offsetLeft -
        container.clientWidth / 2 +
        activeStep.clientWidth / 2;

      container.scrollTo({
        behavior: "smooth",
        left: Math.max(0, scrollLeft),
      });
    }
  }, [currentStep]);

  const validateStep = (step: number) => {
    try {
      switch (step) {
        case 1:
          OnboardingSchema.pick({
            gender: true,
            address: true,
            lastName: true,
            firstName: true,
            middleName: true,
            dateOfBirth: true,
          }).parse(formData);
          break;
        case 2:
          OnboardingSchema.pick({
            year: true,
            class: true,
            branch: true,
          }).parse(formData);
          break;
        case 3:
          OnboardingSchema.pick({
            station: true,
            preferredConcessionClass: true,
            preferredConcessionPeriod: true,
          }).parse(formData);
          break;
        case 4:
          OnboardingSchema.pick({
            verificationDocUrl: true,
          }).parse(formData);
          break;
      }

      setErrors({});

      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};

        error.errors.forEach((err) => {
          const field = err.path?.[0];

          if (!field || typeof field !== "string") return;

          let message = err.message;
          const formatted = formatFieldName(field);

          if (err.code === "invalid_type") {
            message = `${formatted} is required`;
          } else if (err.code === "invalid_string") {
            message = `Please enter a valid ${formatted}`;
          }

          newErrors[field] = message;
        });

        setErrors(newErrors);

        let stepName = "";

        switch (step) {
          case 1:
            stepName = "Personal Details";
            break;
          case 2:
            stepName = "Academic Details";
            break;
          case 3:
            stepName = "Travel Details";
            break;
          case 4:
            stepName = "Document Upload";
            break;
        }

        toast.error("Required Fields Missing", {
          description: `Please complete all required fields in ${stepName}.`,
        });
      }

      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfo
            errors={errors}
            defaultValues={formData}
            setFormData={setFormData}
          />
        );
      case 2:
        return (
          <AcademicInfo
            errors={errors}
            defaultValues={formData}
            setFormData={setFormData}
          />
        );
      case 3:
        return (
          <TravelInfo
            errors={errors}
            defaultValues={formData}
            setFormData={setFormData}
          />
        );
      case 4:
        return (
          <Document
            errors={errors}
            defaultValues={formData}
            setFormData={setFormData}
          />
        );
      case 5:
        return (
          <Review defaultValues={formData} setCurrentStep={setCurrentStep} />
        );
      default:
        router.push("/");
        toast.error("Something Went Wrong", {
          description: "An unexpected issue occurred. Please try again.",
        });
        return null;
    }
  };

  const steps = [
    { id: 1, title: "Personal Details" },
    { id: 2, title: "Academic Details" },
    { id: 3, title: "Travel Details" },
    { id: 4, title: "Document Upload" },
    { id: 5, title: "Review & Submit" },
  ];

  const OnboardingFormSkeleton = () => (
    <Card className="w-full max-w-5xl mx-auto py-12 md:px-4">
      <CardHeader className="space-y-6">
        <div className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Onboarding
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Loading your application data...
          </CardDescription>
        </div>

        <div className="relative flex flex-nowrap overflow-x-auto justify-between items-center pt-4 px-4 md:px-0 md:justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex flex-col items-center shrink-0 z-10 px-2 md:px-4 min-w-fit relative"
            >
              {index < steps.length - 1 && (
                <div className="absolute h-0.5 w-full left-1/2 top-5 -translate-y-1/2 bg-border" />
              )}
              <Skeleton className="size-10 animate-none z-10 rounded-full" />
              <div className="mt-3 text-center">
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="mt-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-1 h-[78px]">
                <div className="block">
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="h-5" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {[1, 2].map((item) => (
              <div key={item} className="space-y-1 h-[78px]">
                <div className="block">
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="h-5" />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <div className="block">
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8 gap-4">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-16 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading || isPending) {
    return <OnboardingFormSkeleton />;
  }

  return (
    <Card className="w-full max-w-5xl mx-auto py-12 md:px-4">
      <CardHeader className="space-y-6">
        <div className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Onboarding
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Complete your profile to get started
          </CardDescription>
        </div>

        <div
          ref={stepsContainerRef}
          className="relative flex flex-nowrap overflow-x-auto justify-between items-center pt-4 px-4 md:px-0 md:justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {steps.map((step, index) => (
            <div
              key={step.id}
              ref={currentStep === step.id ? activeStepRef : null}
              className="flex flex-col items-center shrink-0 z-10 px-2 md:px-4 min-w-fit relative"
            >
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute h-0.5 w-full left-1/2 top-5 -translate-y-1/2 transition-colors duration-200",
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-200 relative z-10",
                  currentStep > step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "border-primary bg-background text-primary ring-1 ring-primary"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <span
                    className={cn(
                      "text-base font-semibold",
                      currentStep >= step.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.id}
                  </span>
                )}
              </div>

              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "text-sm font-medium whitespace-nowrap",
                    currentStep >= step.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardHeader>

      {rejectionInfo && (
        <div className="px-6 py-4">
          <div className="bg-card border border-border rounded-lg py-6 pl-2 pr-6 md:p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="size-9 hidden bg-destructive rounded-full md:flex items-center justify-center">
                  <AlertTriangle className="size-4.5 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-base font-semibold">
                    Application Rejected
                  </h3>

                  {rejectionInfo.submissionCount &&
                    rejectionInfo.submissionCount > 1 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-xs font-medium rounded-full">
                        <RefreshCw className="size-3" />
                        Attempt #{rejectionInfo.submissionCount}
                      </span>
                    )}
                </div>

                <div className="space-y-3">
                  {rejectionInfo.reason ? (
                    <div className="space-y-2 mt-3">
                      <div className="p-4 bg-muted/50 rounded-md border-l-4 border-muted-foreground/20">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-foreground">
                            Reason:
                          </span>
                          <span className="text-sm text-foreground">
                            {rejectionInfo.reason}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span>
                          Please review the feedback above and update your
                          application accordingly.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Your previous application was rejected. Please review
                        and update your information before resubmitting.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CardContent>
        {renderStep()}

        {currentStep != totalSteps && (
          <div className="flex justify-between mt-8 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              className={cn(
                "flex items-center gap-2",
                currentStep === 1 && "invisible"
              )}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            {currentStep < totalSteps && (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiStepForm;
