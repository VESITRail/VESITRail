"use client";

import {
	cn,
	toTitleCase,
	normalizeDob,
	sortByYearOrder,
	capitalizeWords,
	formatDobForInput,
	formatDateOfBirth
} from "@/lib/utils";
import {
	Drawer,
	DrawerClose,
	DrawerTitle,
	DrawerFooter,
	DrawerHeader,
	DrawerContent,
	DrawerTrigger,
	DrawerDescription
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Branch, Class, Year } from "@/generated/zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { getYears, getBranches, getClasses } from "@/actions/utils";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pencil, Loader2, AlertCircle, GraduationCap, User, CalendarIcon } from "lucide-react";
import { EditStudentSchema, type EditStudentInput } from "@/lib/validations/admin/edit-student";
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from "@/components/ui/select";
import { StudentListItem, StudentDetails, getStudentDetails, updateStudentDetails } from "@/actions/student";

type EditStudentDrawerProps = {
	student: StudentListItem;
	onStudentUpdate?: (updatedStudent: StudentDetails) => void;
};

export const EditStudentDrawer = ({ student, onStudentUpdate }: EditStudentDrawerProps) => {
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
	const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

	const [years, setYears] = useState<Year[]>([]);
	const [classes, setClasses] = useState<Class[]>([]);
	const [branches, setBranches] = useState<Branch[]>([]);
	const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

	const [initialFormData, setInitialFormData] = useState<EditStudentInput | null>(null);
	const [formData, setFormData] = useState<EditStudentInput>({
		dateOfBirth: "",
		class: student.class.id || "",
		lastName: student.lastName || "",
		year: student.class.year.id || "",
		firstName: student.firstName || "",
		middleName: student.middleName || "",
		branch: student.class.branch.id || "",
		gender: (student.gender as "Male" | "Female") || "Male"
	});

	const [errors, setErrors] = useState<Partial<Record<keyof EditStudentInput, string>>>({});
	const isFirstClassFilterRun = useRef(true);

	const loadAcademicData = useCallback(async () => {
		try {
			const [yearsResponse, branchesResponse, classesResponse] = await Promise.all([
				getYears(),
				getBranches(),
				getClasses()
			]);

			if (yearsResponse.isSuccess) {
				setYears(sortByYearOrder(yearsResponse.data));
			}
			if (branchesResponse.isSuccess) {
				setBranches(branchesResponse.data);
			}
			if (classesResponse.isSuccess) {
				setClasses(classesResponse.data);
			}
		} catch (error) {
			console.error("Error loading academic options:", error);
			toast.error("Failed to load academic data");
		}
	}, []);

	const loadStudentFullDetails = useCallback(async () => {
		setIsLoadingDetails(true);
		try {
			const result = await getStudentDetails(student.userId);
			if (result.isSuccess) {
				const details = result.data;
				const loadedData: EditStudentInput = {
					class: details.class.id || "",
					lastName: details.lastName || "",
					year: details.class.year.id || "",
					firstName: details.firstName || "",
					middleName: details.middleName || "",
					branch: details.class.branch.id || "",
					dateOfBirth: formatDobForInput(details.dateOfBirth),
					gender: (details.gender as "Male" | "Female") || "Male"
				};
				setFormData(loadedData);
				setInitialFormData(loadedData);
			} else {
				toast.error("Failed to load student information");
			}
		} catch (error) {
			console.error("Error loading student details:", error);
			toast.error("Failed to load student information");
		} finally {
			setIsLoadingDetails(false);
		}
	}, [student.userId]);

	useEffect(() => {
		if (isOpen) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- We want to load academic data and student details when the drawer opens
			loadAcademicData();
			loadStudentFullDetails();
			setErrors({});
			setIsDatePickerOpen(false);
			isFirstClassFilterRun.current = true;
		}
	}, [isOpen, loadAcademicData, loadStudentFullDetails]);

	useEffect(() => {
		if (!formData.year || !formData.branch) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- We want to update the state when the year or branch changes
			setFilteredClasses([]);
			return;
		}

		const matchingClasses = classes.filter(
			(classItem) => classItem.yearId === formData.year && classItem.branchId === formData.branch
		);

		setFilteredClasses(matchingClasses);

		if (!isFirstClassFilterRun.current) {
			const currentClassValid = matchingClasses.some((c) => c.id === formData.class);
			if (!currentClassValid) {
				setFormData((prev) => ({ ...prev, class: "" }));
			}
		} else {
			isFirstClassFilterRun.current = false;
		}
	}, [formData.year, formData.branch, classes, formData.class]);

	const handleFieldChange = (field: keyof EditStudentInput, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleNameChange = (field: "firstName" | "middleName" | "lastName", value: string) => {
		const capitalizedValue = capitalizeWords(value);
		handleFieldChange(field, capitalizedValue);
	};

	const isFormUnchanged = useMemo(() => {
		if (!initialFormData) return true;
		return (
			formData.firstName === initialFormData.firstName &&
			(formData.middleName || "") === (initialFormData.middleName || "") &&
			(formData.lastName || "") === (initialFormData.lastName || "") &&
			formData.gender === initialFormData.gender &&
			formData.dateOfBirth === initialFormData.dateOfBirth &&
			formData.year === initialFormData.year &&
			formData.branch === initialFormData.branch &&
			formData.class === initialFormData.class
		);
	}, [formData, initialFormData]);

	const validate = (): boolean => {
		const validationResult = EditStudentSchema.safeParse(formData);
		if (!validationResult.success) {
			const newErrors: Partial<Record<keyof EditStudentInput, string>> = {};
			validationResult.error.issues.forEach((issue) => {
				const field = issue.path[0] as keyof EditStudentInput;
				if (field && !newErrors[field]) {
					newErrors[field] = issue.message;
				}
			});
			setErrors(newErrors);
			return false;
		}
		setErrors({});
		return true;
	};

	const handleSubmit = async () => {
		if (!validate()) {
			toast.error("Validation Error", {
				description: "Please correct the highlighted errors before saving."
			});
			return;
		}

		setIsSaving(true);
		const updatePromise = async () => {
			const result = await updateStudentDetails({
				studentId: student.userId,
				...formData
			});

			if (result.isSuccess) {
				onStudentUpdate?.(result.data);
				setIsOpen(false);
				return result.data;
			} else {
				throw new Error(result.error.message || "Failed to update student details");
			}
		};

		toast.promise(updatePromise, {
			loading: "Saving student details...",
			success: (data) => {
				const studentFullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ");
				return `${toTitleCase(studentFullName)}'s details have been updated.`;
			},
			error: (err) => err.message || "Failed to update student details",
			finally: () => {
				setIsSaving(false);
			}
		});
	};

	return (
		<Drawer direction="right" open={isOpen} onOpenChange={setIsOpen}>
			<DrawerTrigger asChild>
				<Button size="sm" variant="outline" title="Edit Student Details" aria-label="Edit Student Details">
					<Pencil className="size-4" />
				</Button>
			</DrawerTrigger>

			<DrawerContent className="w-full sm:max-w-md h-full max-h-dvh flex flex-col bg-background border-l overflow-hidden">
				<DrawerHeader className="border-b pb-4 px-6 shrink-0">
					<div className="flex items-center gap-3">
						<div className="size-9 bg-primary/20 rounded-lg flex items-center justify-center">
							<Pencil className="size-4.5" />
						</div>
						<div>
							<DrawerTitle className="text-xl font-semibold">Edit Student Details</DrawerTitle>
							<DrawerDescription className="sr-only">
								Edit personal and academic details of the student
							</DrawerDescription>
						</div>
					</div>
				</DrawerHeader>

				{isLoadingDetails ? (
					<div className="flex-1 min-h-0 px-6 py-4 space-y-6 overflow-y-auto">
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Skeleton className="size-4" />
								<Skeleton className="h-4 w-36" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-9 w-full" />
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-9 w-full" />
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-9 w-full" />
								</div>
							</div>
						</div>

						<Separator />

						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Skeleton className="size-4" />
								<Skeleton className="h-4 w-40" />
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Skeleton className="h-4 w-14" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-9 w-full" />
								</div>
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-9 w-full" />
							</div>
						</div>
					</div>
				) : (
					<ScrollArea className="flex-1 min-h-0 h-full">
						<div className="space-y-6 px-6 py-4 pb-6">
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
									<User className="size-4" />
									<span>Personal Information</span>
								</div>

								<div className="space-y-2">
									<Label htmlFor="firstName" className="text-sm font-medium">
										First Name <span className="text-destructive">*</span>
									</Label>
									<Input
										id="firstName"
										autoComplete="off"
										disabled={isSaving}
										autoCapitalize="words"
										value={formData.firstName}
										placeholder="Enter first name"
										className={cn(errors.firstName && "border-destructive")}
										onChange={(e) => handleNameChange("firstName", e.target.value)}
									/>
									{errors.firstName && (
										<p className="text-xs text-destructive flex items-center gap-1">
											<AlertCircle className="size-3" />
											{errors.firstName}
										</p>
									)}
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="middleName" className="text-sm font-medium">
											Middle Name
										</Label>
										<Input
											id="middleName"
											autoComplete="off"
											disabled={isSaving}
											autoCapitalize="words"
											placeholder="Enter middle name"
											value={formData.middleName || ""}
											className={cn(errors.middleName && "border-destructive")}
											onChange={(e) => handleNameChange("middleName", e.target.value)}
										/>
										{errors.middleName && (
											<p className="text-xs text-destructive flex items-center gap-1">
												<AlertCircle className="size-3" />
												{errors.middleName}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="lastName" className="text-sm font-medium">
											Last Name
										</Label>
										<Input
											id="lastName"
											autoComplete="off"
											disabled={isSaving}
											autoCapitalize="words"
											placeholder="Enter last name"
											value={formData.lastName || ""}
											className={cn(errors.lastName && "border-destructive")}
											onChange={(e) => handleNameChange("lastName", e.target.value)}
										/>
										{errors.lastName && (
											<p className="text-xs text-destructive flex items-center gap-1">
												<AlertCircle className="size-3" />
												{errors.lastName}
											</p>
										)}
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="text-sm font-medium">
											Gender <span className="text-destructive">*</span>
										</Label>
										<Select
											disabled={isSaving}
											value={formData.gender}
											onValueChange={(val: "Male" | "Female") => handleFieldChange("gender", val)}
										>
											<SelectTrigger className={cn("w-full", errors.gender && "border-destructive")}>
												<SelectValue placeholder="Select gender" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Male">Male</SelectItem>
												<SelectItem value="Female">Female</SelectItem>
											</SelectContent>
										</Select>
										{errors.gender && (
											<p className="text-xs text-destructive flex items-center gap-1">
												<AlertCircle className="size-3" />
												{errors.gender}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="dateOfBirth" className="text-sm font-medium">
											Date of Birth <span className="text-destructive">*</span>
										</Label>
										<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
											<PopoverTrigger asChild>
												<Button
													type="button"
													id="dateOfBirth"
													variant="outline"
													disabled={isSaving}
													className={cn(
														"w-full justify-start text-left font-normal h-9",
														!formData.dateOfBirth && "text-muted-foreground",
														errors.dateOfBirth && "border-destructive"
													)}
												>
													<CalendarIcon className="mr-2 size-4" />
													{formData.dateOfBirth ? (
														formatDateOfBirth(formData.dateOfBirth, "dd/MM/yyyy")
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
														formData.dateOfBirth ? (normalizeDob(formData.dateOfBirth) ?? undefined) : undefined
													}
													onSelect={(date) => {
														handleFieldChange("dateOfBirth", date ? formatDobForInput(date) : "");
														setIsDatePickerOpen(false);
													}}
												/>
											</PopoverContent>
										</Popover>
										{errors.dateOfBirth && (
											<p className="text-xs text-destructive flex items-center gap-1">
												<AlertCircle className="size-3" />
												{errors.dateOfBirth}
											</p>
										)}
									</div>
								</div>
							</div>

							<Separator />

							<div className="space-y-4">
								<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
									<GraduationCap className="size-4" />
									<span>Academic Information</span>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="text-sm font-medium">
											Year <span className="text-destructive">*</span>
										</Label>
										<Select
											disabled={isSaving}
											value={formData.year}
											onValueChange={(val) => handleFieldChange("year", val)}
										>
											<SelectTrigger className={cn("w-full", errors.year && "border-destructive")}>
												<SelectValue placeholder="Select year" />
											</SelectTrigger>
											<SelectContent>
												{years.map((year) => (
													<SelectItem key={year.id} value={year.id} isUnavailable={!year.isActive}>
														{year.name} ({year.code})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{errors.year && (
											<p className="text-xs text-destructive flex items-center gap-1">
												<AlertCircle className="size-3" />
												{errors.year}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label className="text-sm font-medium">
											Branch <span className="text-destructive">*</span>
										</Label>
										<Select
											disabled={isSaving}
											value={formData.branch}
											onValueChange={(val) => handleFieldChange("branch", val)}
										>
											<SelectTrigger className={cn("w-full", errors.branch && "border-destructive")}>
												<SelectValue placeholder="Select branch" />
											</SelectTrigger>
											<SelectContent>
												{branches.map((branch) => (
													<SelectItem key={branch.id} value={branch.id} isUnavailable={!branch.isActive}>
														{branch.name} ({branch.code})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{errors.branch && (
											<p className="text-xs text-destructive flex items-center gap-1">
												<AlertCircle className="size-3" />
												{errors.branch}
											</p>
										)}
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-medium">
										Class / Division <span className="text-destructive">*</span>
									</Label>
									<Select
										value={formData.class}
										onValueChange={(val) => handleFieldChange("class", val)}
										disabled={isSaving || !formData.year || !formData.branch || filteredClasses.length === 0}
									>
										<SelectTrigger
											className={cn(
												"w-full",
												(!formData.year || !formData.branch || filteredClasses.length === 0) &&
													"opacity-60 cursor-not-allowed",
												errors.class && "border-destructive"
											)}
										>
											<SelectValue
												placeholder={
													!formData.year || !formData.branch
														? "Select year and branch first"
														: filteredClasses.length === 0
															? "No classes available"
															: "Select class"
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{filteredClasses.map((classItem) => (
												<SelectItem key={classItem.id} value={classItem.id} isUnavailable={!classItem.isActive}>
													{classItem.code}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{errors.class && (
										<p className="text-xs text-destructive flex items-center gap-1">
											<AlertCircle className="size-3" />
											{errors.class}
										</p>
									)}
								</div>
							</div>
						</div>
					</ScrollArea>
				)}

				<DrawerFooter className="border-t p-4 flex flex-row justify-end gap-3 bg-background shrink-0 mt-auto">
					<DrawerClose asChild>
						<Button variant="outline" disabled={isSaving}>
							Cancel
						</Button>
					</DrawerClose>
					<Button onClick={handleSubmit} disabled={isSaving || isLoadingDetails || isFormUnchanged}>
						{isSaving ? (
							<>
								<Loader2 className="size-4 mr-2 animate-spin" />
								Saving...
							</>
						) : (
							"Save Changes"
						)}
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
};
