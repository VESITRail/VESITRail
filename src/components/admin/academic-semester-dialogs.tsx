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
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatAcademicYear } from "@/lib/academic-semester-table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AcademicSemesterInputSchema, type AcademicSemesterInput } from "@/lib/validations/admin/academic-semester";

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
									render={({ field }) => (
										<FormItem className="min-w-0">
											<FormLabel>{label}</FormLabel>
											<FormControl>
												<Input
													{...field}
													required
													type="date"
													disabled={isSubmitting}
													className="relative pr-9 uppercase [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							))}
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
