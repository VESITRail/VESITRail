"use client";

import {
	Eye,
	Mail,
	Info,
	Send,
	Check,
	Clock,
	FileUp,
	Trash2,
	MapPin,
	Loader2,
	XCircle,
	RefreshCw,
	CheckCircle,
	AlertTriangle,
	ChevronsUpDown,
	type LucideIcon
} from "lucide-react";
import type {
	CloudinaryUploadWidgetInfo,
	CloudinaryUploadWidgetError,
	CloudinaryUploadWidgetResults
} from "next-cloudinary";
import {
	type AddressChangeData,
	StudentAddressAndStation,
	getStudentAddressAndStation,
	submitAddressChangeApplication,
	getLastAddressChangeApplication
} from "@/actions/change-address";
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
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import Status from "@/components/ui/status";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getStations } from "@/actions/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { CldUploadButton } from "next-cloudinary";
import { capitalizeWords, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { deleteCloudinaryFile } from "@/actions/cloudinary";
import { useCallback, useEffect, useState, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DocumentRequirements } from "@/components/ui/document-requirements";
import SlideButton, { type SlideButtonRef } from "@/components/ui/slide-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Station, AddressChange, AddressChangeStatusType } from "@/generated/zod";
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Dialog, DialogTitle, DialogHeader, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Command, CommandList, CommandItem, CommandInput, CommandGroup, CommandEmpty } from "@/components/ui/command";

const AddressChangeSchema = z.object({
	verificationDocUrl: z.string().url(),
	newStationId: z.string().min(1, "Please select a new station"),
	building: z
		.string()
		.min(1, "House / Building is required")
		.max(100, "House / Building cannot exceed 100 characters")
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, "House / Building cannot be empty after trimming"),
	area: z
		.string()
		.min(1, "Area / Locality is required")
		.max(100, "Area / Locality cannot exceed 100 characters")
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, "Area / Locality cannot be empty after trimming"),
	city: z
		.string()
		.min(1, "City is required")
		.max(50, "City cannot exceed 50 characters")
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, "City cannot be empty after trimming"),
	pincode: z
		.string()
		.min(6, "Pincode must be 6 digits")
		.max(6, "Pincode must be 6 digits")
		.regex(/^\d{6}$/, "Pincode must contain only numbers")
});

type AddressChangeForm = z.infer<typeof AddressChangeSchema>;

const StatusBadge = ({ status }: { status: AddressChangeStatusType }) => {
	const variants: Record<AddressChangeStatusType, string> = {
		Rejected: "bg-red-600 text-white",
		Pending: "bg-amber-600 text-white",
		Approved: "bg-green-600 text-white"
	};

	return <Badge className={`${variants[status]} font-medium`}>{status}</Badge>;
};

const AddressChangePage = () => {
	const isMobile = useIsMobile();
	const [open, setOpen] = useState<boolean>(false);
	const { data, isPending } = authClient.useSession();
	const slideButtonRef = useRef<SlideButtonRef>(null);
	const [publicId, setPublicId] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(true);
	const [canApply, setCanApply] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);
	const [isUploading, setIsUploading] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [isVerifying, setIsVerifying] = useState<boolean>(false);
	const [loadingStations, setLoadingStations] = useState<boolean>(true);
	const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

	const [stations, setStations] = useState<Station[]>([]);
	const [student, setStudent] = useState<StudentAddressAndStation | null>(null);
	const [lastApplication, setLastApplication] = useState<
		| (AddressChange & {
				newStation: Station;
				currentStation: Station;
		  })
		| null
	>(null);

	const [status, setStatus] = useState<{
		title: string;
		iconBg?: string;
		icon: LucideIcon;
		iconColor?: string;
		description: string;
		cardClassName?: string;
		iconClassName?: string;
		containerClassName?: string;
		button?: {
			href?: string;
			label: string;
			icon: LucideIcon;
			onClick?: () => void;
		};
	} | null>(null);

	const form = useForm<AddressChangeForm>({
		resolver: zodResolver(AddressChangeSchema),
		defaultValues: {
			city: "",
			area: "",
			pincode: "",
			building: "",
			newStationId: "",
			verificationDocUrl: ""
		}
	});

	const watchedUrl = form.watch("verificationDocUrl");

	useEffect(() => {
		if (watchedUrl) {
			const id = watchedUrl.split("/").pop()?.split(".")[0];
			if (id) {
				setPublicId(`VESITRail/Verification Documents/${id}.pdf`);
			}
		}
	}, [watchedUrl]);

	const fetchStations = async () => {
		setLoadingStations(true);

		try {
			const result = await getStations();

			if (result.isSuccess) {
				setStations(result.data.filter((station: Station) => station.isActive));
			} else {
				toast.error("Stations Not Loading", {
					description: "Unable to load station data. Please try again."
				});
			}
		} catch (error) {
			console.error("Error while loading station data:", error);
			toast.error("Stations Not Loading", {
				description: "Unable to load station data. Please try again."
			});
		} finally {
			setLoadingStations(false);
		}
	};

	const fetchStudentDetails = useCallback(async () => {
		if (isPending || !data?.user?.id) return;

		try {
			const result = await getStudentAddressAndStation(data.user.id);

			if (result.isSuccess) {
				setStudent(result.data);
			} else {
				toast.error("Details Not Loading", {
					description: "Unable to load your student details. Please try again."
				});
			}
		} catch (error) {
			console.error("Error while loading student details:", error);
			toast.error("Details Not Loading", {
				description: "Unable to load your student details. Please try again."
			});
		}
	}, [data?.user?.id, isPending]);

	const checkLastAddressChange = useCallback(async () => {
		if (isPending || !data?.user?.id) return;

		setLoading(true);

		try {
			const result = await getLastAddressChangeApplication(data.user.id);

			if (!result.isSuccess) {
				setCanApply(false);
				setStatus({
					icon: XCircle,
					iconColor: "text-white",
					iconBg: "bg-destructive",
					title: "Error Loading Application",
					description:
						"Unable to fetch your application status. Please try again later or contact support if the issue persists.",
					button: {
						icon: Mail,
						label: "Contact",
						href: "/#contact"
					}
				});
				return;
			}

			const application = result.data as AddressChange & {
				newStation: Station;
				currentStation: Station;
			};
			setLastApplication(application);

			if (!application) {
				setStatus(null);
				setCanApply(true);
			} else {
				switch (application.status) {
					case "Rejected":
						setStatus(null);
						setCanApply(true);
						break;

					case "Pending":
						setCanApply(false);
						setStatus({
							icon: Clock,
							iconBg: "bg-yellow-600",
							iconColor: "text-white",
							title: "Address Change Under Review",
							description:
								"Your address change request is currently being reviewed. Please wait for approval before submitting a new request."
						});
						break;

					case "Approved":
						setStatus(null);
						setCanApply(true);
						break;

					default:
						setStatus(null);
						setCanApply(true);
				}
			}
		} catch (error) {
			console.error("Error while checking application status:", error);

			setCanApply(false);
			setStatus({
				icon: XCircle,
				iconColor: "text-white",
				iconBg: "bg-destructive",
				title: "Error Loading Application",
				description: "An unexpected error occurred while checking your application status. Please try again later."
			});
		} finally {
			setLoading(false);
		}
	}, [data?.user?.id, isPending]);

	useEffect(() => {
		fetchStations();
		fetchStudentDetails();
		checkLastAddressChange();
	}, [data?.user?.id, isPending, fetchStudentDetails, checkLastAddressChange]);

	useEffect(() => {
		if (lastApplication?.status === "Rejected") {
			const addressParts = lastApplication.newAddress.split(", ");
			if (addressParts.length >= 4) {
				const [building, area, city, pincode] = addressParts;

				form.setValue("building", building.trim());
				form.setValue("area", area.trim());
				form.setValue("city", city.trim());
				form.setValue("pincode", pincode.trim());
				form.setValue("newStationId", lastApplication.newStationId);

				const verifyAndSetDocument = async () => {
					if (lastApplication.verificationDocUrl) {
						setIsVerifying(true);

						const verifyToastId = toast.loading("Verifying document...", {
							description: "Please wait while we check your uploaded document."
						});

						try {
							const response = await fetch(lastApplication.verificationDocUrl, {
								method: "HEAD"
							});

							toast.dismiss(verifyToastId);

							if (response.ok) {
								form.setValue("verificationDocUrl", lastApplication.verificationDocUrl);

								const id = lastApplication.verificationDocUrl.split("/").pop()?.split(".")[0];
								if (id) {
									setPublicId(`VESITRail/Verification Documents/${id}.pdf`);
								}

								toast.success("Document verified successfully!", {
									description: "Your previously uploaded document is ready."
								});
							} else {
								console.warn("Verification document URL is no longer valid, clearing from form");
								form.setValue("verificationDocUrl", "");
								setPublicId("");

								toast.warning("Previous document not found", {
									description: "Your previous document is no longer available. Please upload a new one."
								});
							}
						} catch (error) {
							toast.dismiss(verifyToastId);
							console.warn("Could not verify document URL, clearing from form:", error);
							form.setValue("verificationDocUrl", "");
							setPublicId("");

							toast.warning("Document verification failed", {
								description: "Unable to verify your previous document. Please upload a new one."
							});
						} finally {
							setIsVerifying(false);
						}
					}
				};

				verifyAndSetDocument();
			}
		}
	}, [lastApplication, form]);

	useEffect(() => {
		return () => {
			document.body.style.overflow = "auto";
			document.documentElement.style.overflow = "auto";
		};
	}, []);

	const availableStations = stations.filter((station) => station.id !== student?.station.id);

	const handleUploadSuccess = (result: CloudinaryUploadWidgetResults) => {
		try {
			const { public_id, secure_url } = result.info as CloudinaryUploadWidgetInfo;

			setPublicId(public_id);

			form.setValue("verificationDocUrl", secure_url, {
				shouldDirty: true,
				shouldTouch: true,
				shouldValidate: true
			});

			toast.success("Document uploaded successfully!", {
				description: "Your verification document has been uploaded."
			});

			document.body.style.overflow = "auto";
			document.documentElement.style.overflow = "auto";
		} catch (error) {
			console.error("Error while processing uploaded document:", error);
			toast.error("Upload processing failed", {
				description: "Failed to process the uploaded document."
			});
		} finally {
			setIsUploading(false);
		}
	};

	const handleUploadError = (error: CloudinaryUploadWidgetError | null) => {
		setIsUploading(false);

		document.body.style.overflow = "auto";
		document.documentElement.style.overflow = "auto";

		if (error) {
			console.error("Cloudinary upload error:", error);
		} else {
			console.error("Unknown error during Cloudinary upload");
		}

		toast.error("Failed to Upload Document", {
			description: "Please try again with a valid PDF file."
		});
	};

	const handleRemoveFile = async (): Promise<void> => {
		if (!watchedUrl || !publicId) return;

		setIsDeleting(true);

		const deleteToastId = toast.loading("Removing document...", {
			description: "Please wait while we remove your document."
		});

		try {
			const result = await deleteCloudinaryFile(publicId);

			if (result.isSuccess) {
				setPublicId("");
				form.setValue("verificationDocUrl", "", {
					shouldDirty: true,
					shouldTouch: true,
					shouldValidate: true
				});

				toast.dismiss(deleteToastId);
				toast.success("Document removed successfully!", {
					description: "You can now upload a new document."
				});
			} else {
				const errorMessage = result.error?.message || "Unknown error";

				if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
					setPublicId("");
					form.setValue("verificationDocUrl", "", {
						shouldDirty: true,
						shouldTouch: true,
						shouldValidate: true
					});

					toast.dismiss(deleteToastId);
					toast.success("Document cleared successfully!", {
						description: "The file was already removed from storage. You can now upload a new document."
					});
				} else {
					console.error("Cloudinary deletion failed:", errorMessage);
					setPublicId("");
					form.setValue("verificationDocUrl", "", {
						shouldDirty: true,
						shouldTouch: true,
						shouldValidate: true
					});

					toast.dismiss(deleteToastId);
					toast.warning("Document cleared from form", {
						description:
							"There was an issue removing the file from storage, but it has been cleared from your form. You can now upload a new document."
					});
				}
			}
		} catch (error) {
			toast.dismiss(deleteToastId);

			if (error instanceof Error) {
				console.error("Error while deleting Cloudinary file:", error.message);

				if (error.message.includes("not found") || error.message.includes("does not exist")) {
					setPublicId("");
					form.setValue("verificationDocUrl", "", {
						shouldDirty: true,
						shouldTouch: true,
						shouldValidate: true
					});

					toast.success("Document cleared successfully!", {
						description: "The file was already removed from storage. You can now upload a new document."
					});
				} else {
					setPublicId("");
					form.setValue("verificationDocUrl", "", {
						shouldDirty: true,
						shouldTouch: true,
						shouldValidate: true
					});

					toast.warning("Document cleared from form", {
						description:
							"There was an issue removing the file, but it has been cleared from your form. You can now upload a new document."
					});
				}
			} else {
				console.error("Unknown error while deleting Cloudinary file:", error);

				setPublicId("");
				form.setValue("verificationDocUrl", "", {
					shouldDirty: true,
					shouldTouch: true,
					shouldValidate: true
				});

				toast.warning("Document cleared from form", {
					description:
						"An unexpected error occurred, but the document has been cleared from your form. You can now upload a new document."
				});
			}
		} finally {
			setIsDeleting(false);
		}
	};

	const handleCapitalFirstChange = (value: string, onChange: (value: string) => void) => {
		const capitalizedValue = capitalizeWords(value);
		onChange(capitalizedValue);
	};

	const handlePreviewFile = () => {
		if (watchedUrl) {
			window.open(watchedUrl, "_blank");
		}
	};

	const onSubmit = async (formData: AddressChangeForm) => {
		if (!student || !data?.user?.id) {
			toast.error("Information Required", {
				description: "Please fill in all required fields to continue."
			});
			return;
		}

		setIsSubmitting(true);
		setShowConfirmDialog(false);

		if (isMobile) {
			slideButtonRef.current?.showSubmitting();
		}

		const newAddress = `${formData.building.trim()}, ${formData.area.trim()}, ${formData.city.trim()}, ${formData.pincode.trim()}`;

		const submissionData: AddressChangeData = {
			newAddress: newAddress,
			studentId: data.user.id,
			currentAddress: student.address,
			newStationId: formData.newStationId,
			currentStationId: student.station.id,
			verificationDocUrl: formData.verificationDocUrl
		};

		const submitPromise = submitAddressChangeApplication(submissionData);
		const isResubmission = lastApplication?.status === "Rejected";

		toast.promise(submitPromise, {
			loading: isResubmission ? "Resubmitting address change request..." : "Submitting address change request...",
			error: isResubmission ? "Failed to resubmit address change request" : "Failed to submit address change request",
			success: isResubmission
				? "Address change request resubmitted successfully!"
				: "Address change request submitted successfully!"
		});

		try {
			const result = await submitPromise;

			if (result.isSuccess) {
				setCanApply(false);
				setStatus({
					icon: Clock,
					iconBg: "bg-yellow-600",
					iconColor: "text-white",
					title: "Address Change Under Review",
					description:
						"Your address change request is currently being reviewed. Please wait for approval before submitting a new request."
				});
			} else {
				setStatus({
					icon: XCircle,
					iconColor: "text-white",
					iconBg: "bg-destructive",
					title: "Submission Failed",
					description:
						"We couldn't process your address change request at the moment. Please try again or contact support if the issue persists.",
					button: {
						icon: Mail,
						href: "/#contact",
						label: "Contact Support"
					}
				});
			}
		} catch (error) {
			if (error instanceof Error) {
				console.error("Unexpected error:", error.message);
			} else {
				console.error("Unknown error:", error);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDialogClose = (open: boolean) => {
		setShowConfirmDialog(open);
		if (!open && isMobile) {
			slideButtonRef.current?.reset();
		}
	};

	const isFormValid =
		form.watch("newStationId") &&
		form.watch("building")?.trim() &&
		form.watch("area")?.trim() &&
		form.watch("city")?.trim() &&
		form.watch("pincode")?.length === 6 &&
		form.watch("verificationDocUrl") &&
		!form.formState.isSubmitting &&
		!isSubmitting &&
		!isUploading &&
		!isDeleting;

	if (isPending || loading || loadingStations || isVerifying || !student) {
		return (
			<div className="container max-w-5xl mx-auto py-8 px-4">
				<div className="flex w-full gap-4 justify-between items-start">
					<span className="flex items-center gap-3">
						<Skeleton className="size-10" />

						<Skeleton className="h-8 w-48" />
					</span>
					<Skeleton className="size-10 rounded-lg" />
				</div>

				<Separator className="mt-6" />

				<div className="py-6">
					<Skeleton className="h-32 w-full rounded-lg" />
				</div>

				<Card>
					<CardContent className="py-4">
						<div className="space-y-5 md:space-y-7">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-7">
								<div className="space-y-2">
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-10 w-full rounded-md bg-input/30" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-10 w-full rounded-md bg-input/30" />
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-7">
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-10 w-full rounded-md" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-10 w-full rounded-md" />
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-7">
								<div className="space-y-2">
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-10 w-full rounded-md" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-10 w-full rounded-md" />
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-7">
								<div className="space-y-2">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-10 w-full rounded-md" />
								</div>
								<div className="space-y-2"></div>
							</div>

							<div className="space-y-2">
								<Skeleton className="h-5 w-44" />
								<div className="border-2 border-dashed border-border rounded-lg bg-muted/50 p-8">
									<div className="flex flex-col items-center justify-center space-y-3">
										<Skeleton className="size-10 rounded-lg" />
										<Skeleton className="h-4 w-40" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>

								<div className="mt-4 space-y-3">
									<Skeleton className="h-4 w-64" />

									<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
										{[1, 2, 3].map((item) => (
											<div key={item} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
												<div className="shrink-0">
													<Skeleton className="size-8 rounded-md" />
												</div>
												<div className="min-w-0 flex-1 space-y-1">
													<Skeleton className="h-4 w-20" />
													<Skeleton className="h-3 w-16" />
												</div>
											</div>
										))}
									</div>

									<div className="flex flex-wrap gap-2 pt-1">
										<Skeleton className="h-5 w-16 rounded-full" />
										<Skeleton className="h-5 w-12 rounded-full" />
										<Skeleton className="h-5 w-20 rounded-full" />
									</div>
								</div>
							</div>

							<div className="flex justify-end pt-4">
								{isMobile ? (
									<Skeleton className="h-12 w-full rounded-lg" />
								) : (
									<Skeleton className="h-10 w-36 rounded-md" />
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!canApply && status) {
		return (
			<Status
				icon={status.icon}
				title={status.title}
				iconBg={status.iconBg}
				button={status.button}
				iconColor={status.iconColor}
				description={status.description}
				containerClassName="min-h-[88vh]"
				iconClassName={status.iconClassName}
			/>
		);
	}

	return (
		<div className="container max-w-5xl mx-auto py-8 px-4">
			<div className="flex w-full gap-4 justify-between items-start">
				<span className="flex items-center gap-3">
					<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
						<MapPin className="size-5" />
					</div>
					<h1 className="text-2xl font-semibold">Change Address</h1>
				</span>

				<Popover>
					<PopoverTrigger asChild>
						<Button size="icon" variant="outline" className="size-10">
							<Info className="size-5" />
						</Button>
					</PopoverTrigger>

					<PopoverContent align="end" side="bottom" className="text-sm bg-background">
						<p className="font-medium mb-4">Important Information</p>
						<ul className="list-disc pl-5 space-y-1 text-muted-foreground">
							<li>Upload any one of the accepted verification documents</li>
							<li>Ensure new address details are accurate</li>
							<li>Changes require admin approval</li>
						</ul>
					</PopoverContent>
				</Popover>
			</div>

			<Separator className="my-6" />

			{lastApplication?.status === "Rejected" && (
				<div className="pb-6">
					<div className="bg-card border border-border rounded-lg py-6 pl-2 pr-6 md:p-6 shadow-sm">
						<div className="flex items-start gap-4">
							<div className="shrink-0">
								<div className="size-9 hidden bg-destructive rounded-full md:flex items-center justify-center">
									<AlertTriangle className="size-4.5 text-white" />
								</div>
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-3 mb-2">
									<h3 className="text-base font-semibold">Request Rejected</h3>

									{lastApplication.submissionCount && lastApplication.submissionCount > 1 && (
										<span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-xs font-medium rounded-full">
											<RefreshCw className="size-3" />
											Attempt #{lastApplication.submissionCount}
										</span>
									)}
								</div>

								<div className="space-y-3">
									{lastApplication.rejectionReason ? (
										<div className="space-y-2 mt-3">
											<div className="p-4 bg-muted/50 rounded-md border-l-4 border-muted-foreground/20">
												<div className="flex items-start gap-2">
													<span className="text-sm font-medium text-foreground">Reason:</span>
													<span className="text-sm text-foreground">{lastApplication.rejectionReason}</span>
												</div>
											</div>

											<div className="flex items-start gap-2 text-sm text-muted-foreground">
												<span>Please review the feedback above and update your application accordingly.</span>
											</div>
										</div>
									) : (
										<div className="space-y-2">
											<p className="text-sm text-muted-foreground">
												Your previous address change request was rejected. Please review and correct your details before
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

			{lastApplication?.status === "Approved" && (
				<Alert className="mb-6 flex flex-col gap-1">
					<div className="flex w-full flex-col gap-4 md:flex-row md:justify-between md:items-center">
						<div className="flex items-start justify-center gap-2">
							<CheckCircle className="size-7 md:size-5 lg:size-4 mt-0.5 text-green-600" />

							<div>
								<AlertTitle>Previous Request Approved</AlertTitle>
								<AlertDescription>
									Your previous address change was approved. You can submit a new request if needed.
								</AlertDescription>
							</div>
						</div>

						{lastApplication && (
							<Dialog>
								<DialogTrigger asChild>
									<Button
										size="sm"
										variant="outline"
										className="h-8 text-foreground border-muted-foreground/20 hover:border-muted-foreground/40 w-fit"
									>
										<Eye className="size-4 mr-2" />
										View Details
									</Button>
								</DialogTrigger>

								<DialogContent className="sm:max-w-lg">
									<DialogHeader>
										<DialogTitle>Previous Request Details</DialogTitle>
									</DialogHeader>

									<Separator className="my-2" />

									<div className="space-y-6">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-1">
												<p className="text-sm font-medium text-muted-foreground">Status</p>
												<StatusBadge status={lastApplication.status} />
											</div>

											<div className="space-y-1">
												<p className="text-sm font-medium text-muted-foreground">Applied Date</p>
												<p className="font-medium text-foreground/90">
													{format(new Date(lastApplication.createdAt), "MMMM dd, yyyy")}
												</p>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<p className="text-sm font-medium text-muted-foreground mb-1">From</p>
												<p className="font-medium text-foreground/90">
													{lastApplication.currentStation.name} ({lastApplication.currentStation.code})
												</p>
												<p className="text-sm text-muted-foreground">{lastApplication.currentAddress}</p>
											</div>
											<div>
												<p className="text-sm font-medium text-muted-foreground mb-1">To</p>
												<p className="font-medium text-foreground/90">
													{lastApplication.newStation.name} ({lastApplication.newStation.code})
												</p>
												<p className="text-sm text-muted-foreground">{lastApplication.newAddress}</p>
											</div>
										</div>
									</div>
								</DialogContent>
							</Dialog>
						)}
					</div>
				</Alert>
			)}

			<Form {...form}>
				<form
					className="space-y-5 md:space-y-7"
					onSubmit={form.handleSubmit(() => {
						if (!isMobile) {
							setShowConfirmDialog(true);
						}
					})}
				>
					<Card>
						<CardContent className="py-4">
							<div className="space-y-5 md:space-y-7">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-7">
									<div className="space-y-2">
										<Label className="text-sm font-medium">Current Station</Label>
										<div className="flex text-sm items-center justify-between h-10 px-3 bg-input/30 rounded-md border border-border">
											{student.station.name} ({student.station.code})
										</div>
									</div>

									<div className="space-y-2">
										<Label className="text-sm font-medium">Current Address</Label>
										<div className="flex text-sm items-center justify-between h-10 px-3 bg-input/30 rounded-md border border-border">
											<span className="truncate">{student.address}</span>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-7">
									<FormField
										name="newStationId"
										control={form.control}
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel className="text-sm font-medium">
													New Station <span className="text-destructive">*</span>
												</FormLabel>

												<Popover open={open} onOpenChange={setOpen}>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																role="combobox"
																variant="outline"
																aria-expanded={open}
																disabled={loadingStations}
																className={cn(
																	"w-full justify-between h-10 px-3 py-2 text-left font-normal",
																	!field.value && "text-muted-foreground",
																	loadingStations && "opacity-50 cursor-not-allowed"
																)}
															>
																<span className="truncate">
																	{field.value
																		? (() => {
																				const selectedStation = availableStations.find(
																					(station) => station.id === field.value
																				);
																				return selectedStation
																					? `${selectedStation.name} (${selectedStation.code})`
																					: "Select station...";
																			})()
																		: "Select station..."}
																</span>
																{loadingStations ? (
																	<Loader2 className="size-4 animate-spin shrink-0" />
																) : (
																	<ChevronsUpDown className="size-4 shrink-0 opacity-50" />
																)}
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent align="start" className="p-0 w-full min-w-[--radix-popover-trigger-width]">
														<Command>
															<CommandInput className="h-9" placeholder="Search by name or code" />
															<CommandList>
																<CommandEmpty>No station found.</CommandEmpty>
																<CommandGroup>
																	{availableStations.map((station) => (
																		<CommandItem
																			key={station.id}
																			value={`${station.name} (${station.code})`}
																			onSelect={() => {
																				form.setValue("newStationId", station.id, {
																					shouldDirty: true,
																					shouldTouch: true,
																					shouldValidate: true
																				});

																				setOpen(false);
																			}}
																			className="cursor-pointer"
																		>
																			<Check
																				className={cn(
																					"mr-2 size-4 shrink-0",
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

									<FormField
										control={form.control}
										name="building"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel className="text-sm font-medium">
													House / Building <span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														className="h-10"
														autoComplete="off"
														placeholder="House No., Flat No., Building name"
														onChange={(e) => handleCapitalFirstChange(e.target.value, field.onChange)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-7">
									<FormField
										control={form.control}
										name="area"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel className="text-sm font-medium">
													Area / Locality <span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														className="h-10"
														autoComplete="off"
														placeholder="Enter your area / locality"
														onChange={(e) => handleCapitalFirstChange(e.target.value, field.onChange)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="city"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel className="text-sm font-medium">
													City <span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														className="h-10"
														autoComplete="off"
														placeholder="Enter your city"
														onChange={(e) => handleCapitalFirstChange(e.target.value, field.onChange)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-7">
									<FormField
										control={form.control}
										name="pincode"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel className="text-sm font-medium">
													Pincode <span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														type="text"
														maxLength={6}
														className="h-10"
														autoComplete="off"
														placeholder="Enter your pincode"
														onChange={(e) => {
															const value = e.target.value.replace(/\D/g, "");
															field.onChange(value);
														}}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="space-y-2"></div>
								</div>

								<FormField
									control={form.control}
									name="verificationDocUrl"
									render={() => {
										const formValues = form.watch();
										const isNewStationSelected = !!formValues.newStationId;
										const isAddressComplete =
											!!formValues.building?.trim() &&
											!!formValues.area?.trim() &&
											!!formValues.city?.trim() &&
											formValues.pincode?.length === 6;

										const canUpload = isNewStationSelected && isAddressComplete;

										return (
											<FormItem>
												<FormLabel className="text-base space-y-1 mb-2">
													Verification Document <span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<div className="flex flex-col items-center justify-center w-full">
														{!watchedUrl ? (
															<div
																className={cn(
																	"border-2 border-dashed rounded-lg",
																	"flex flex-col items-center justify-center w-full h-48",
																	"bg-muted/50 transition-colors duration-200 relative",
																	!canUpload ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/80",
																	isUploading && "pointer-events-none opacity-50"
																)}
															>
																<div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
																	{isUploading ? (
																		<>
																			<Loader2 className="h-10 w-10 mb-3 animate-spin text-primary" />
																			<p className="mb-2 text-base text-foreground font-semibold">Uploading...</p>
																			<p className="text-sm text-muted-foreground">
																				Please wait while we upload your document
																			</p>
																		</>
																	) : !canUpload ? (
																		<>
																			<FileUp className="h-10 w-10 mb-3 text-muted-foreground" />
																			<p className="mb-2 text-sm text-foreground font-semibold">
																				Complete address details first
																			</p>
																			<p className="text-xs text-muted-foreground">
																				Please select a new station and fill all address fields
																			</p>
																		</>
																	) : (
																		<>
																			<FileUp className="h-10 w-10 mb-3 text-muted-foreground" />
																			<p className="mb-2 text-sm text-foreground font-semibold">Click to upload PDF</p>
																			<p className="text-xs text-muted-foreground">PDF (MAX. 2MB)</p>
																		</>
																	)}
																</div>
																{!isUploading && canUpload && (
																	<CldUploadButton
																		onError={handleUploadError}
																		onSuccess={handleUploadSuccess}
																		onUpload={() => setIsUploading(true)}
																		className="absolute inset-0 cursor-pointer opacity-0 z-10"
																		options={{
																			maxFiles: 1,
																			resourceType: "raw",
																			maxFileSize: 2097152,
																			clientAllowedFormats: ["pdf"],
																			folder: "VESITRail/Verification Documents",
																			uploadPreset: "VESITRail_Verification_Documents",
																			publicId: `${data?.user.id}-${formValues.newStationId}.pdf`
																		}}
																	/>
																)}
															</div>
														) : (
															<div className="w-full space-y-4">
																<div className="border-2 border-solid border-border rounded-lg bg-muted/50 p-4">
																	<div className="flex flex-wrap items-start gap-4">
																		<div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
																			<FileUp className="size-5" />
																		</div>

																		<div className="min-w-0 flex-1 space-y-1">
																			<p className="text-sm font-medium text-foreground wrap-wrap-break-word">
																				Address Change Verification Document
																			</p>
																			<p className="text-xs text-muted-foreground break-all">
																				{data?.user.id}-{formValues.newStationId}.pdf
																			</p>
																		</div>

																		<div className="flex gap-2 shrink-0">
																			<Button
																				size="sm"
																				type="button"
																				variant="outline"
																				className="size-8 p-0"
																				title="Preview document"
																				onClick={handlePreviewFile}
																			>
																				<Eye className="size-4" />
																				<span className="sr-only">Preview</span>
																			</Button>
																		</div>
																	</div>
																</div>

																<div className="w-full border-2 border-dashed border-border rounded-lg bg-accent/10 p-4">
																	<div className="flex flex-wrap items-center gap-4">
																		<div className="min-w-0 flex-1">
																			<p className="text-sm font-medium text-foreground wrap-wrap-break-word">
																				Want to upload a different document?
																			</p>
																			<p className="text-xs text-muted-foreground mt-1">
																				Remove the current document to upload a new one
																			</p>
																		</div>

																		<Button
																			size="sm"
																			type="button"
																			variant="outline"
																			onClick={handleRemoveFile}
																			className="shrink-0 gap-2"
																			disabled={isDeleting || isUploading}
																		>
																			{isDeleting ? (
																				<>
																					<Loader2 className="size-4 animate-spin" />
																					<span className="hidden md:inline">Removing...</span>
																				</>
																			) : (
																				<>
																					<Trash2 className="size-4" />
																					<span className="hidden md:inline">Remove</span>
																				</>
																			)}
																		</Button>
																	</div>
																</div>
															</div>
														)}
													</div>
												</FormControl>

												{!watchedUrl && (
													<div className="mt-4">
														<DocumentRequirements />
													</div>
												)}

												<FormMessage />
											</FormItem>
										);
									}}
								/>

								<div className="flex justify-end pt-4">
									{isMobile ? (
										<SlideButton
											fullWidth
											ref={slideButtonRef}
											text={
												lastApplication?.status === "Rejected" ? "Slide to resubmit request" : "Slide to submit request"
											}
											loadingText={lastApplication?.status === "Rejected" ? "Resubmitting..." : "Submitting..."}
											onSlideComplete={() => {
												setShowConfirmDialog(true);
											}}
											disabled={!isFormValid}
											isSubmitting={isSubmitting}
											isLoading={loadingStations || isVerifying}
										/>
									) : (
										<Button type="submit" className="min-w-32" disabled={!isFormValid || isSubmitting}>
											{isSubmitting ? (
												<>
													<Loader2 className="size-4 mr-2 animate-spin" />
													{lastApplication?.status === "Rejected" ? "Resubmitting..." : "Submitting..."}
												</>
											) : (
												<>
													<Send className="size-4 mr-2" />
													{lastApplication?.status === "Rejected" ? "Resubmit Request" : "Submit Request"}
												</>
											)}
										</Button>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</form>
			</Form>

			<AlertDialog open={showConfirmDialog} onOpenChange={handleDialogClose}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<div className="flex items-center gap-3">
							<div className="hidden size-10 sm:size-12 bg-destructive rounded-full md:flex items-center justify-center shrink-0">
								<AlertTriangle className="size-4 sm:size-5 text-white" />
							</div>
							<div className="flex-1 min-w-0">
								<AlertDialogTitle className="text-left">
									{lastApplication?.status === "Rejected"
										? "Confirm Address Change Resubmission"
										: "Confirm Address Change Request"}
								</AlertDialogTitle>
								<AlertDialogDescription className="text-left mt-1">
									Please review your address change details before{" "}
									{lastApplication?.status === "Rejected" ? "resubmitting" : "submitting"}. Once{" "}
									{lastApplication?.status === "Rejected" ? "resubmitted" : "submitted"}, you cannot modify this
									request.
								</AlertDialogDescription>
							</div>
						</div>
					</AlertDialogHeader>

					<div className="space-y-4">
						<div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left">
							<div className="grid grid-cols-1 gap-3">
								<div>
									<p className="text-sm font-medium text-muted-foreground">Current Station</p>
									<p className="font-medium">
										{student?.station.name} ({student?.station.code})
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-muted-foreground">New Station</p>
									<p className="font-medium">
										{(() => {
											const selectedStation = stations.find((station) => station.id === form.getValues("newStationId"));
											return selectedStation ? `${selectedStation.name} (${selectedStation.code})` : "N/A";
										})()}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-muted-foreground">New Address</p>
									<p className="font-medium">
										{(() => {
											const formValues = form.getValues();
											return `${formValues.building}, ${formValues.area}, ${formValues.city}, ${formValues.pincode}`;
										})()}
									</p>
								</div>
							</div>
						</div>

						<div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10">
							<div className="text-sm text-destructive text-left">
								<p className="font-medium mb-1">Important Notes:</p>
								<ul className="list-disc list-inside space-y-1 text-xs">
									<li>This request will be reviewed by admins</li>
									<li>You will be notified once a decision is made</li>
									<li>Ensure all information is accurate before submitting</li>
								</ul>
							</div>
						</div>
					</div>
					<AlertDialogFooter className="gap-4">
						<AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={isSubmitting}
							onClick={() => {
								const formData = form.getValues();
								onSubmit(formData);
							}}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="size-4 mr-2 animate-spin" />
									{lastApplication?.status === "Rejected" ? "Resubmitting..." : "Submitting..."}
								</>
							) : (
								<>
									<Send className="size-4 mr-2" />
									{lastApplication?.status === "Rejected" ? "Resubmit Request" : "Submit Request"}
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default AddressChangePage;
