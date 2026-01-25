"use client";

import type { z } from "zod";
import { toast } from "sonner";
import posthog from "posthog-js";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteR2File, getUploadUrl } from "@/actions/r2";
import { FileUp, Loader2, Eye, Trash2 } from "lucide-react";
import { DocumentSchema } from "@/lib/validations/onboarding";
import { OnboardingSchema } from "@/lib/validations/onboarding";
import { DocumentRequirements } from "@/components/ui/document-requirements";
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

type DocumentProps = {
	errors?: Record<string, string>;
	defaultValues?: z.infer<typeof OnboardingSchema>;
	setFormData: (data: z.infer<typeof OnboardingSchema>) => void;
};

const Document = ({ errors, setFormData, defaultValues }: DocumentProps) => {
	const session = authClient.useSession();
	const [fileKey, setFileKey] = useState<string>("");
	const [isDeleting, setIsDeleting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);

	const form = useForm<z.infer<typeof DocumentSchema>>({
		resolver: zodResolver(DocumentSchema),
		defaultValues: {
			verificationDocUrl: defaultValues?.verificationDocUrl || ""
		}
	});

	useEffect(() => {
		if (defaultValues?.verificationDocUrl) {
			const documentUrl = defaultValues.verificationDocUrl;
			const urlParts = documentUrl.split("/");
			const fileName = urlParts[urlParts.length - 1];
			setFileKey(fileName);

			form.reset({
				verificationDocUrl: defaultValues.verificationDocUrl
			});
		}
	}, [defaultValues?.verificationDocUrl, form]);

	const watchedUrl = form.watch("verificationDocUrl");

	useEffect(() => {
		if (errors) {
			Object.entries(errors).forEach(([key, value]) => {
				form.setError(key as keyof z.infer<typeof DocumentSchema>, {
					type: "manual",
					message: value
				});
			});
		}
	}, [errors, form]);

	const onSubmit = (data: z.infer<typeof DocumentSchema>) => {
		if (defaultValues) {
			setFormData({
				...defaultValues,
				...data
			});
		} else {
			setFormData({
				...data,
				year: "",
				class: "",
				branch: "",
				station: "",
				address: "",
				lastName: "",
				firstName: "",
				middleName: "",
				gender: "Male",
				dateOfBirth: "",
				preferredConcessionClass: "",
				preferredConcessionPeriod: ""
			});
		}
	};

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (file.type !== "application/pdf") {
			toast.error("Invalid file type", {
				description: "Please upload a PDF file."
			});
			return;
		}

		if (file.size > 5242880) {
			toast.error("File too large", {
				description: "Please upload a file smaller than 5MB."
			});
			return;
		}

		setIsUploading(true);
		posthog.capture("document_upload_started");

		const uploadToastId = toast.loading("Uploading document...", {
			description: "Please wait while we upload your document."
		});

		try {
			const result = await getUploadUrl(file.type);

			if (!result.isSuccess) {
				throw new Error(result.error.message);
			}

			const { uploadUrl, fileUrl, key } = result.data;

			const uploadResponse = await fetch(uploadUrl, {
				body: file,
				method: "PUT"
			});

			if (!uploadResponse.ok) {
				throw new Error("Failed to upload file");
			}

			setFileKey(key);
			form.clearErrors("verificationDocUrl");
			form.setValue("verificationDocUrl", fileUrl, {
				shouldDirty: true,
				shouldTouch: true,
				shouldValidate: true
			});

			onSubmit({ verificationDocUrl: fileUrl });

			posthog.capture("document_upload_success", {
				file_size: file.size,
				file_type: file.type
			});

			toast.dismiss(uploadToastId);
			toast.success("Document uploaded successfully!", {
				description: "Your verification document has been uploaded."
			});
		} catch (error) {
			console.error("Upload error:", error);
			posthog.capture("document_upload_failed", {
				error: error instanceof Error ? error.message : "Unknown error"
			});
			toast.dismiss(uploadToastId);
			toast.error("Failed to upload document", {
				description: "Please try again with a valid PDF file."
			});
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleRemoveFile = async () => {
		if (!watchedUrl || !fileKey) return;

		setIsDeleting(true);

		const deleteToastId = toast.loading("Removing document...", {
			description: "Please wait while we remove your document."
		});

		try {
			const result = await deleteR2File(fileKey);

			if (result.isSuccess) {
				setFileKey("");
				form.setValue("verificationDocUrl", "");

				if (defaultValues) {
					setFormData({
						...defaultValues,
						verificationDocUrl: ""
					});
				} else {
					setFormData({
						year: "",
						class: "",
						branch: "",
						station: "",
						address: "",
						lastName: "",
						firstName: "",
						middleName: "",
						gender: "Male",
						dateOfBirth: "",
						verificationDocUrl: "",
						preferredConcessionClass: "",
						preferredConcessionPeriod: ""
					});
				}

				posthog.capture("document_deleted");

				toast.dismiss(deleteToastId);
				toast.success("Document removed successfully!", {
					description: "You can now upload a new document."
				});
			} else {
				const errorMessage = result.error?.message || "Unknown error";

				if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
					setFileKey("");
					form.setValue("verificationDocUrl", "");

					if (defaultValues) {
						setFormData({
							...defaultValues,
							verificationDocUrl: ""
						});
					} else {
						setFormData({
							year: "",
							class: "",
							branch: "",
							station: "",
							address: "",
							lastName: "",
							firstName: "",
							middleName: "",
							gender: "Male",
							dateOfBirth: "",
							verificationDocUrl: "",
							preferredConcessionClass: "",
							preferredConcessionPeriod: ""
						});
					}

					toast.dismiss(deleteToastId);
					toast.success("Document cleared successfully!", {
						description: "The file was already removed from storage. You can now upload a new document."
					});
				} else {
					console.error("R2 deletion failed:", errorMessage);

					setFileKey("");
					form.setValue("verificationDocUrl", "");

					if (defaultValues) {
						setFormData({
							...defaultValues,
							verificationDocUrl: ""
						});
					} else {
						setFormData({
							year: "",
							class: "",
							branch: "",
							station: "",
							address: "",
							lastName: "",
							firstName: "",
							middleName: "",
							gender: "Male",
							dateOfBirth: "",
							verificationDocUrl: "",
							preferredConcessionClass: "",
							preferredConcessionPeriod: ""
						});
					}

					toast.dismiss(deleteToastId);
					toast.warning("Document cleared from form", {
						description:
							"There was an issue removing the file from storage, but it has been cleared from your form. You can now upload a new document."
					});
				}
			}
		} catch (error) {
			toast.dismiss(deleteToastId);
			console.error("Error while deleting R2 file:", error);

			setFileKey("");
			form.setValue("verificationDocUrl", "");

			if (defaultValues) {
				setFormData({
					...defaultValues,
					verificationDocUrl: ""
				});
			} else {
				setFormData({
					year: "",
					class: "",
					branch: "",
					station: "",
					address: "",
					lastName: "",
					firstName: "",
					middleName: "",
					gender: "Male",
					dateOfBirth: "",
					verificationDocUrl: "",
					preferredConcessionClass: "",
					preferredConcessionPeriod: ""
				});
			}

			toast.warning("Document cleared from form", {
				description:
					"An unexpected error occurred, but the document has been cleared from your form. You can now upload a new document."
			});
		} finally {
			setIsDeleting(false);
		}
	};

	const handlePreviewFile = () => {
		if (watchedUrl) {
			window.open(watchedUrl, "_blank", "noopener,noreferrer");
		}
	};

	if (session.isPending) {
		return (
			<div className="space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-5 w-40" />
					<div className="border-2 border-dashed rounded-lg p-8">
						<div className="flex flex-col items-center justify-center space-y-4">
							<Skeleton className="h-10 w-10 rounded-full" />
							<div className="space-y-2 text-center">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
					</div>

					<div className="mt-4 space-y-4">
						<div className="border rounded-lg p-4 space-y-3">
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-4 rounded-full" />
								<Skeleton className="h-5 w-48" />
							</div>
							<Skeleton className="h-16 w-full rounded-md" />
						</div>

						<div className="border rounded-lg p-4 space-y-3">
							<Skeleton className="h-4 w-32" />
							<div className="flex items-start gap-3 p-3 rounded-md">
								<Skeleton className="size-10 rounded-lg" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-3 w-32" />
								</div>
							</div>
						</div>

						<div className="border rounded-lg p-4 space-y-3">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-full" />
							<div className="space-y-2">
								<div className="flex items-start gap-3 p-3 rounded-md">
									<Skeleton className="size-10 rounded-lg" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-28" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
								<div className="flex items-start gap-3 p-3 rounded-md">
									<Skeleton className="size-10 rounded-lg" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-28" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="verificationDocUrl"
					render={() => (
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
												"bg-muted/50 hover:bg-muted/80 transition-colors duration-200 relative",
												isUploading && "pointer-events-none opacity-50"
											)}
										>
											<div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
												{isUploading ? (
													<>
														<Loader2 className="h-10 w-10 mb-3 animate-spin text-primary" />
														<p className="mb-2 text-base text-foreground font-semibold">Uploading...</p>
														<p className="text-sm text-muted-foreground">Please wait while we upload your document</p>
													</>
												) : (
													<>
														<FileUp className="h-10 w-10 mb-3 text-muted-foreground" />
														<p className="mb-2 text-sm text-foreground font-semibold">Click to upload PDF</p>
														<p className="text-xs text-muted-foreground">PDF (MAX. 5MB)</p>
													</>
												)}
											</div>
											{!isUploading && (
												<>
													<input
														type="file"
														ref={fileInputRef}
														accept="application/pdf"
														onChange={handleFileSelect}
														className="absolute inset-0 cursor-pointer opacity-0"
													/>
												</>
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
														<p className="text-sm font-medium text-foreground wrap-break-word">
															Document uploaded successfully
														</p>
														<p className="text-xs text-muted-foreground break-all" title={fileKey}>
															{fileKey}
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
														<p className="text-sm font-medium text-foreground wrap-break-word">
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
					)}
				/>
			</form>
		</Form>
	);
};

export default Document;
