"use client";

import {
  PersonalInfoSchema,
  type OnboardingSchema,
} from "@/lib/validations/onboarding";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import {
  format,
  getDay,
  addMonths,
  subMonths,
  startOfMonth,
  getDaysInMonth,
} from "date-fns";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import type { z } from "zod";
import { useForm } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { capitalizeWords, cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";

type PersonalInfoProps = {
  errors?: Record<string, string>;
  defaultValues?: z.infer<typeof OnboardingSchema>;
  setFormData: (data: z.infer<typeof OnboardingSchema>) => void;
};

const CustomCalendar = ({
  selected,
  onSelect,
  fromYear = 1950,
  toYear = new Date().getFullYear(),
}: {
  toYear?: number;
  selected?: Date;
  fromYear?: number;
  onSelect?: (date: Date | undefined) => void;
}) => {
  const [currentDate, setCurrentDate] = useState(selected || new Date());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => toYear - i
  );
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(new Date(currentYear, currentMonth));
    const firstDayOfMonth = getDay(
      startOfMonth(new Date(currentYear, currentMonth))
    );

    const prevMonth = subMonths(new Date(currentYear, currentMonth, 1), 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => ({
      day: daysInPrevMonth - firstDayOfMonth + i + 1,
      isCurrentMonth: false,
      isPrevMonth: true,
      date: new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth(),
        daysInPrevMonth - firstDayOfMonth + i + 1
      ),
    }));

    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      isCurrentMonth: true,
      isPrevMonth: false,
      isNextMonth: false,
      date: new Date(currentYear, currentMonth, i + 1),
    }));

    const nextMonth = addMonths(new Date(currentYear, currentMonth, 1), 1);
    const remainingDays = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7;
    const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => ({
      day: i + 1,
      isCurrentMonth: false,
      isNextMonth: true,
      date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i + 1),
    }));

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const calendarDays = generateCalendarDays();

  const handleMonthChange = (month: string) => {
    const monthIndex = months.indexOf(month);
    setCurrentMonth(monthIndex);
    setCurrentDate(new Date(currentYear, monthIndex, 1));
  };

  const handleYearChange = (year: string) => {
    const yearValue = Number.parseInt(year);
    setCurrentYear(yearValue);
    setCurrentDate(new Date(yearValue, currentMonth, 1));
  };

  const handleDateSelect = (date: Date) => {
    if (onSelect) {
      onSelect(date);
    }
  };

  const isSelectedDate = (date: Date) => {
    if (!selected) return false;
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="p-4 bg- rounded-md border border-border">
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <Select
            value={months[currentMonth]}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-full bg-background border-border">
              <div className="flex items-center justify-between w-full">
                <span>{months[currentMonth]}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select
            value={currentYear.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-full bg-background border-border">
              <div className="flex items-center justify-between w-full">
                <span>{currentYear}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-2">
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateSelect(day.date)}
              className={cn(
                "h-9 w-9 rounded-md flex items-center justify-center text-sm transition-colors",
                !day.isCurrentMonth && "text-muted-foreground/50",
                day.isCurrentMonth &&
                  !isSelectedDate(day.date) &&
                  !isToday(day.date) &&
                  "hover:bg-accent",
                isSelectedDate(day.date) &&
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                isToday(day.date) &&
                  !isSelectedDate(day.date) &&
                  "bg-accent text-accent-foreground"
              )}
              disabled={!day.isCurrentMonth}
            >
              {day.day}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const PersonalInfo = ({
  errors,
  setFormData,
  defaultValues,
}: PersonalInfoProps) => {
  const [open, setOpen] = useState(false);
  type FormFieldName = Parameters<typeof form.setError>[0];
  const form = useForm<z.infer<typeof PersonalInfoSchema>>({
    mode: "onChange",
    resolver: zodResolver(PersonalInfoSchema),
    defaultValues: defaultValues || {
      address: "",
      lastName: "",
      firstName: "",
      middleName: "",
      dateOfBirth: "",
      gender: "Male" as "Male" | "Female",
    },
  });

  const handleCapitalFirstChange = (
    value: string,
    onChange: (value: string) => void
  ) => {
    const capitalizedValue = capitalizeWords(value);
    onChange(capitalizedValue);
  };

  useEffect(() => {
    const subscription = form.watch((data) => {
      if (defaultValues) {
        setFormData({
          ...data,
          ...defaultValues,
          address: data.address || "",
          gender: data.gender || "Male",
          lastName: data.lastName || "",
          firstName: data.firstName || "",
          middleName: data.middleName || "",
          dateOfBirth: data.dateOfBirth || "",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, setFormData, defaultValues]);

  useEffect(() => {
    if (errors) {
      Object.entries(errors).forEach(([key, value]) => {
        form.setError(key as FormFieldName, {
          type: "manual",
          message: value,
        });
      });
    }
  }, [errors, form]);

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            name="firstName"
            control={form.control}
            render={({ field }) => (
              <FormItem className="space-y-1 h-[78px]">
                <FormLabel className="block">First Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    autoCapitalize="words"
                    aria-describedby="firstName-error"
                    placeholder="Enter your first name"
                    onChange={(e) =>
                      handleCapitalFirstChange(e.target.value, field.onChange)
                    }
                  />
                </FormControl>

                <div className="h-5">
                  <FormMessage id="firstName-error" className="text-sm" />
                </div>
              </FormItem>
            )}
          />

          <FormField
            name="middleName"
            control={form.control}
            render={({ field }) => (
              <FormItem className="space-y-1 h-[78px]">
                <FormLabel className="block">Middle Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    autoCapitalize="words"
                    aria-describedby="middleName-error"
                    placeholder="Enter your middle name"
                    onChange={(e) =>
                      handleCapitalFirstChange(e.target.value, field.onChange)
                    }
                  />
                </FormControl>
                <div className="h-5">
                  <FormMessage id="middleName-error" className="text-sm" />
                </div>
              </FormItem>
            )}
          />

          <FormField
            name="lastName"
            control={form.control}
            render={({ field }) => (
              <FormItem className="space-y-1 h-[78px]">
                <FormLabel className="block">Last Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    autoCapitalize="words"
                    aria-describedby="lastName-error"
                    placeholder="Enter your last name"
                    onChange={(e) =>
                      handleCapitalFirstChange(e.target.value, field.onChange)
                    }
                  />
                </FormControl>
                <div className="h-5">
                  <FormMessage id="lastName-error" className="text-sm" />
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <FormField
            name="gender"
            control={form.control}
            render={({ field }) => (
              <FormItem className="space-y-1 h-[78px]">
                <FormLabel className="block">Gender</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder="Select gender"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>

                <div className="h-5">
                  <FormMessage id="gender-error" className="text-sm" />
                </div>
              </FormItem>
            )}
          />

          <FormField
            name="dateOfBirth"
            control={form.control}
            render={({ field }) => (
              <FormItem className="space-y-1 h-[78px]">
                <FormLabel className="block">Date Of Birth</FormLabel>

                <FormControl>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                      <CustomCalendar
                        toYear={new Date().getFullYear() - 17}
                        fromYear={new Date().getFullYear() - 25}
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => {
                          field.onChange(date?.toISOString());
                          setOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>

                <div className="h-5">
                  <FormMessage id="dateOfBirth-error" className="text-sm" />
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          name="address"
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="block">Address</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  {...field}
                  autoComplete="off"
                  autoCapitalize="sentences"
                  aria-describedby="address-error"
                  placeholder="Enter your address"
                  onChange={(e) =>
                    handleCapitalFirstChange(e.target.value, field.onChange)
                  }
                />
              </FormControl>

              <div className="h-5">
                <FormMessage id="address-error" className="text-sm" />
              </div>
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
};

export default PersonalInfo;
