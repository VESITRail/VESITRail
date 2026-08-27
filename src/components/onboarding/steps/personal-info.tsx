"use client";

import type { z } from "zod";
import { useForm } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PersonalInfoSchema, type OnboardingSchema } from "@/lib/validations/onboarding";
import { Form, FormItem, FormField, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { capitalizeWords, cn, formatDateOfBirth, formatDobForInput, normalizeDob } from "@/lib/utils";
import { Select, SelectItem, SelectValue, SelectTrigger, SelectContent } from "@/components/ui/select";

type PersonalInfoProps = {
	errors?: Record<string, string>;
	defaultValues?: z.infer<typeof OnboardingSchema>;
	setFormData: (data: z.infer<typeof OnboardingSchema>) => void;
};

const PersonalInfo = ({ errors, setFormData, defaultValues }: PersonalInfoProps) => {
	"use no memo";
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
			gender: "Male" as "Male" | "Female"
		}
	});

	const handleCapitalFirstChange = (value: string, onChange: (value: string) => void) => {
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
					dateOfBirth: data.dateOfBirth || ""
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
					message: value
				});
			});
		}
	}, [errors, form]);

	const parseAddress = (address: string) => {
		if (!address || typeof address !== "string") {
			return {
				city: "",
				area: "",
				pincode: "",
				building: ""
			};
		}

		if (address.includes(" | ")) {
			const parts = address.split(" | ");
			return {
				building: parts[0] || "",
				area: parts[1] || "",
				city: parts[2] || "",
				pincode: parts[3] || ""
			};
		}

		const parts = address.split(",").map((part) => part.trim());

		if (parts.length <= 4) {
			return {
				building: parts[0] || "",
				area: parts[1] || "",
				city: parts[2] || "",
				pincode: parts[3] || ""
			};
		}

		const pincode = parts[parts.length - 1] || "";
		const city = parts[parts.length - 2] || "";
		const building = parts[0] || "";
		const area = parts.slice(1, parts.length - 2).join(", ");

		return { building, area, city, pincode };
	};

	const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
	const [addressComponents, setAddressComponents] = useState(() => parseAddress(form.getValues("address") || ""));

	const combineAddress = (components: Record<string, string>) => {
		const allFieldsFilled = Object.values(components).every(
			(val) =>
				val &&
				typeof val === "string" &&
				val.trim().length > 0 &&
				(components.pincode ? components.pincode.length === 6 : true)
		);

		return allFieldsFilled
			? `${components.building.trim()} | ${components.area.trim()} | ${components.city.trim()} | ${components.pincode.trim()}`
			: "";
	};

	return (
		<Form {...form}>
			<div className="space-y-4">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<FormField
						name="firstName"
						control={form.control}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel className="block">
									First Name <span className="text-destructive">*</span>
								</FormLabel>

								<FormControl>
									<Input
										{...field}
										autoComplete="off"
										autoCapitalize="words"
										aria-describedby="firstName-error"
										placeholder="Enter your first name"
										onChange={(e) => handleCapitalFirstChange(e.target.value, field.onChange)}
									/>
								</FormControl>

								<div className="min-h-5">
									<FormMessage id="firstName-error" className="text-sm" />
								</div>
							</FormItem>
						)}
					/>

					<FormField
						name="middleName"
						control={form.control}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel className="block">Middle Name</FormLabel>

								<FormControl>
									<Input
										{...field}
										autoComplete="off"
										autoCapitalize="words"
										aria-describedby="middleName-error"
										placeholder="Enter your middle name"
										onChange={(e) => handleCapitalFirstChange(e.target.value, field.onChange)}
									/>
								</FormControl>
								<div className="min-h-5">
									<FormMessage id="middleName-error" className="text-sm" />
								</div>
							</FormItem>
						)}
					/>

					<FormField
						name="lastName"
						control={form.control}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel className="block">Last Name</FormLabel>

								<FormControl>
									<Input
										{...field}
										autoComplete="off"
										autoCapitalize="words"
										aria-describedby="lastName-error"
										placeholder="Enter your last name"
										onChange={(e) => handleCapitalFirstChange(e.target.value, field.onChange)}
									/>
								</FormControl>
								<div className="min-h-5">
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
							<FormItem className="space-y-1">
								<FormLabel className="block">
									Gender <span className="text-destructive">*</span>
								</FormLabel>

								<Select defaultValue={field.value} onValueChange={field.onChange}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue
												placeholder="Select gender"
												className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
											/>
										</SelectTrigger>
									</FormControl>

									<SelectContent>
										<SelectItem value="Male">Male</SelectItem>
										<SelectItem value="Female">Female</SelectItem>
									</SelectContent>
								</Select>

								<div className="min-h-5">
									<FormMessage id="gender-error" className="text-sm" />
								</div>
							</FormItem>
						)}
					/>

					<FormField
						name="dateOfBirth"
						control={form.control}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel className="block">
									Date Of Birth <span className="text-destructive">*</span>
								</FormLabel>

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
												{field.value ? formatDateOfBirth(field.value, "PPP") : <span>Pick a date</span>}
											</Button>
										</PopoverTrigger>

										<PopoverContent className="w-auto p-0" align="start">
											<CustomCalendar
												toYear={new Date().getFullYear() - 17}
												fromYear={new Date().getFullYear() - 25}
												selected={field.value ? (normalizeDob(field.value) ?? undefined) : undefined}
												onSelect={(date) => {
													field.onChange(date ? formatDobForInput(date) : "");
													setOpen(false);
												}}
											/>
										</PopoverContent>
									</Popover>
								</FormControl>

								<div className="min-h-5">
									<FormMessage id="dateOfBirth-error" className="text-sm" />
								</div>
							</FormItem>
						)}
					/>
				</div>

				<FormField
					name="address"
					control={form.control}
					render={({ field }) => {
						const updateAddressComponentWithField = (key: string, value: string) => {
							if (!hasUserInteracted) {
								setHasUserInteracted(true);
							}

							const capitalizedValue = key === "pincode" ? value : capitalizeWords(value);

							const newComponents = {
								...addressComponents,
								[key]: capitalizedValue
							};

							setAddressComponents(newComponents);

							const combinedAddress = combineAddress(newComponents);
							field.onChange(combinedAddress || "");
						};

						const hasAnyContent = Object.values(addressComponents).some((val) => val && val.trim().length > 0);

						const shouldShowValidation = hasUserInteracted && hasAnyContent;

						return (
							<FormItem className="space-y-1">
								<FormLabel className="block">Address</FormLabel>
								<FormControl>
									<div className="space-y-6">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
											<div>
												<label className="text-sm font-medium mb-2 block">
													House / Building <span className="text-destructive">*</span>
												</label>

												<Input
													autoComplete="off"
													autoCapitalize="words"
													value={addressComponents.building}
													placeholder="House No., Flat No., Building name"
													onChange={(e) => updateAddressComponentWithField("building", e.target.value)}
													className={`${
														!addressComponents.building.trim() && shouldShowValidation ? "border-destructive" : ""
													}`}
												/>
											</div>

											<div>
												<label className="text-sm font-medium mb-2 block">
													Area / Locality <span className="text-destructive">*</span>
												</label>

												<Input
													autoComplete="off"
													autoCapitalize="words"
													value={addressComponents.area}
													placeholder="Enter your area / locality"
													onChange={(e) => updateAddressComponentWithField("area", e.target.value)}
													className={`${
														!addressComponents.area.trim() && shouldShowValidation ? "border-destructive" : ""
													}`}
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
											<div>
												<label className="text-sm font-medium mb-2 block">
													City <span className="text-destructive">*</span>
												</label>

												<Input
													autoComplete="off"
													autoCapitalize="words"
													placeholder="Enter your city"
													value={addressComponents.city}
													onChange={(e) => updateAddressComponentWithField("city", e.target.value)}
													className={`${
														!addressComponents.city.trim() && shouldShowValidation ? "border-destructive" : ""
													}`}
												/>
											</div>

											<div>
												<label className="text-sm font-medium mb-2 block">
													Pincode <span className="text-destructive">*</span>
												</label>

												<Input
													type="text"
													maxLength={6}
													autoComplete="off"
													placeholder="Enter your pincode"
													value={addressComponents.pincode}
													onChange={(e) => {
														const value = e.target.value.replace(/\D/g, "");
														updateAddressComponentWithField("pincode", value);
													}}
													className={`${
														(!addressComponents.pincode.trim() || addressComponents.pincode.length !== 6) &&
														shouldShowValidation
															? "border-destructive"
															: ""
													}`}
												/>
											</div>
										</div>
									</div>
								</FormControl>

								<div className="min-h-5">
									<FormMessage id="address-error" className="text-sm" />
								</div>
							</FormItem>
						);
					}}
				/>
			</div>
		</Form>
	);
};

export default PersonalInfo;
