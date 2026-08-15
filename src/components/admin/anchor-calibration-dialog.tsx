"use client";

import {
	Dialog,
	DialogTitle,
	DialogFooter,
	DialogHeader,
	DialogContent,
	DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { BookletItem, updateBookletAnchorCoordinates } from "@/actions/booklets";
import { generateSampleOverlayPDF } from "@/actions/generate-sample-overlay-pdf";
import { Minus, Plus, RotateCcw, Loader2, FileDown, Save, Crosshair } from "lucide-react";

type AnchorCalibrationDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	booklet: BookletItem | null;
	onAnchorUpdate?: (bookletId: string, anchorX: number, anchorY: number) => void;
};

const AnchorCalibrationDialog: React.FC<AnchorCalibrationDialogProps> = ({
	isOpen,
	onClose,
	booklet,
	onAnchorUpdate
}) => {
	const [originalX, setOriginalX] = useState<number>(0);
	const [originalY, setOriginalY] = useState<number>(0);
	const [adjustedX, setAdjustedX] = useState<number>(0);
	const [adjustedY, setAdjustedY] = useState<number>(0);
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const [isUpdating, setIsUpdating] = useState<boolean>(false);

	useEffect(() => {
		if (isOpen && booklet) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- This effect is triggered when the dialog opens and the booklet is available. It sets the original and adjusted coordinates based on the booklet's anchor values.
			setOriginalX(booklet.anchorX);
			setOriginalY(booklet.anchorY);
			setAdjustedX(booklet.anchorX);
			setAdjustedY(booklet.anchorY);
		}
	}, [isOpen, booklet]);

	const handleClose = useCallback(() => {
		setAdjustedX(originalX);
		setAdjustedY(originalY);
		setIsGenerating(false);
		setIsUpdating(false);
		onClose();
	}, [originalX, originalY, onClose]);

	const handleReset = useCallback(() => {
		setAdjustedX(originalX);
		setAdjustedY(originalY);
	}, [originalX, originalY]);

	const handleAdjustX = useCallback((delta: number) => {
		setAdjustedX((prev) => {
			const next = Math.round((prev + delta) * 100) / 100;
			return Math.max(0, Math.min(100, next));
		});
	}, []);

	const handleAdjustY = useCallback((delta: number) => {
		setAdjustedY((prev) => {
			const next = Math.round((prev + delta) * 100) / 100;
			return Math.max(0, Math.min(100, next));
		});
	}, []);

	const handleInputChangeX = useCallback((value: string) => {
		const num = parseFloat(value);
		if (!isNaN(num) && num >= 0 && num <= 100) {
			setAdjustedX(num);
		} else if (value === "" || value === "-") {
			setAdjustedX(0);
		}
	}, []);

	const handleInputChangeY = useCallback((value: string) => {
		const num = parseFloat(value);
		if (!isNaN(num) && num >= 0 && num <= 100) {
			setAdjustedY(num);
		} else if (value === "" || value === "-") {
			setAdjustedY(0);
		}
	}, []);

	const handleGeneratePDF = useCallback(async () => {
		setIsGenerating(true);

		try {
			const result = await generateSampleOverlayPDF(adjustedX, adjustedY);

			if (result.isSuccess) {
				window.open(result.data, "_blank");
				toast.success("Sample PDF Generated", {
					description: `Preview opened in a new tab with anchor (${adjustedX}, ${adjustedY}).`
				});
			} else {
				toast.error("Generation Failed", {
					description: result.error.message || "Failed to generate sample overlay PDF."
				});
			}
		} catch (error) {
			console.error("Error generating sample PDF:", error);
			toast.error("Generation Failed", {
				description: "An unexpected error occurred while generating the PDF."
			});
		} finally {
			setIsGenerating(false);
		}
	}, [adjustedX, adjustedY]);

	const handleUpdateCoordinates = useCallback(async () => {
		if (!booklet) return;

		setIsUpdating(true);

		const updatePromise = async () => {
			const result = await updateBookletAnchorCoordinates(booklet.id, adjustedX, adjustedY);

			if (result.isSuccess) {
				onAnchorUpdate?.(booklet.id, adjustedX, adjustedY);
				onClose();
				return result.data;
			} else {
				throw new Error(result.error.message || "Failed to update anchor coordinates.");
			}
		};

		toast.promise(updatePromise, {
			loading: "Updating anchor coordinates...",
			success: `Anchor coordinates updated to (${adjustedX}, ${adjustedY})`,
			error: (error) => error.message || "Failed to update anchor coordinates",
			finally: () => {
				setIsUpdating(false);
			}
		});
	}, [booklet, adjustedX, adjustedY, onAnchorUpdate, onClose]);

	const hasChanges = adjustedX !== originalX || adjustedY !== originalY;

	if (!booklet) return null;

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Crosshair className="size-5" />
						Anchor Calibration — Booklet #{booklet.bookletNumber}
					</DialogTitle>
					<DialogDescription>
						Adjust anchor coordinates and generate sample PDFs to verify alignment before saving.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					<div className="space-y-2">
						<Label className="text-sm font-medium text-muted-foreground">Saved Coordinates</Label>
						<div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
							<div className="flex-1 text-center">
								<div className="text-xs text-muted-foreground mb-1">Anchor X</div>
								<div className="font-mono text-sm font-semibold">{originalX}</div>
							</div>
							<div className="w-px h-8 bg-border" />
							<div className="flex-1 text-center">
								<div className="text-xs text-muted-foreground mb-1">Anchor Y</div>
								<div className="font-mono text-sm font-semibold">{originalY}</div>
							</div>
						</div>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium">Adjust Coordinates</Label>
							<Button
								size="sm"
								variant="ghost"
								disabled={!hasChanges}
								onClick={handleReset}
								className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
							>
								<RotateCcw className="size-3 mr-1" />
								Reset
							</Button>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="calibrate-anchor-x" className="text-xs text-muted-foreground">
									Anchor X
								</Label>
								<div className="flex items-center gap-1.5">
									<Button
										size="icon"
										variant="outline"
										disabled={adjustedX <= 0}
										className="size-8 shrink-0"
										onClick={() => handleAdjustX(-1)}
									>
										<Minus className="size-3" />
									</Button>
									<Input
										min="0"
										step="1"
										max="100"
										type="number"
										value={adjustedX}
										id="calibrate-anchor-x"
										className="text-center font-mono h-8 text-sm"
										onChange={(e) => handleInputChangeX(e.target.value)}
									/>
									<Button
										size="icon"
										variant="outline"
										disabled={adjustedX >= 100}
										className="size-8 shrink-0"
										onClick={() => handleAdjustX(1)}
									>
										<Plus className="size-3" />
									</Button>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="calibrate-anchor-y" className="text-xs text-muted-foreground">
									Anchor Y
								</Label>
								<div className="flex items-center gap-1.5">
									<Button
										size="icon"
										variant="outline"
										disabled={adjustedY <= 0}
										className="size-8 shrink-0"
										onClick={() => handleAdjustY(-1)}
									>
										<Minus className="size-3" />
									</Button>
									<Input
										min="0"
										step="1"
										max="100"
										type="number"
										value={adjustedY}
										id="calibrate-anchor-y"
										className="text-center font-mono h-8 text-sm"
										onChange={(e) => handleInputChangeY(e.target.value)}
									/>
									<Button
										size="icon"
										variant="outline"
										disabled={adjustedY >= 100}
										className="size-8 shrink-0"
										onClick={() => handleAdjustY(1)}
									>
										<Plus className="size-3" />
									</Button>
								</div>
							</div>
						</div>
					</div>

					<Button variant="outline" className="w-full" disabled={isGenerating} onClick={handleGeneratePDF}>
						{isGenerating ? (
							<>
								<Loader2 className="size-4 mr-2 animate-spin" />
								Generating Sample PDF...
							</>
						) : (
							<>
								<FileDown className="size-4 mr-2" />
								Generate Sample PDF
							</>
						)}
					</Button>
				</div>

				<DialogFooter className="gap-4 pt-2">
					<Button variant="outline" onClick={handleClose} disabled={isUpdating}>
						Cancel
					</Button>
					<Button onClick={handleUpdateCoordinates} disabled={isUpdating || !hasChanges}>
						{isUpdating ? (
							<>
								<Loader2 className="size-4 mr-1 animate-spin" />
								Updating...
							</>
						) : (
							<>
								<Save className="size-4 mr-1" />
								Update Coordinates
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AnchorCalibrationDialog;
