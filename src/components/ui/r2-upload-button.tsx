"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface R2UploadButtonProps {
	accept?: string;
	disabled?: boolean;
	className?: string;
	onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const R2UploadButton = ({
	className,
	onFileSelect,
	disabled = false,
	accept = "application/pdf"
}: R2UploadButtonProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	return (
		<input
			type="file"
			accept={accept}
			ref={fileInputRef}
			disabled={disabled}
			onChange={onFileSelect}
			className={cn("absolute inset-0 cursor-pointer opacity-0", className)}
		/>
	);
};
