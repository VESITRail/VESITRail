"use client";

import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

type DamagedPagesManagerProps = {
	totalPages: number;
	damagedPages: number[];
	onDamagedPagesChange: (pages: number[]) => void;
};

const DamagedPagesManager = ({ totalPages, damagedPages, onDamagedPagesChange }: DamagedPagesManagerProps) => {
	const [inputError, setInputError] = useState<string>("");
	const [newPageInput, setNewPageInput] = useState<string>("");

	const toUserPageNumber = (internalIndex: number): number => internalIndex + 1;

	const toInternalPageIndex = (userPageNumber: number): number => userPageNumber - 1;

	const handleAddPage = useCallback(() => {
		setInputError("");

		if (!newPageInput.trim()) {
			setInputError("Please enter a page number");
			return;
		}

		const userPageNum = parseInt(newPageInput.trim(), 10);

		if (isNaN(userPageNum)) {
			setInputError("Please enter a valid number");
			return;
		}

		if (userPageNum < 1 || userPageNum > totalPages) {
			setInputError(`Page number must be between 1 and ${totalPages}`);
			return;
		}

		const internalPageIndex = toInternalPageIndex(userPageNum);

		if (damagedPages.includes(internalPageIndex)) {
			setInputError("This page is already marked as damaged");
			return;
		}

		const updatedPages = [...damagedPages, internalPageIndex].sort((a, b) => a - b);
		onDamagedPagesChange(updatedPages);
		setNewPageInput("");
	}, [newPageInput, totalPages, damagedPages, onDamagedPagesChange]);

	const handleRemovePage = useCallback(
		(internalPageIndex: number) => {
			const updatedPages = damagedPages.filter((p) => p !== internalPageIndex);
			onDamagedPagesChange(updatedPages);
		},
		[damagedPages, onDamagedPagesChange]
	);

	const handleKeyPress = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleAddPage();
			}
		},
		[handleAddPage]
	);

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="text-sm font-medium">Damaged Pages</Label>

				<div className="flex gap-4">
					<div className="flex-1">
						<Input
							min="1"
							type="number"
							max={totalPages}
							value={newPageInput}
							onKeyPress={handleKeyPress}
							placeholder={`Enter page number (1-${totalPages})`}
							className={`${inputError ? "border-destructive" : ""}`}
							onChange={(e) => {
								setNewPageInput(e.target.value);
								if (inputError) setInputError("");
							}}
						/>

						{inputError && <div className="text-sm text-destructive mt-1">{inputError}</div>}
					</div>

					<Button onClick={handleAddPage} className="shrink-0">
						<Plus className="size-4" />
						Add
					</Button>
				</div>
			</div>

			{damagedPages.length > 0 ? (
				<div className="space-y-2">
					<div className="flex flex-wrap gap-2">
						{damagedPages.map((internalPageIndex) => (
							<Badge variant="destructive" className="pr-2 py-1" key={internalPageIndex}>
								Page {toUserPageNumber(internalPageIndex)}
								<Button
									size="sm"
									variant="ghost"
									className="size-4 p-0 ml-0.5"
									onClick={() => handleRemovePage(internalPageIndex)}
								>
									<X className="size-3" />
								</Button>
							</Badge>
						))}
					</div>

					<p className="text-xs text-muted-foreground">
						{damagedPages.length} page{damagedPages.length !== 1 ? "s" : ""} marked as damaged
					</p>
				</div>
			) : (
				<p className="text-xs text-muted-foreground">No damaged pages marked</p>
			)}
		</div>
	);
};

export default DamagedPagesManager;
