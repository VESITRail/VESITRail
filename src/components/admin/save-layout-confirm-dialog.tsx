"use client";

import {
	Dialog,
	DialogTitle,
	DialogFooter,
	DialogHeader,
	DialogContent,
	DialogDescription
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StagedSlotInfo } from "@/actions/booklets";

type SaveLayoutConfirmDialogProps = {
	isOpen: boolean;
	isSaving: boolean;
	onClose: () => void;
	onConfirmSave: () => void;
	stagedSlots?: StagedSlotInfo[];
	originalSlots?: StagedSlotInfo[];
	booklet: {
		totalPages?: number;
		bookletNumber: number;
		serialEndNumber?: string;
		serialStartNumber?: string;
	};
};

export const SaveLayoutConfirmDialog = ({
	isOpen,
	onClose,
	booklet,
	isSaving,
	onConfirmSave
}: SaveLayoutConfirmDialogProps) => {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Save Booklet #{booklet.bookletNumber} Layout</DialogTitle>
					<DialogDescription>
						Are you sure you want to save the new layout? This will update the application slip positions and booklet
						status.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="gap-2 pt-2">
					<Button variant="outline" onClick={onClose} disabled={isSaving}>
						Cancel
					</Button>
					<Button onClick={onConfirmSave} disabled={isSaving}>
						{isSaving ? (
							<>
								<Loader2 className="size-4 mr-1.5 animate-spin" />
								Saving Layout...
							</>
						) : (
							"Confirm & Save Layout"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SaveLayoutConfirmDialog;
