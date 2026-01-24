"use client";

import type { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { Branch, Class, Year } from "@/generated/zod";
import { OnboardingSchema } from "@/lib/validations/onboarding";
import { AcademicInfoSchema } from "@/lib/validations/onboarding";
import { getYears, getBranches, getClasses } from "@/actions/utils";
import { Form, FormItem, FormField, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from "@/components/ui/select";

type AcademicInfoProps = {
	errors?: Record<string, string>;
	defaultValues?: z.infer<typeof OnboardingSchema>;
	setFormData: (data: z.infer<typeof OnboardingSchema>) => void;
};

const AcademicInfo = ({ errors, setFormData, defaultValues }: AcademicInfoProps) => {
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
			branch: ""
		}
	});

	useEffect(() => {
		const subscription = form.watch((data) => {
			if (defaultValues) {
				setFormData({
					...data,
					...defaultValues,
					year: data.year || "",
					class: data.class || "",
					branch: data.branch || ""
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
					preferredConcessionPeriod: ""
				});
			}
		});

		return () => subscription.unsubscribe();
	}, [form, setFormData, defaultValues]);

	useEffect(() => {
		const loadInitialData = async () => {
			try {
				const [yearsResponse, branchesResponse, classesResponse] = await Promise.all([
					getYears(),
					getBranches(),
					getClasses()
				]);

				if (yearsResponse.isSuccess) {
					setYears(yearsResponse.data);
				} else {
					toast.error("Failed to load years", {
						description: "Please refresh the page and try again."
					});
				}

				if (branchesResponse.isSuccess) {
					setBranches(branchesResponse.data);
				} else {
					toast.error("Failed to load branches", {
						description: "Please refresh the page and try again."
					});
				}

				if (classesResponse.isSuccess) {
					setClasses(classesResponse.data);
				} else {
					toast.error("Failed to load classes", {
						description: "Please refresh the page and try again."
					});
				}
			} catch (error) {
				toast.error("Failed to load academic data", {
					description: "An unexpected error occurred. Please try again."
				});
				console.error("Error loading academic data:", error);
			} finally {
				setIsLoadingYears(false);
				setIsLoadingBranches(false);
			}
		};

		loadInitialData();
	}, [form]);

	const year = form.watch("year");
	const isFirstRun = useRef(true);
	const branch = form.watch("branch");

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setIsLoadingClasses(true);

			if (year && branch) {
				const matchingClasses = Classes.filter((class_) => class_.yearId === year && class_.branchId === branch);

				setFilteredClasses(matchingClasses);

				if (matchingClasses.length === 0 && !isFirstRun.current) {
					toast.warning("No classes found", {
						description: "No classes are available for the selected year and branch combination."
					});
				}
			} else {
				setFilteredClasses([]);
				form.setValue("class", "");
			}

			isFirstRun.current = false;
			setIsLoadingClasses(false);
		}, 50);

		return () => clearTimeout(timeoutId);
	}, [year, branch, Classes, form]);

	useEffect(() => {
		if (errors) {
			Object.entries(errors).forEach(([key, value]) => {
				form.setError(key as keyof z.infer<typeof AcademicInfoSchema>, {
					type: "manual",
					message: value
				});
			});
		}
	}, [errors, form]);

	const YearSelectSkeleton = () => (
		<FormItem className="space-y-1">
			<FormLabel className="block">
				Year <span className="text-destructive">*</span>
			</FormLabel>
			<Skeleton className="h-10 w-full rounded-md" />
		</FormItem>
	);

	const BranchSelectSkeleton = () => (
		<FormItem className="space-y-1">
			<FormLabel className="block">
				Branch <span className="text-destructive">*</span>
			</FormLabel>
			<Skeleton className="h-10 w-full rounded-md" />
		</FormItem>
	);

	const ClassSelectSkeleton = () => (
		<FormItem className="space-y-1 mt-6 md:mt-0">
			<FormLabel className="block">
				Class <span className="text-destructive">*</span>
			</FormLabel>
			<Skeleton className="h-10 w-full rounded-md" />
		</FormItem>
	);

	return (
		<Form {...form}>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-6 md:gap-y-4">
				{isLoadingYears ? (
					<YearSelectSkeleton />
				) : (
					<FormField
						name="year"
						control={form.control}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel className="block">
									Year <span className="text-destructive">*</span>
								</FormLabel>
								<Select value={field.value} onValueChange={field.onChange}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select year" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{years.map((year) => (
											<SelectItem key={year.id} value={year.id}>
												{year.name} ({year.code})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				{isLoadingBranches ? (
					<BranchSelectSkeleton />
				) : (
					<FormField
						name="branch"
						control={form.control}
						render={({ field }) => (
							<FormItem className="space-y-1">
								{" "}
								<FormLabel className="block">
									Branch <span className="text-destructive">*</span>
								</FormLabel>{" "}
								<Select value={field.value} onValueChange={field.onChange}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select branch" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{branches.map((branch) => (
											<SelectItem key={branch.id} value={branch.id}>
												{branch.name} ({branch.code})
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

			{isLoadingClasses ? (
				<ClassSelectSkeleton />
			) : (
				<FormField
					name="class"
					control={form.control}
					render={({ field }) => (
						<FormItem className="space-y-1 mt-6">
							<FormLabel className="block">
								Class <span className="text-destructive">*</span>
							</FormLabel>
							<Select
								value={field.value}
								onValueChange={field.onChange}
								disabled={!form.watch("year") || !form.watch("branch") || filteredClasses.length === 0}
							>
								<FormControl>
									<SelectTrigger
										className={cn(
											"w-full",
											(!form.watch("year") || !form.watch("branch") || filteredClasses.length === 0) &&
												"opacity-50 cursor-not-allowed"
										)}
									>
										<SelectValue
											placeholder={
												!form.watch("year") || !form.watch("branch")
													? "Select year and branch first"
													: filteredClasses.length === 0
														? "No classes available"
														: "Select class"
											}
										/>
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
			)}
		</Form>
	);
};

export default AcademicInfo;
