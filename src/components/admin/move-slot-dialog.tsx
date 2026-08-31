"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { AlertCircle, ArrowRightLeft } from "lucide-react";
import { cn, toTitleCase, formatSlipNumber } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookletTableItem, DamagedPageItem, BookletApplicationItem, StagedSlotInfo } from "@/actions/booklets";

type MoveSlotDialogProps = {
	booklet: {
		totalPages: number;
		serialEndNumber: string;
		serialStartNumber: string;
	};
	isOpen: boolean;
	onClose: () => void;
	allSlots: StagedSlotInfo[];
	sourceSlot: StagedSlotInfo | null;
	onApplyMove: (sourceOffset: number, targetOffset: number, mode: "shift" | "swap") => void;
};

export const MoveSlotDialog = ({
	isOpen,
	onClose,
	booklet,
	allSlots,
	sourceSlot,
	onApplyMove
}: MoveSlotDialogProps) => {
	const [error, setError] = useState<string>("");
	const [targetSlipInput, setTargetSlipInput] = useState<string>("");
	const [moveMode, setMoveMode] = useState<"shift" | "swap">("shift");

	const isDamagedPage = (item: BookletTableItem | null): item is DamagedPageItem => {
		return !!item && "isDamaged" in item && item.isDamaged === true;
	};

	const totalPages = booklet.totalPages || 50;

	const sourceSlipDisplay = useMemo(() => {
		if (!sourceSlot) return "";
		return formatSlipNumber(sourceSlot.offset, booklet.serialStartNumber);
	}, [sourceSlot, booklet.serialStartNumber]);

	const minSlip = formatSlipNumber(0, booklet.serialStartNumber);
	const maxSlip = formatSlipNumber(totalPages - 1, booklet.serialStartNumber);

	const parsedTargetOffset = useMemo(() => {
		const trimmed = targetSlipInput.trim();
		if (!trimmed) return null;

		const inputNum = parseInt(trimmed, 10);
		if (isNaN(inputNum)) return null;

		for (let offset = 0; offset < totalPages; offset++) {
			const slip = formatSlipNumber(offset, booklet.serialStartNumber);
			if (slip === trimmed || parseInt(slip, 10) === inputNum) {
				return offset;
			}
		}

		return null;
	}, [targetSlipInput, totalPages, booklet.serialStartNumber]);

	const targetSlot = useMemo(() => {
		if (parsedTargetOffset === null) return null;
		return allSlots[parsedTargetOffset] || null;
	}, [parsedTargetOffset, allSlots]);

	const sourceCertSerial = useMemo(() => {
		if (!sourceSlot) return "";
		const serialStart = booklet.serialStartNumber;
		const prefix = serialStart.replace(/\d+$/, "");
		const startNum = parseInt(serialStart.match(/\d+$/)?.[0] || "0", 10);
		const certNum = startNum + sourceSlot.offset;
		return `${prefix}${certNum.toString().padStart(serialStart.match(/\d+$/)?.[0]?.length || 3, "0")}`;
	}, [sourceSlot, booklet.serialStartNumber]);

	const sourceItemName = useMemo(() => {
		if (!sourceSlot || !sourceSlot.item) return "Empty Slot";
		if (isDamagedPage(sourceSlot.item)) return "Cancelled";
		const app = sourceSlot.item as BookletApplicationItem;
		const firstLast = [app.student.firstName, app.student.lastName].filter(Boolean).join(" ");
		return toTitleCase(firstLast);
	}, [sourceSlot]);

	const targetItemName = useMemo(() => {
		if (!targetSlot || !targetSlot.item) return "Empty Slot";
		if (isDamagedPage(targetSlot.item)) return "Cancelled";
		const app = targetSlot.item as BookletApplicationItem;
		const firstLast = [app.student.firstName, app.student.lastName].filter(Boolean).join(" ");
		return toTitleCase(firstLast);
	}, [targetSlot]);

	useEffect(() => {
		if (isOpen) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- reset state when dialog opens
			setTargetSlipInput("");
			setMoveMode("shift");
			setError("");
		}
	}, [isOpen, sourceSlot]);

	const handleInputChange = (value: string) => {
		const cleaned = value.replace(/\D/g, "").slice(0, 3);
		setTargetSlipInput(cleaned);
		setError("");
	};

	const validationInfo = useMemo(() => {
		if (!targetSlipInput.trim()) {
			return { isValid: false, message: "" };
		}

		if (parsedTargetOffset === null) {
			return { isValid: false, message: `Please enter a valid slip number (${minSlip} to ${maxSlip})` };
		}

		if (sourceSlot && parsedTargetOffset === sourceSlot.offset) {
			return { isValid: false, message: "Target slip is the same as the current slip" };
		}

		return { isValid: true, message: "" };
	}, [targetSlipInput, parsedTargetOffset, minSlip, maxSlip, sourceSlot]);

	const handleApply = () => {
		if (!sourceSlot || parsedTargetOffset === null || !validationInfo.isValid) return;

		onApplyMove(sourceSlot.offset, parsedTargetOffset, moveMode);
		onClose();
	};

	if (!sourceSlot) return null;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Move Slip Position</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="p-3 bg-muted/40 rounded-lg border grid grid-cols-3 gap-2 text-center items-center">
						<div>
							<div className="text-xs text-muted-foreground">Sr. No.</div>
							<div className="font-normal text-foreground text-sm mt-0.5">{sourceSlipDisplay}</div>
						</div>
						<div>
							<div className="text-xs text-muted-foreground">Certificate</div>
							<div
								title={sourceCertSerial}
								className="font-mono font-semibold text-foreground text-xs sm:text-sm mt-0.5 truncate"
							>
								{sourceCertSerial}
							</div>
						</div>
						<div>
							<div className="text-xs text-muted-foreground">Student Name</div>
							<div
								className={cn(
									"font-semibold text-xs sm:text-sm mt-0.5 truncate",
									isDamagedPage(sourceSlot?.item ?? null) ? "text-destructive" : "text-foreground"
								)}
								title={sourceItemName}
							>
								{sourceItemName}
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="target-slip" className="text-sm font-medium">
							Target Slip Number ({minSlip} to {maxSlip})
						</Label>
						<Input
							autoFocus
							id="target-slip"
							autoComplete="off"
							inputMode="numeric"
							value={targetSlipInput}
							onChange={(e) => handleInputChange(e.target.value)}
							placeholder={`Enter slip no. (${minSlip} to ${maxSlip})`}
							onKeyDown={(e) => {
								if (e.key === "Enter" && validationInfo.isValid) {
									e.preventDefault();
									handleApply();
								}
							}}
							className={cn(
								"font-mono text-center text-sm font-medium h-10 placeholder:text-muted-foreground placeholder:font-normal",
								(error || (targetSlipInput && !validationInfo.isValid)) && "border-destructive"
							)}
						/>
						{targetSlipInput && !validationInfo.isValid && (
							<div className="flex items-center gap-1.5 text-xs text-destructive">
								<AlertCircle className="size-3.5 shrink-0" />
								<span>{validationInfo.message}</span>
							</div>
						)}
					</div>

					{parsedTargetOffset !== null && validationInfo.isValid && (
						<div className="space-y-3 pt-1">
							<div className="space-y-2">
								<Label className="text-sm font-medium text-foreground">Select Reorder Mode</Label>
								<RadioGroup
									value={moveMode}
									className="space-y-2"
									onValueChange={(val) => setMoveMode(val as "shift" | "swap")}
								>
									<div
										onClick={() => setMoveMode("shift")}
										className={cn(
											"flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer select-none",
											moveMode === "shift" ? "border-border bg-muted/40" : "border-border bg-card hover:bg-muted/20"
										)}
									>
										<RadioGroupItem value="shift" id="mode-shift" className="mt-0.5" />
										<div className="space-y-0.5">
											<Label htmlFor="mode-shift" className="text-sm font-medium cursor-pointer text-foreground">
												Shift
											</Label>
											<p className="text-xs text-muted-foreground">
												Inserts {sourceItemName} at #{formatSlipNumber(parsedTargetOffset, booklet.serialStartNumber)}{" "}
												and shifts other entries.
											</p>
										</div>
									</div>

									<div
										onClick={() => setMoveMode("swap")}
										className={cn(
											"flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer select-none",
											moveMode === "swap" ? "border-border bg-muted/40" : "border-border bg-card hover:bg-muted/20"
										)}
									>
										<RadioGroupItem value="swap" id="mode-swap" className="mt-0.5" />
										<div className="space-y-0.5">
											<Label htmlFor="mode-swap" className="text-sm font-medium cursor-pointer text-foreground">
												Swap
											</Label>
											<p className="text-xs text-muted-foreground">
												Swaps #{sourceSlipDisplay} ({sourceItemName}) with #
												{formatSlipNumber(parsedTargetOffset, booklet.serialStartNumber)} ({targetItemName}).
											</p>
										</div>
									</div>
								</RadioGroup>
							</div>

							<div className="p-2.5 bg-muted/20 border border-border/60 rounded-md text-xs space-y-1">
								<div className="font-medium text-foreground">Preview</div>
								<div className="text-muted-foreground">
									{moveMode === "shift" ? (
										<span>
											<strong className="text-foreground font-semibold">{sourceItemName}</strong> moves to #
											{formatSlipNumber(parsedTargetOffset, booklet.serialStartNumber)}
										</span>
									) : (
										<span className="inline-flex items-center gap-2.5 flex-wrap">
											<strong className="text-foreground font-semibold">{sourceItemName}</strong>
											<ArrowRightLeft className="size-3.5 text-muted-foreground shrink-0" />
											<strong className="text-foreground font-semibold">{targetItemName}</strong>
										</span>
									)}
								</div>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="gap-2 sm:gap-2">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleApply} disabled={!validationInfo.isValid}>
						Apply Move
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default MoveSlotDialog;
