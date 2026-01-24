"use client";

import type { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { ConcessionClass, ConcessionPeriod, Station } from "@/generated/zod";
import { TravelInfoSchema, OnboardingSchema } from "@/lib/validations/onboarding";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getStations, getConcessionClasses, getConcessionPeriods } from "@/actions/utils";
import { Form, FormItem, FormLabel, FormField, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from "@/components/ui/select";
import { Command, CommandItem, CommandList, CommandGroup, CommandInput, CommandEmpty } from "@/components/ui/command";

type TravelInfoProps = {
	errors?: Record<string, string>;
	defaultValues?: z.infer<typeof OnboardingSchema>;
	setFormData: (data: z.infer<typeof OnboardingSchema>) => void;
};

const TravelInfo = ({ errors, setFormData, defaultValues }: TravelInfoProps) => {
	const [stations, setStations] = useState<Station[]>([]);
	const [concessionPeriods, setConcessionPeriods] = useState<ConcessionPeriod[]>([]);
	const [concessionClasses, setConcessionClasses] = useState<ConcessionClass[]>([]);
	const [open, setOpen] = useState<boolean>(false);
	const [isLoadingConcessionClasses, setIsLoadingConcessionClasses] = useState<boolean>(true);
	const [isLoadingConcessionPeriods, setIsLoadingConcessionPeriods] = useState<boolean>(true);
	const [isLoadingStations, setIsLoadingStations] = useState<boolean>(true);

	const form = useForm<z.infer<typeof TravelInfoSchema>>({
		mode: "onChange",
		resolver: zodResolver(TravelInfoSchema),
		defaultValues: defaultValues || {
			station: "",
			preferredConcessionClass: "",
			preferredConcessionPeriod: ""
		}
	});

	const handleFieldChange = async (
		field: "station" | "preferredConcessionClass" | "preferredConcessionPeriod",
		value: string
	) => {
		form.setValue(field, value, {
			shouldDirty: true,
			shouldTouch: true,
			shouldValidate: true
		});

		const currentData = form.getValues();

		if (defaultValues) {
			setFormData({
				...defaultValues,
				[field]: value
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
				[field]: value
			});
		}
	};

	useEffect(() => {
		const loadInitialData = async () => {
			try {
				const [stationsResponse, concessionClassesResponse, concessionPeriodsResponse] = await Promise.all([
					getStations(),
					getConcessionClasses(),
					getConcessionPeriods()
				]);

				if (stationsResponse.data) {
					setStations(stationsResponse.data);
				} else {
					toast.error("Failed to load stations", {
						description: "Please refresh the page and try again."
					});
				}

				if (concessionClassesResponse.data) {
					setConcessionClasses(concessionClassesResponse.data);
				} else {
					toast.error("Failed to load concession classes", {
						description: "Please refresh the page and try again."
					});
				}

				if (concessionPeriodsResponse.data) {
					setConcessionPeriods(concessionPeriodsResponse.data);
				} else {
					toast.error("Failed to load concession periods", {
						description: "Please refresh the page and try again."
					});
				}
			} catch (error) {
				toast.error("Failed to load travel data", {
					description: "An unexpected error occurred. Please try again."
				});
				console.error("Error loading travel data:", error);
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
					message: value
				});
			});
		}
	}, [errors, form]);

	const StationSelectSkeleton = () => (
		<FormItem className="space-y-1">
			<FormLabel>
				Home Station <span className="text-destructive">*</span>
			</FormLabel>
			<Skeleton className="h-10 w-full rounded-md" />
		</FormItem>
	);

	const ConcessionClassSelectSkeleton = () => (
		<FormItem className="space-y-1">
			<FormLabel>
				Preferred Concession Class <span className="text-destructive">*</span>
			</FormLabel>
			<Skeleton className="h-10 w-full rounded-md" />
		</FormItem>
	);

	const ConcessionPeriodSelectSkeleton = () => (
		<FormItem className="space-y-1 mb-4 lg:mb-0">
			<FormLabel>
				Preferred Concession Period <span className="text-destructive">*</span>
			</FormLabel>
			<Skeleton className="h-10 w-full rounded-md" />
		</FormItem>
	);

	return (
		<Form {...form}>
			<form>
				<div className="space-y-4">
					{isLoadingStations ? (
						<StationSelectSkeleton />
					) : (
						<FormField
							name="station"
							control={form.control}
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel>
										Home Station <span className="text-destructive">*</span>
									</FormLabel>
									<Popover open={open} onOpenChange={setOpen}>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													role="combobox"
													variant="outline"
													aria-expanded={open}
													className={cn(
														"w-full justify-between h-10 px-3 py-2 text-left font-normal",
														!field.value && "text-muted-foreground"
													)}
												>
													<span className="truncate">
														{field.value
															? (() => {
																	const selectedStation = stations.find((station) => station.id === field.value);

																	return selectedStation
																		? `${selectedStation.name} (${selectedStation.code})`
																		: "Select station...";
																})()
															: "Select station..."}
													</span>
													<ChevronsUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="p-0 w-full min-w-[--radix-popover-trigger-width]" align="start">
											<Command>
												<CommandInput placeholder="Search by name or code" className="h-9" />
												<CommandList>
													<CommandEmpty>No station found.</CommandEmpty>
													<CommandGroup>
														{stations.map((station) => (
															<CommandItem
																key={station.id}
																value={`${station.name} (${station.code})`}
																onSelect={() => {
																	handleFieldChange("station", station.id);
																	setOpen(false);
																}}
																className="cursor-pointer"
															>
																<CheckIcon
																	className={cn(
																		"mr-2 h-4 w-4 shrink-0",
																		field.value === station.id ? "opacity-100" : "opacity-0"
																	)}
																/>
																<span className="truncate">{`${station.name} (${station.code})`}</span>
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
					)}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
					{isLoadingConcessionClasses ? (
						<ConcessionClassSelectSkeleton />
					) : (
						<FormField
							control={form.control}
							name="preferredConcessionClass"
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel>
										Preferred Concession Class <span className="text-destructive">*</span>
									</FormLabel>
									<Select
										value={field.value}
										onValueChange={(value) => handleFieldChange("preferredConcessionClass", value)}
									>
										<FormControl>
											<SelectTrigger className="w-full h-10">
												<SelectValue placeholder="Select concession class" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{concessionClasses.map((concessionClass) => (
												<SelectItem key={concessionClass.id} value={concessionClass.id}>
													{concessionClass.name} ({concessionClass.code})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{isLoadingConcessionPeriods ? (
						<ConcessionPeriodSelectSkeleton />
					) : (
						<FormField
							control={form.control}
							name="preferredConcessionPeriod"
							render={({ field }) => (
								<FormItem className="space-y-1 mb-4 lg:mb-0">
									<FormLabel>
										Preferred Concession Period <span className="text-destructive">*</span>
									</FormLabel>
									<Select
										value={field.value}
										onValueChange={(value) => handleFieldChange("preferredConcessionPeriod", value)}
									>
										<FormControl>
											<SelectTrigger className="w-full h-10">
												<SelectValue placeholder="Select concession period" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{concessionPeriods.map((period) => (
												<SelectItem key={period.id} value={period.id}>
													{period.name} ({period.duration} {period.duration === 1 ? "month" : "months"})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
				</div>
			</form>
		</Form>
	);
};

export default TravelInfo;
