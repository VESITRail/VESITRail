"use client";

import {
	Dialog,
	DialogClose,
	DialogTitle,
	DialogFooter,
	DialogHeader,
	DialogContent,
	DialogDescription
} from "@/components/ui/dialog";
import {
	createAcademicSemester,
	deleteAcademicSemester,
	updateAcademicSemester,
	type AcademicSemesterItem
} from "@/actions/academic-semester";
import {
	AlertDialog,
	AlertDialogTitle,
	AlertDialogCancel,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogContent,
	AlertDialogDescription
} from "@/components/ui/alert-dialog";
import {
	AcademicYearStartSchema,
	type AcademicSemesterInput,
	AcademicSemesterInputSchema
} from "@/lib/validations/admin/academic-semester";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm, useWatch } from "react-hook-form";
import { CalendarIcon, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatISO, parseISO } from "date-fns";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { formatAcademicYear } from "@/lib/academic-semester-table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAcademicYearDateRange, isDateInAcademicYear } from "@/lib/academic-semester-calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DialogProps = {
	onClose: () => void;
	onCloseAutoFocus: (event: Event) => void;
};

export function AcademicSemesterFormDialog({
	onClose,
	semester,
	onSuccess,
	onCloseAutoFocus
}: DialogProps & {
	semester?: AcademicSemesterItem;
	onSuccess: (semester: AcademicSemesterItem) => void | Promise<void>;
}) {
	const [openDateField, setOpenDateField] = useState<"startDate" | "endDate">();
	const form = useForm<AcademicSemesterInput>({
		resolver: zodResolver(AcademicSemesterInputSchema),
		defaultValues: semester
			? {
					term: semester.term,
					academicYearStart: semester.academicYearStart,
					endDate: semester.endDate.toISOString().slice(0, 10),
					startDate: semester.startDate.toISOString().slice(0, 10)
				}
			: { startDate: "", endDate: "" }
	});

	const { isSubmitting, errors } = form.formState;
	const academicYearStart = useWatch({ control: form.control, name: "academicYearStart" });
	const academicYear = AcademicYearStartSchema.safeParse(academicYearStart);
	const dateRange = academicYear.success ? getAcademicYearDateRange(academicYear.data) : undefined;

	async function saveSemester(input: AcademicSemesterInput) {
		try {
			const result = semester ? await updateAcademicSemester(semester.id, input) : await createAcademicSemester(input);
			if (result.isSuccess) {
				const { academicYearStart, term } = result.data;
				toast.success(semester ? "Semester updated" : "Semester added", {
					description: `${formatAcademicYear(academicYearStart)} · ${term} Semester`
				});
				await onSuccess(result.data);
				return;
			}

			const field = result.error.type === "VALIDATION_ERROR" ? result.error.field : undefined;
			if (field && Object.hasOwn(AcademicSemesterInputSchema.shape, field)) {
				form.setError(field as keyof AcademicSemesterInput, { message: result.error.message });
			} else {
				form.setError("root.server", { message: result.error.message });
			}
		} catch {
			form.setError("root.server", { message: "Could not save the semester. Please try again." });
		}
	}

	return (
		<Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
			<DialogContent
				showCloseButton={!isSubmitting}
				onCloseAutoFocus={onCloseAutoFocus}
				className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
			>
				<DialogHeader>
					<DialogTitle>{semester ? "Edit Semester" : "Add Semester"}</DialogTitle>
					<DialogDescription>Enter the college’s official semester dates.</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(saveSemester)} className="space-y-5" noValidate>
						<div className="grid items-start gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="academicYearStart"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Academic Year Start</FormLabel>
										<FormControl>
											<Input
												{...field}
												required
												type="number"
												placeholder="2026"
												inputMode="numeric"
												disabled={isSubmitting}
												value={Number.isFinite(field.value) ? field.value : ""}
												onChange={(event) => field.onChange(event.target.valueAsNumber)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="term"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Term</FormLabel>
										<Select value={field.value ?? ""} onValueChange={field.onChange} disabled={isSubmitting} required>
											<FormControl>
												<SelectTrigger ref={field.ref} onBlur={field.onBlur} className="w-full">
													<SelectValue placeholder="Select term" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="Odd">Odd</SelectItem>
												<SelectItem value="Even">Even</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							{(
								[
									["startDate", "Start Date"],
									["endDate", "End Date"]
								] as const
							).map(([name, label]) => (
								<FormField
									key={name}
									name={name}
									control={form.control}
									render={({ field }) => {
										const selected = field.value ? parseISO(field.value) : undefined;
										const dateText = selected ? format(selected, "dd/MM/yyyy") : "Pick a date";

										return (
											<FormItem className="min-w-0">
												<FormLabel>{label}</FormLabel>
												<Popover
													open={!!dateRange && openDateField === name}
													onOpenChange={(open) => setOpenDateField(open ? name : undefined)}
												>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																type="button"
																ref={field.ref}
																variant="outline"
																onBlur={field.onBlur}
																aria-label={`${label}, ${dateText}`}
																disabled={isSubmitting || !dateRange}
																className={cn(
																	"border-input w-full justify-between px-3 font-normal",
																	!selected && "text-muted-foreground"
																)}
															>
																{dateText}
																<CalendarIcon aria-hidden className="text-foreground size-4" />
															</Button>
														</FormControl>
													</PopoverTrigger>

													{dateRange && (
														<PopoverContent
															align="start"
															collisionPadding={8}
															className="max-h-(--radix-popover-content-available-height) w-auto overflow-y-auto p-0"
														>
															<CustomCalendar
																key={dateRange.fromYear}
																toYear={dateRange.toYear}
																fromYear={dateRange.fromYear}
																defaultMonth={parseISO(dateRange.firstDate)}
																selected={isDateInAcademicYear(field.value, dateRange) ? selected : undefined}
																onSelect={(date) => {
																	if (date) {
																		field.onChange(formatISO(date, { representation: "date" }));
																		setOpenDateField(undefined);
																	}
																}}
															/>
														</PopoverContent>
													)}
												</Popover>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							))}
							{!dateRange && (
								<p className="text-muted-foreground text-sm sm:col-span-2">
									Enter the Academic Year Start first to choose dates.
								</p>
							)}
						</div>
						{errors.root?.server?.message && (
							<p role="alert" className="text-destructive text-sm">
								{errors.root.server.message}
							</p>
						)}
						<DialogFooter className="gap-3 pt-2">
							<DialogClose asChild>
								<Button type="button" variant="outline" disabled={isSubmitting}>
									Cancel
								</Button>
							</DialogClose>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="animate-spin" />}
								{semester ? "Save Changes" : "Add Semester"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

export function AcademicSemesterDeleteDialog({
	onClose,
	semester,
	onSuccess,
	onCloseAutoFocus
}: DialogProps & { semester: AcademicSemesterItem; onSuccess: () => void }) {
	const [error, setError] = useState<string>();
	const [pending, setPending] = useState(false);
	const applicationCount = semester._count.applications;

	async function confirmDelete() {
		setPending(true);
		setError(undefined);
		try {
			const result = await deleteAcademicSemester(semester.id);
			if (!result.isSuccess) {
				setError(result.error.message);
				return;
			}
			toast.success("Semester deleted", {
				description: `${formatAcademicYear(semester.academicYearStart)} · ${semester.term} Semester`
			});
			onSuccess();
		} catch {
			setError("Could not delete the semester. Please try again.");
		} finally {
			setPending(false);
		}
	}

	return (
		<AlertDialog open onOpenChange={(open) => !open && !pending && onClose()}>
			<AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Semester</AlertDialogTitle>
					<AlertDialogDescription>
						{applicationCount > 0 ? (
							<>
								This semester cannot be deleted because it has {applicationCount} associated{" "}
								{applicationCount === 1 ? "application" : "applications"}.
							</>
						) : (
							<>
								Permanently delete the {formatAcademicYear(semester.academicYearStart)} {semester.term} semester?
							</>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				{error && (
					<p role="alert" className="text-destructive text-sm">
						{error}
					</p>
				)}
				<AlertDialogFooter className="gap-3 pt-2">
					<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
					<Button variant="destructive" onClick={confirmDelete} disabled={pending || applicationCount > 0}>
						{pending && <Loader2 className="animate-spin" />}
						Delete Semester
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
