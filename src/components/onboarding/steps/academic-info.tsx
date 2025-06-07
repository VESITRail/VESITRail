"use client";

import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import type { z } from "zod";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Branch, Class, Year } from "@/generated/zod";
import { OnboardingSchema } from "@/lib/validations/onboarding";
import { AcademicInfoSchema } from "@/lib/validations/onboarding";
import { getYears, getBranches, getClasses } from "@/actions/onboarding";

type AcademicInfoProps = {
  errors?: Record<string, string>;
  defaultValues?: z.infer<typeof OnboardingSchema>;
  setFormData: (data: z.infer<typeof OnboardingSchema>) => void;
};

const AcademicInfo = ({
  errors,
  setFormData,
  defaultValues,
}: AcademicInfoProps) => {
  const [years, setYears] = useState<Year[]>([]);
  const [Classes, setClasses] = useState<Class[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

  const [isLoadingYears, setIsLoadingYears] = useState<boolean>(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState<boolean>(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(true);

  const form = useForm<z.infer<typeof AcademicInfoSchema>>({
    mode: "onChange",
    resolver: zodResolver(AcademicInfoSchema),
    defaultValues: defaultValues || {
      year: "",
      class: "",
      branch: "",
    },
  });

  useEffect(() => {
    const subscription = form.watch((data) => {
      if (defaultValues) {
        setFormData({
          ...data,
          ...defaultValues,
          year: data.year || "",
          class: data.class || "",
          branch: data.branch || "",
        });
      } else {
        setFormData({
          address: "",
          station: "",
          lastName: "",
          firstName: "",
          middleName: "",
          gender: "Male",
          dateOfBirth: "",
          year: data.year || "",
          verificationDocUrl: "",
          class: data.class || "",
          branch: data.branch || "",
          preferredConcessionClass: "",
          preferredConcessionPeriod: "",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, setFormData, defaultValues]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [yearsResponse, branchesResponse, classesResponse] =
          await Promise.all([getYears(), getBranches(), getClasses()]);

        if (yearsResponse.data) {
          const activeYears = yearsResponse.data.filter(
            (year) => year.isActive && !year.isDeleted
          );

          setYears(activeYears);
        }

        if (branchesResponse.data) {
          const activeBranches = branchesResponse.data.filter(
            (branch) => branch.isActive && !branch.isDeleted
          );

          setBranches(activeBranches);
        }

        if (classesResponse.data) {
          const activeClasses = classesResponse.data.filter(
            (class_) => class_.isActive && !class_.isDeleted
          );

          setClasses(activeClasses);
        }
      } catch (error) {
        form.setError("year", {
          type: "manual",
          message: "Failed to load data. Please try again.",
        });
      } finally {
        setIsLoadingYears(false);
        setIsLoadingBranches(false);
      }
    };

    loadInitialData();
  }, [form]);

  useEffect(() => {
    const year = form.watch("year");
    const branch = form.watch("branch");

    setIsLoadingClasses(true);

    if (year && branch) {
      const matchingClasses = Classes.filter(
        (class_) =>
          class_.isActive &&
          !class_.isDeleted &&
          class_.yearId === year &&
          class_.branchId === branch
      );

      setFilteredClasses(matchingClasses);
    } else {
      setFilteredClasses([]);
      form.setValue("class", "");
    }

    setIsLoadingClasses(false);
  }, [form.watch("year"), form.watch("branch"), Classes, form]);

  useEffect(() => {
    if (errors) {
      Object.entries(errors).forEach(([key, value]) => {
        form.setError(key as keyof z.infer<typeof AcademicInfoSchema>, {
          type: "manual",
          message: value,
        });
      });
    }
  }, [errors, form]);

  return (
    <Form {...form}>
      <div className="grid grid-cols-1 md:grid-cols-2 space-y-6 gap-x-6">
        <FormField
          name="year"
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1 h-[78px]">
              <FormLabel className="block">Year</FormLabel>
              <Select
                value={field.value}
                disabled={isLoadingYears}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger
                    className={cn(
                      "w-full",
                      isLoadingYears && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <SelectValue
                        placeholder={!isLoadingYears && "Select year"}
                      />
                      {isLoadingYears && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="branch"
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1 h-[78px]">
              <FormLabel className="block">Branch</FormLabel>
              <Select
                value={field.value}
                disabled={isLoadingBranches}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger
                    className={cn(
                      "w-full",
                      isLoadingBranches && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <SelectValue
                        placeholder={!isLoadingBranches && "Select branch"}
                      />
                      {isLoadingBranches && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        name="class"
        control={form.control}
        render={({ field }) => (
          <FormItem className="space-y-1 h-[78px] mt-6 md:mt-0">
            <FormLabel className="block">Class</FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={
                !form.watch("year") ||
                !form.watch("branch") ||
                filteredClasses.length === 0 ||
                isLoadingClasses
              }
            >
              <FormControl>
                <SelectTrigger
                  className={cn(
                    "w-full",
                    (isLoadingClasses ||
                      !form.watch("year") ||
                      !form.watch("branch") ||
                      filteredClasses.length === 0) &&
                      "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <SelectValue
                      placeholder={
                        (!isLoadingClasses && !form.watch("year")) ||
                        !form.watch("branch")
                          ? "Select year and branch first"
                          : filteredClasses.length === 0
                          ? "No classes available"
                          : "Select class"
                      }
                    />
                    {isLoadingClasses && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {filteredClasses.map((class_) => (
                  <SelectItem key={class_.id} value={class_.id}>
                    {class_.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
};

export default AcademicInfo;
