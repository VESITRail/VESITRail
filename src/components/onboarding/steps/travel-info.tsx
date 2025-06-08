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
import {
  Command,
  CommandItem,
  CommandList,
  CommandGroup,
  CommandInput,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { z } from "zod";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
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
  const [open, setOpen] = useState<boolean>(false);
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

  const activeStations = stations.filter(
    (station) => station.isActive && !station.isDeleted
  );

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
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        role="combobox"
                        variant="outline"
                        aria-expanded={open}
                        disabled={isLoadingStations}
                        className={cn(
                          "w-full justify-between h-10 px-3 py-2 text-left font-normal",
                          !field.value && "text-muted-foreground",
                          isLoadingStations && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span className="truncate">
                          {field.value
                            ? (() => {
                                const selectedStation = activeStations.find(
                                  (station) => station.id === field.value
                                );
                                return selectedStation
                                  ? `${selectedStation.code} - ${selectedStation.name}`
                                  : "Select station...";
                              })()
                            : "Select station..."}
                        </span>
                        {isLoadingStations ? (
                          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                        ) : (
                          <ChevronsUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
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
                          {activeStations.map((station) => (
                            <CommandItem
                              key={station.id}
                              value={`${station.code} ${station.name}`}
                              onSelect={() => {
                                handleFieldChange("station", station.id);
                                setOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <CheckIcon
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6">
          <FormField
            control={form.control}
            name="preferredConcessionClass"
            render={({ field }) => (
              <FormItem className="space-y-1 h-[78px]">
                <FormLabel>Preferred Concession Class</FormLabel>
                <Select
                  value={field.value}
                  disabled={isLoadingConcessionClasses}
                  onValueChange={(value) =>
                    handleFieldChange("preferredConcessionClass", value)
                  }
                >
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        "w-full h-10",
                        isLoadingConcessionClasses &&
                          "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <SelectValue
                          placeholder={
                            isLoadingConcessionClasses
                              ? "Loading..."
                              : "Select concession class"
                          }
                        />
                        {isLoadingConcessionClasses && (
                          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
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
              <FormItem className="space-y-1 h-[78px] mb-4 lg:mb-0">
                <FormLabel>Preferred Concession Period</FormLabel>
                <Select
                  value={field.value}
                  disabled={isLoadingConcessionPeriods}
                  onValueChange={(value) =>
                    handleFieldChange("preferredConcessionPeriod", value)
                  }
                >
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        "w-full h-10",
                        isLoadingConcessionPeriods &&
                          "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <SelectValue
                          placeholder={
                            isLoadingConcessionPeriods
                              ? "Loading..."
                              : "Select concession period"
                          }
                        />
                        {isLoadingConcessionPeriods && (
                          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
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
