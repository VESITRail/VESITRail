"use client";

import {
	Info,
	Send,
	Clock,
	Loader2,
	XCircle,
	History,
	RotateCw,
	FileText,
	CheckCircle,
	TicketCheck,
	AlertTriangle
} from "lucide-react";
import {
	StudentStation,
	getStudentStation,
	StudentPreferences,
	getConcessionPeriods,
	getConcessionClasses,
	getStudentPreferences
} from "@/actions/utils";
import {
	submitConcessionApplication,
	submitConcessionResubmission,
	getConcessionApplicationState,
	type ConcessionApplicationState
} from "@/actions/concession";
import {
	AlertDialog,
	AlertDialogTitle,
	AlertDialogCancel,
	AlertDialogAction,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogContent,
	AlertDialogDescription
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import posthog from "posthog-js";
import Status from "@/components/ui/status";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { formatAcademicYear } from "@/lib/academic-semester-table";
import { ConcessionClass, ConcessionPeriod } from "@/generated/zod";
import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SlideButton, { type SlideButtonRef } from "@/components/ui/slide-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PreviousApplicationDialog } from "@/components/student/previous-application-dialog";
import { Select, SelectItem, SelectValue, SelectTrigger, SelectContent } from "@/components/ui/select";

const formPageClassName = "container max-w-5xl mx-auto py-8 px-4";
const formGridClassName = "grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7";
const readOnlyFieldClassName =
	"flex h-10 items-center justify-between rounded-md border border-border bg-input/30 px-3 text-sm";
const statusPageClassName = "container mx-auto flex max-w-5xl flex-1 flex-col justify-center gap-6 px-4 py-6";

function ConcessionFormSkeleton({ showHistory = false, isResubmission = false }) {
	return (
		<Card role="status" aria-label="Loading concession application form">
			<CardContent className="py-2.5">
				<div className="space-y-6 md:space-y-7">
					<div className={formGridClassName}>
						<div className="space-y-3.5">
							<Skeleton className="h-5 w-28" />
							<div className={readOnlyFieldClassName}>
								<Skeleton className="h-3.5 w-12" />
								{showHistory && <Skeleton className="h-8 w-30" />}
							</div>
						</div>
						<div className="space-y-3.5">
							<Skeleton className="h-5 w-24" />
							<div className={readOnlyFieldClassName}>
								<Skeleton className="h-3.5 w-36" />
							</div>
						</div>
					</div>
					<div className={formGridClassName}>
						<div className="space-y-3.5">
							<Skeleton className="h-5 w-28" />
							<Skeleton className="h-10 w-full" />
						</div>
						<div className="space-y-3.5">
							<Skeleton className="h-5 w-32" />
							<Skeleton className="h-10 w-full" />
						</div>
					</div>
					<div className="flex justify-end pt-4">
						<Skeleton
							className={`h-12 w-full rounded-lg md:h-10 md:rounded-md ${isResubmission ? "md:w-43" : "md:w-39"}`}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function ConcessionPageSkeleton() {
	return (
		<div className={formPageClassName}>
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-3">
					<Skeleton className="size-10 rounded-lg" />
					<Skeleton className="h-8 w-56" />
				</div>
				<Skeleton className="size-10 rounded-md" />
			</div>

			<Separator className="my-6" />

			<ConcessionFormSkeleton />
		</div>
	);
}

function getBlockerStatus(blocker: NonNullable<ConcessionApplicationState["blocker"]>) {
	switch (blocker.status) {
		case "Pending":
			return {
				icon: Clock,
				iconBg: "bg-amber-500",
				title: "Application Under Review",
				description:
					"Your concession application is currently being reviewed. Please wait for approval before applying again."
			};
		case "Approved":
			return {
				icon: TicketCheck,
				iconBg: "bg-primary",
				title: "Concession Approved",
				description:
					blocker.applicationType === "Renewal"
						? "Please collect your certificate at the Railway Concession Office (Ground Floor, Admin Office). Bring your existing pass and college ID card."
						: "Please collect your certificate at the Railway Concession Office (Ground Floor, Admin Office). Bring your college ID card."
			};
		case "ActivePass":
			return {
				icon: CheckCircle,
				iconBg: "bg-green-600",
				title: "Active Concession",
				description: `Your concession is valid until ${formatInTimeZone(
					blocker.expiryDate,
					"Asia/Kolkata",
					"MMMM dd, yyyy"
				)}. Days remaining: ${blocker.daysRemaining}.`
			};
		case "UnverifiedPass":
			return {
				icon: AlertTriangle,
				iconBg: "bg-amber-600",
				title: "Data Verification Required",
				description: "Your issued application needs verification. Please contact support before applying again."
			};
	}
}

const ConcessionApplicationForm = () => {
	const router = useRouter();
	const mounted = useRef(false);
	const isMobile = useIsMobile();
	const slideButtonRef = useRef<SlideButtonRef>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [refreshVersion, setRefreshVersion] = useState(0);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [loadingOptions, setLoadingOptions] = useState<boolean>(true);
	const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

	const [student, setStudent] = useState<
		| (StudentPreferences & {
				station: StudentStation;
		  })
		| null
	>(null);
	const [applicationState, setApplicationState] = useState<ConcessionApplicationState | null>(null);

	const [selectedConcessionClass, setSelectedConcessionClass] = useState<string>("");
	const [selectedConcessionPeriod, setSelectedConcessionPeriod] = useState<string>("");

	const [concessionClasses, setConcessionClasses] = useState<ConcessionClass[]>([]);
	const [concessionPeriods, setConcessionPeriods] = useState<ConcessionPeriod[]>([]);

	useLayoutEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

	useEffect(() => {
		let current = true;
		const fetchOptions = async () => {
			setLoadingOptions(true);

			try {
				const [classesResult, periodsResult] = await Promise.all([getConcessionClasses(), getConcessionPeriods()]);
				if (!current) return;

				if (classesResult.error) {
					toast.error("Classes Not Loading", {
						description: "Unable to load your concession classes. Please try again."
					});
				} else if (classesResult.data) {
					setConcessionClasses(classesResult.data);
				}

				if (periodsResult.error) {
					toast.error("Periods Not Loading", {
						description: "Unable to load your concession periods. Please try again."
					});
				} else if (periodsResult.data) {
					setConcessionPeriods(periodsResult.data);
				}
			} catch (error) {
				if (!current) return;
				console.error("Error while loading form options:", error);
				toast.error("Options Not Loading", {
					description: "Unable to load form options. Please try again."
				});
			} finally {
				if (current) setLoadingOptions(false);
			}
		};

		void fetchOptions();
		return () => {
			current = false;
		};
	}, []);

	useEffect(() => {
		let current = true;
		const loadApplication = async () => {
			setLoading(true);
			setLoadError(null);
			try {
				const [applicationResult, prefResult, stationResult] = await Promise.all([
					getConcessionApplicationState(),
					getStudentPreferences(),
					getStudentStation()
				]);
				if (!current) return;

				if (!applicationResult.isSuccess || !prefResult.isSuccess || !stationResult.isSuccess) {
					setLoadError("We couldn't load your application details. Please try again.");
					return;
				}

				const state = applicationResult.data;
				setApplicationState(state);
				setStudent({ station: stationResult.data, ...prefResult.data });
				setSelectedConcessionClass(state.correction?.concessionClass.id ?? prefResult.data.preferredConcessionClass.id);
				setSelectedConcessionPeriod(
					state.correction?.concessionPeriod.id ?? prefResult.data.preferredConcessionPeriod.id
				);
			} catch (error) {
				if (!current) return;
				console.error("Error while loading application details:", error);
				setLoadError("We couldn't load your application details. Please try again.");
			} finally {
				if (current) setLoading(false);
			}
		};

		void loadApplication();
		return () => {
			current = false;
		};
	}, [refreshVersion]);

	const selectedClassIsActive = concessionClasses.some((c) => c.id === selectedConcessionClass && c.isActive);

	const selectedPeriodIsActive = concessionPeriods.some((p) => p.id === selectedConcessionPeriod && p.isActive);

	const handleSubmit = async () => {
		if (!applicationState?.semester || !student || !isFormValid || isSubmitting) return;

		const selectedClass = concessionClasses.find((c) => c.id === selectedConcessionClass);
		const selectedPeriod = concessionPeriods.find((p) => p.id === selectedConcessionPeriod);
		const analytics = {
			class: selectedClass?.name,
			period: selectedPeriod?.name,
			station: student.station.name,
			application_type: applicationState.applicationType
		};
		posthog.capture("concession_submit_initiated", analytics);

		setIsSubmitting(true);
		setShowConfirmDialog(false);
		if (isMobile) slideButtonRef.current?.showSubmitting();

		const applicationData = {
			stationId: student.station.id,
			concessionClassId: selectedConcessionClass,
			concessionPeriodId: selectedConcessionPeriod,
			expectedSemesterId: applicationState.semester.id
		};
		const correction = applicationState.correction;

		try {
			const submission = correction
				? submitConcessionResubmission(correction.id, applicationData)
				: submitConcessionApplication(applicationData);
			const result = await submission;
			if (!mounted.current) return;

			if (!result.isSuccess) {
				posthog.capture("concession_submitted_failed", analytics);
				toast.error(correction ? "Resubmission Failed" : "Submission Failed", { description: result.error.message });
				if (
					result.error.type === "VALIDATION_ERROR" &&
					["expectedSemesterId", "semesterId", "status", "applicationId", "stationId"].includes(
						result.error.field ?? ""
					)
				) {
					setRefreshVersion((version) => version + 1);
				}
				return;
			}

			toast.success(correction ? "Application Resubmitted" : "Application Submitted", {
				description: "You can track its status on your dashboard."
			});
			posthog.capture("concession_submitted_success", {
				...analytics,
				application_type: result.data?.applicationType ?? analytics.application_type
			});
			router.push("/dashboard/student");
		} catch (error) {
			if (!mounted.current) return;
			posthog.capture("concession_submitted_failed", analytics);
			console.error("Submission error:", error);
			toast.error("Application Failed to Save", { description: "Please try again." });
		} finally {
			if (mounted.current) {
				setIsSubmitting(false);
				slideButtonRef.current?.reset();
			}
		}
	};

	const handleDialogClose = (open: boolean) => {
		setShowConfirmDialog(open);
		if (!open && isMobile) {
			slideButtonRef.current?.reset();
		}
	};

	const isFormValid = Boolean(selectedClassIsActive && selectedPeriodIsActive);

	if (loading) return <ConcessionPageSkeleton />;

	if (loadError || !applicationState || !student) {
		return (
			<Status
				icon={XCircle}
				iconColor="text-white"
				iconBg="bg-destructive"
				containerClassName="flex-1"
				title="Failed to Load Application"
				description={loadError ?? "Application details are unavailable."}
				button={{ icon: RotateCw, label: "Try Again", onClick: () => setRefreshVersion((version) => version + 1) }}
			/>
		);
	}

	const { semester, blocker, correction, latestApplication, upcomingSemester, applicationType, previousPass } =
		applicationState;

	if (!semester || blocker) {
		return (
			<div className={statusPageClassName}>
				{!semester ? (
					<Status
						icon={Clock}
						iconBg="bg-amber-500"
						iconColor="text-white"
						containerClassName="p-0"
						title="Semester Applications Closed"
						button={{ href: "/dashboard/student", label: "View Application History", icon: History }}
						description={
							upcomingSemester
								? `Concession applications for the ${formatAcademicYear(upcomingSemester.academicYearStart)} ${upcomingSemester.term} semester open on ${formatInTimeZone(upcomingSemester.openingDate, "UTC", "MMMM d, yyyy")}.`
								: "Please check back for the next application opening date."
						}
					/>
				) : (
					blocker && <Status {...getBlockerStatus(blocker)} iconColor="text-white" containerClassName="p-0" />
				)}
			</div>
		);
	}

	const isResubmission = Boolean(correction);

	return (
		<div className={formPageClassName}>
			<div className="flex justify-between items-center">
				<span className="flex items-center gap-3">
					<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
						<FileText className="size-5" />
					</div>

					<h1 className="text-2xl font-semibold">Apply for concession</h1>
				</span>

				<Popover>
					<PopoverTrigger asChild>
						<Button size="icon" variant="outline" className="size-10">
							<Info className="size-5" />
						</Button>
					</PopoverTrigger>

					<PopoverContent align="end" side="bottom" className="text-sm bg-background">
						<p className="font-medium mb-4">Heads up!</p>
						<ul className="list-disc pl-5 space-y-1 text-muted-foreground">
							<li>These details are autofilled based on the information you provided during onboarding.</li>
							<li>You can review and change them before submitting your application.</li>
						</ul>
					</PopoverContent>
				</Popover>
			</div>

			<Separator className="my-6" />

			{correction && (
				<div className="pb-6">
					<div className="bg-card border border-border rounded-lg py-6 pl-2 pr-6 md:p-6 shadow-sm">
						<div className="flex items-start gap-4">
							<div className="shrink-0">
								<div className="size-9 hidden bg-destructive rounded-full md:flex items-center justify-center">
									<AlertTriangle className="size-4.5 text-white" />
								</div>
							</div>

							<div className="flex-1 min-w-0">
								<h3 className="text-base font-semibold mb-2">Application Rejected</h3>

								<div className="space-y-3">
									{correction.rejectionReason ? (
										<div className="space-y-2 mt-3">
											<div className="p-4 bg-muted/50 rounded-md border-l-4 border-muted-foreground/20">
												<div className="flex items-start gap-2">
													<span className="text-sm font-medium text-foreground">Reason:</span>
													<span className="text-sm text-foreground">{correction.rejectionReason}</span>
												</div>
											</div>

											<div className="flex items-start gap-2 text-sm text-muted-foreground">
												<span>Please review the feedback above and update your application accordingly.</span>
											</div>
										</div>
									) : (
										<div className="space-y-2">
											<p className="text-sm text-muted-foreground">
												Your previous concession application was rejected. Please review and correct your details before
												resubmitting.
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{!latestApplication && (
				<Alert className="mb-6">
					<Info className="size-4" />
					<AlertTitle>First Time Application</AlertTitle>
					<AlertDescription>
						This is your first time applying for a concession. Please make sure all required details are accurate to
						avoid delays in processing your application.
					</AlertDescription>
				</Alert>
			)}

			{loadingOptions ? (
				<ConcessionFormSkeleton showHistory={Boolean(previousPass)} isResubmission={isResubmission} />
			) : (
				<>
					<Card>
						<CardContent className="py-2.5">
							<div className="space-y-6 md:space-y-7">
								<div className={formGridClassName}>
									<div className="space-y-3.5">
										<p id="application-type-label" className="text-sm font-medium">
											Application Type
										</p>
										<div aria-labelledby="application-type-label" role="group" className={readOnlyFieldClassName}>
											{applicationType}
											{previousPass && <PreviousApplicationDialog previousApplication={previousPass} showLabel />}
										</div>
									</div>

									<div className="space-y-3.5">
										<p className="text-sm font-medium">Home Station</p>

										<div className={readOnlyFieldClassName}>
											{student.station.name} ({student.station.code})
										</div>
									</div>
								</div>

								<div className={formGridClassName}>
									<div className="space-y-3.5">
										<Label htmlFor="concession-class" className="text-sm font-medium">
											Concession Class <span className="text-destructive">*</span>
										</Label>

										<Select
											onValueChange={(value) => {
												const selectedClass = concessionClasses.find((c) => c.id === value);
												posthog.capture("concession_form_option_changed", {
													field_name: "class",
													value: selectedClass?.name
												});
												setSelectedConcessionClass(value);
											}}
											value={selectedClassIsActive ? selectedConcessionClass : undefined}
										>
											<SelectTrigger id="concession-class" className="w-full h-10!">
												<SelectValue placeholder="Select concession class" />
											</SelectTrigger>

											<SelectContent>
												{concessionClasses.map((cls) => (
													<SelectItem key={cls.id} value={cls.id} isUnavailable={!cls.isActive}>
														{cls.name} ({cls.code})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-3.5">
										<Label htmlFor="concession-period" className="text-sm font-medium">
											Concession Period <span className="text-destructive">*</span>
										</Label>

										<Select
											onValueChange={(value) => {
												const selectedPeriod = concessionPeriods.find((p) => p.id === value);
												posthog.capture("concession_form_option_changed", {
													field_name: "period",
													value: selectedPeriod?.name
												});
												setSelectedConcessionPeriod(value);
											}}
											value={selectedPeriodIsActive ? selectedConcessionPeriod : undefined}
										>
											<SelectTrigger id="concession-period" className="w-full h-10!">
												<SelectValue placeholder="Select concession period" />
											</SelectTrigger>

											<SelectContent>
												{concessionPeriods.map((period) => (
													<SelectItem key={period.id} value={period.id} isUnavailable={!period.isActive}>
														{period.name} ({period.duration} {period.duration === 1 ? "month" : "months"})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="flex justify-end pt-4">
									{isMobile ? (
										<SlideButton
											fullWidth
											ref={slideButtonRef}
											disabled={!isFormValid}
											isSubmitting={isSubmitting}
											loadingText={isResubmission ? "Resubmitting..." : "Submitting..."}
											text={isResubmission ? "Slide to resubmit application" : "Slide to submit application"}
											onSlideComplete={() => {
												setShowConfirmDialog(true);
											}}
										/>
									) : (
										<Button
											size="lg"
											onClick={() => {
												setShowConfirmDialog(true);
											}}
											disabled={!isFormValid || isSubmitting}
										>
											{isSubmitting ? (
												<>
													<Loader2 className="mr-1 size-4 animate-spin" />
													{isResubmission ? "Resubmitting..." : "Submitting..."}
												</>
											) : (
												<>
													<Send className="mr-1 size-4" />
													{isResubmission ? "Resubmit Application" : "Submit Application"}
												</>
											)}
										</Button>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					<AlertDialog open={showConfirmDialog} onOpenChange={handleDialogClose}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<div className="flex items-center gap-3">
									<div className="size-10 bg-destructive rounded-full flex items-center justify-center shrink-0">
										<AlertTriangle className="size-5 text-white" />
									</div>
									<div>
										<AlertDialogTitle>
											{isResubmission ? "Confirm Application Resubmission" : "Final Submission"}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{isResubmission
												? "Please review your application details before resubmitting. Once resubmitted, you cannot modify this application."
												: "Are you absolutely sure you want to submit?"}
										</AlertDialogDescription>
									</div>
								</div>
							</AlertDialogHeader>

							<div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10">
								<div className="text-sm text-destructive text-left">
									<p className="font-medium mb-1">Important Notes:</p>
									<ul className="list-disc list-inside space-y-1 text-xs">
										<li key="undo">This action cannot be undone</li>
										<li key="review">Please review all details one final time</li>
										<li key="edit">You won&apos;t be able to edit your application after submission.</li>
									</ul>
								</div>
							</div>

							<AlertDialogFooter className="gap-4 pt-2">
								<AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>

								<AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 size-4 animate-spin" />
											Submitting...
										</>
									) : (
										<>
											<Send className="mr-2 size-4" />
											Yes, Submit Now
										</>
									)}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</>
			)}
		</div>
	);
};

export default ConcessionApplicationForm;
