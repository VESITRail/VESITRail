"use client";

import {
	AlertDialog,
	AlertDialogTitle,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogContent,
	AlertDialogDescription
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Phone, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStudentMobileNumber } from "@/actions/update-mobile";
import { Form, FormItem, FormField, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { MobileNumberSchema, type MobileNumberInput } from "@/lib/validations/onboarding/personal-info";

type MobileNumberModalProps = {
	onSuccess: () => void;
};

const MobileNumberModal = ({ onSuccess }: MobileNumberModalProps) => {
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const form = useForm<MobileNumberInput>({
		mode: "onTouched",
		resolver: zodResolver(MobileNumberSchema),
		defaultValues: {
			mobileNumber: ""
		}
	});

	const mobileNumber = form.watch("mobileNumber");

	const onSubmit = async (values: MobileNumberInput) => {
		setIsSubmitting(true);
		try {
			const result = await updateStudentMobileNumber(values.mobileNumber);

			if (result.isSuccess) {
				toast.success("Mobile Number Saved", {
					description: "Your mobile number has been updated successfully."
				});
				onSuccess();
			} else {
				toast.error("Failed to Save", {
					description: result.error.message || "Could not update mobile number. Please try again."
				});
			}
		} catch (error) {
			toast.error("Error", {
				description: "An unexpected error occurred. Please try again."
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AlertDialog open={true}>
			<AlertDialogContent className="sm:max-w-md">
				<AlertDialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center size-10 rounded-full bg-primary shrink-0">
							<Phone className="size-5 text-white" />
						</div>

						<div>
							<AlertDialogTitle className="text-base sm:text-lg font-semibold text-foreground">
								One Quick Thing!
							</AlertDialogTitle>
							<AlertDialogDescription className="text-sm text-muted-foreground mt-0.5">
								Sorry to interrupt, but we need your mobile number for our records.
							</AlertDialogDescription>
						</div>
					</div>
				</AlertDialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
						<FormField
							name="mobileNumber"
							control={form.control}
							render={({ field }) => (
								<FormItem className="space-y-1.5">
									<FormLabel className="block">
										Mobile Number <span className="text-destructive">*</span>
									</FormLabel>

									<FormControl>
										<Input
											{...field}
											type="tel"
											maxLength={10}
											autoComplete="tel"
											inputMode="numeric"
											aria-describedby="mobile-number-error"
											placeholder="Enter 10-digit mobile number"
											onChange={(e) => {
												const sanitized = e.target.value.replace(/\D/g, "");
												field.onChange(sanitized);
											}}
										/>
									</FormControl>

									<FormMessage id="mobile-number-error" className="text-sm" />
								</FormItem>
							)}
						/>

						<AlertDialogFooter className="pt-1">
							<Button
								type="submit"
								className="w-full sm:w-auto"
								disabled={isSubmitting || !mobileNumber || mobileNumber.trim().length === 0}
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Saving...
									</>
								) : (
									"Save and Continue"
								)}
							</Button>
						</AlertDialogFooter>
					</form>
				</Form>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default MobileNumberModal;
