"use client";

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
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn, formatFieldName } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { OnboardingSchema } from "@/lib/validations/onboarding";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

const MultiStepForm = () => {
  const totalSteps = 5;
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

        toast.error(`Please complete all required fields in ${stepName}`);
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
        toast.error("Something went wrong. Please try again.");
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

      <CardContent className="mt-8">
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
