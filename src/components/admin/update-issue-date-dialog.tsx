"use client";

import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import { AdminApplication } from "@/actions/concession";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogTitle, DialogFooter, DialogHeader, DialogContent } from "@/components/ui/dialog";

type UpdateIssueDateDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	application: AdminApplication | null;
	onUpdateDate: (applicationId: string, newDate: Date) => Promise<void>;
};

export const UpdateIssueDateDialog: React.FC<UpdateIssueDateDialogProps> = ({
	isOpen,
	onClose,
	onUpdateDate,
	application
}) => {
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

	const currentVoucherInfo = useMemo(() => {
		if (!application) return null;
		const booklet = application.concessionBooklet;
		const pageOffset = application.pageOffset;

		if (!booklet || pageOffset === null || pageOffset === undefined) {
			return null;
		}

		const serialStart = booklet.serialStartNumber;
		const prefix = serialStart.replace(/\d+$/, "");
		const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
		const paddingLength = serialStart.match(/\d+$/)?.[0]?.length || 2;
		const certNum = startNum + pageOffset;
		const certSerial = `${prefix}${certNum.toString().padStart(paddingLength, "0")}`;

		return {
			certSerial,
			bookletNumber: booklet.bookletNumber
		};
	}, [application]);

	const handleClose = () => {
		setIsDatePickerOpen(false);
		setSelectedDate(new Date());
		onClose();
	};

	const handleSubmit = async () => {
		if (!application || !selectedDate) return;

		setIsSubmitting(true);
		try {
			await onUpdateDate(application.id, selectedDate);
			handleClose();
		} catch (error) {
			console.error("Error updating issue date:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Update Issue Date</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{application && (
						<div className="space-y-2">
							<div className="text-sm font-medium">Application Details</div>
							<div className="p-4 bg-muted/30 rounded-lg border space-y-3">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<div className="text-xs text-muted-foreground mb-1">Application ID</div>
										<div className="font-mono text-sm">#{application.shortId}</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Student</div>
										<div className="text-sm font-medium truncate">
											{[application.student.firstName, application.student.middleName, application.student.lastName]
												.filter(Boolean)
												.join(" ")}
										</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Current Voucher</div>
										<div className="font-mono text-sm font-medium">
											{currentVoucherInfo ? currentVoucherInfo.certSerial : "N/A"}
										</div>
									</div>
									<div>
										<div className="text-xs text-muted-foreground mb-1">Current Issue Date</div>
										<div className="text-sm font-medium">
											{application.issuedAt ? format(new Date(application.issuedAt), "MMMM d, yyyy") : "N/A"}
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="new-issue-date" className="text-sm font-medium">
							New Issue Date
						</Label>
						<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									id="new-issue-date"
									disabled={isSubmitting}
									className="w-full justify-start text-left font-normal h-10"
								>
									<CalendarIcon className="mr-2 size-4" />
									{selectedDate ? format(selectedDate, "MMMM d, yyyy") : <span>Pick a date</span>}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<CustomCalendar
									fromYear={2020}
									selected={selectedDate}
									toYear={new Date().getFullYear() + 1}
									onSelect={(date) => {
										if (date) {
											setSelectedDate(date);
											setIsDatePickerOpen(false);
										}
									}}
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				<DialogFooter className="gap-2 pt-2">
					<Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting || !selectedDate}>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Updating Date...
							</>
						) : (
							"Update Issue Date"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default UpdateIssueDateDialog;
