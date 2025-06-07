"use client";

import {
  TravelInfoSchema,
  OnboardingSchema,
} from "@/lib/validations/onboarding";
import {
  getStations,
  getConcessionClasses,
  getConcessionPeriods,
} from "@/actions/onboarding";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Form,
  FormItem,
  FormLabel,
  FormField,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { z } from "zod";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConcessionClass, ConcessionPeriod, Station } from "@/generated/zod";

type TravelInfoProps = {
  errors?: Record<string, string>;
  defaultValues?: z.infer<typeof OnboardingSchema>;
  setFormData: (data: z.infer<typeof OnboardingSchema>) => void;
};

const TravelInfo = ({
  errors,
  setFormData,
  defaultValues,
}: TravelInfoProps) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [concessionPeriods, setConcessionPeriods] = useState<
    ConcessionPeriod[]
  >([]);
  const [concessionClasses, setConcessionClasses] = useState<ConcessionClass[]>(
    []
  );

  const [isLoadingConcessionClasses, setIsLoadingConcessionClasses] =
    useState<boolean>(true);
  const [isLoadingConcessionPeriods, setIsLoadingConcessionPeriods] =
    useState<boolean>(true);
  const [isLoadingStations, setIsLoadingStations] = useState<boolean>(true);

  const form = useForm<z.infer<typeof TravelInfoSchema>>({
    mode: "onChange",
    resolver: zodResolver(TravelInfoSchema),
    defaultValues: defaultValues || {
      station: "",
      preferredConcessionClass: "",
      preferredConcessionPeriod: "",
    },
  });

  const handleFieldChange = async (
    field: "station" | "preferredConcessionClass" | "preferredConcessionPeriod",
    value: string
  ) => {
    form.setValue(field, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    const currentData = form.getValues();

    if (defaultValues) {
      setFormData({
        ...defaultValues,
        [field]: value,
      });
    } else {
      setFormData({
        year: "",
        class: "",
        branch: "",
        address: "",
        lastName: "",
        firstName: "",
        gender: "Male",
        middleName: "",
        dateOfBirth: "",
        verificationDocUrl: "",
        ...currentData,
        [field]: value,
      });
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [
          stationsResponse,
          concessionClassesResponse,
          concessionPeriodsResponse,
        ] = await Promise.all([
          getStations(),
          getConcessionClasses(),
          getConcessionPeriods(),
        ]);

        if (stationsResponse.data) setStations(stationsResponse.data);
        if (concessionClassesResponse.data)
          setConcessionClasses(concessionClassesResponse.data);
        if (concessionPeriodsResponse.data)
          setConcessionPeriods(concessionPeriodsResponse.data);
      } catch (error) {
        form.setError("station", {
          type: "manual",
          message: "Failed to load data. Please try again.",
        });
      } finally {
        setIsLoadingStations(false);
        setIsLoadingConcessionClasses(false);
        setIsLoadingConcessionPeriods(false);
      }
    };

    loadInitialData();
  }, [form]);

  useEffect(() => {
    if (errors) {
      Object.entries(errors).forEach(([key, value]) => {
        form.setError(key as keyof z.infer<typeof TravelInfoSchema>, {
          type: "manual",
          message: value,
        });
      });
    }
  }, [errors, form]);

  return (
    <Form {...form}>
      <form>
        <div className="space-y-6">
          <FormField
            name="station"
            control={form.control}
            render={({ field }) => (
              <FormItem className="space-y-1 h-[78px]">
                <FormLabel>Home Station</FormLabel>
                <Select
                  defaultValue={field.value}
                  disabled={isLoadingStations}
                  onValueChange={(value) => handleFieldChange("station", value)}
                >
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        "w-full",
                        isLoadingStations && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <SelectValue
                          placeholder={!isLoadingStations && "Select station"}
                        />

                        {isLoadingStations && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stations
                      .filter(
                        (station) => station.isActive && !station.isDeleted
                      )
                      .map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {`${station.code} - ${station.name}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <FormField
            control={form.control}
            name="preferredConcessionClass"
            render={({ field }) => (
              <FormItem className="space-y-1 h-[78px]">
                <FormLabel>Preferred Concession Class</FormLabel>
                <Select
                  defaultValue={field.value}
                  disabled={isLoadingConcessionClasses}
                  onValueChange={(value) =>
                    handleFieldChange("preferredConcessionClass", value)
                  }
                >
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        "w-full",
                        isLoadingConcessionClasses &&
                          "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <SelectValue
                          placeholder={
                            !isLoadingConcessionClasses &&
                            "Select concession class"
                          }
                        />

                        {isLoadingConcessionClasses && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {concessionClasses
                      .filter((cls) => cls.isActive && !cls.isDeleted)
                      .map((concessionClass) => (
                        <SelectItem
                          key={concessionClass.id}
                          value={concessionClass.id}
                        >
                          {concessionClass.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredConcessionPeriod"
            render={({ field }) => (
              <FormItem className="space-y-1 h-[78px] mb-4 md:mb-0">
                <FormLabel>Preferred Concession Period</FormLabel>
                <Select
                  defaultValue={field.value}
                  disabled={isLoadingConcessionPeriods}
                  onValueChange={(value) =>
                    handleFieldChange("preferredConcessionPeriod", value)
                  }
                >
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        "w-full",
                        isLoadingConcessionPeriods &&
                          "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <SelectValue
                          placeholder={
                            !isLoadingConcessionPeriods &&
                            "Select concession period"
                          }
                        />

                        {isLoadingConcessionPeriods && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {concessionPeriods
                      .filter((period) => period.isActive && !period.isDeleted)
                      .map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
};

export default TravelInfo;
