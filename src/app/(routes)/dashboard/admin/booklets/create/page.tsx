"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createBooklet, CreateBookletInput } from "@/actions/booklets";
import { BookOpen, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CreateBookletPage = () => {
	const router = useRouter();
	const [isCreating, setIsCreating] = useState<boolean>(false);

	const [formData, setFormData] = useState<CreateBookletInput>({
		anchorX: 0,
		anchorY: 0,
		status: "Available",
		serialStartNumber: ""
	});

	const [errors, setErrors] = useState<{
		anchorX?: string;
		anchorY?: string;
		serialStartNumber?: string;
	}>({});

	const calculateSerialEndNumber = useCallback((startNumber: string): string => {
		const upperStart = startNumber.toUpperCase();
		const match = upperStart.match(/^([A-Z])(\d+)$/);

		if (!match) {
			return "";
		}

		const prefix = match[1];
		const startNum = parseInt(match[2], 10);
		const endNum = startNum + 49;

		return `${prefix}${endNum.toString().padStart(match[2].length, "0")}`;
	}, []);

	const validateForm = useCallback((): boolean => {
		const newErrors: {
			anchorX?: string;
			anchorY?: string;
			serialStartNumber?: string;
		} = {};

		if (!formData.serialStartNumber.trim()) {
			newErrors.serialStartNumber = "Serial start number is required";
		} else {
			const upperSerial = formData.serialStartNumber.toUpperCase().trim();
			if (!/^[A-Z]\d+$/.test(upperSerial)) {
				newErrors.serialStartNumber = "Invalid format. Use one letter followed by numbers (e.g., A0807551)";
			}
		}

		if (formData.anchorX < 0 || formData.anchorX > 100) {
			newErrors.anchorX = "Anchor X must be between 0 and 100";
		}

		if (formData.anchorY < 0 || formData.anchorY > 100) {
			newErrors.anchorY = "Anchor Y must be between 0 and 100";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [formData]);

	const handleInputChange = useCallback(
		(field: keyof CreateBookletInput, value: string | number) => {
			let processedValue = value;

			if (field === "serialStartNumber" && typeof value === "string") {
				processedValue = value.toUpperCase();
			}

			setFormData((prev) => ({ ...prev, [field]: processedValue }));
			if (errors[field as keyof typeof errors]) {
				setErrors((prev) => ({ ...prev, [field]: undefined }));
			}
		},
		[errors]
	);

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		setIsCreating(true);

		const createPromise = async () => {
			const result = await createBooklet({
				...formData,
				serialStartNumber: formData.serialStartNumber.toUpperCase().trim()
			});

			if (result.isSuccess) {
				setFormData({
					anchorX: 0,
					anchorY: 0,
					status: "Available",
					serialStartNumber: ""
				});
				setErrors({});
				router.push("/dashboard/admin/booklets");
				return result.data;
			} else {
				throw new Error(result.error.message || "Failed to create booklet");
			}
		};

		toast.promise(createPromise, {
			loading: "Creating Booklet...",
			success: "Booklet Created Successfully",
			error: (error) => error.message || "Failed to create booklet",
			finally: () => {
				setIsCreating(false);
			}
		});
	};

	const handleCancel = () => {
		setFormData({
			anchorX: 0,
			anchorY: 0,
			status: "Available",
			serialStartNumber: ""
		});
		setErrors({});
		router.push("/dashboard/admin/booklets");
	};

	const serialEndNumber = formData.serialStartNumber.trim() ? calculateSerialEndNumber(formData.serialStartNumber) : "";

	return (
		<div className="container max-w-2xl mx-auto py-8 px-4">
			<div className="flex w-full gap-4 justify-between items-start mb-6">
				<div className="flex items-center gap-3">
					<Button
						size="icon"
						variant="outline"
						className="size-10"
						onClick={() => router.push("/dashboard/admin/booklets")}
					>
						<ArrowLeft className="size-4" />
					</Button>
					<div className="flex items-center gap-3">
						<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
							<BookOpen className="size-5" />
						</div>
						<h1 className="text-2xl font-semibold">Create New Booklet</h1>
					</div>
				</div>
			</div>

			<Separator className="mb-8" />

			<Card>
				<CardHeader>
					<CardTitle>Booklet Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="serialStartNumber" className="text-sm font-medium">
							Serial Start Number <span className="text-destructive">*</span>
						</Label>

						<Input
							autoComplete="off"
							id="serialStartNumber"
							placeholder="e.g., A0807551"
							value={formData.serialStartNumber}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								handleInputChange("serialStartNumber", e.target.value)
							}
							className={`${errors.serialStartNumber ? "border-destructive" : ""}`}
						/>

						{errors.serialStartNumber && (
							<div className="flex items-center gap-2 text-sm text-destructive">
								<AlertCircle className="size-4" />
								{errors.serialStartNumber}
							</div>
						)}

						<div className="text-xs text-muted-foreground">Format: One letter followed by numbers (e.g., A0807551)</div>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium text-muted-foreground">Serial End Number (Auto-calculated)</Label>

						<div className="h-9 px-3 py-2 bg-muted rounded-md flex items-center">
							<span className="font-mono text-sm">
								{serialEndNumber || "Enter serial start number to see end number"}
							</span>
						</div>

						<div className="text-xs text-muted-foreground">Automatically calculated based on 50 pages</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="anchorX" className="text-sm font-medium">
								Anchor X Coordinate <span className="text-destructive">*</span>
							</Label>

							<Input
								min="0"
								step="1"
								max="100"
								id="anchorX"
								type="number"
								placeholder="0.0"
								value={formData.anchorX}
								className={`${errors.anchorX ? "border-destructive" : ""}`}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									handleInputChange("anchorX", parseFloat(e.target.value) || 0)
								}
							/>

							{errors.anchorX && (
								<div className="flex items-center gap-2 text-sm text-destructive">
									<AlertCircle className="size-4" />
									{errors.anchorX}
								</div>
							)}

							<div className="text-xs text-muted-foreground">X coordinate (0-100)</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="anchorY" className="text-sm font-medium">
								Anchor Y Coordinate <span className="text-destructive">*</span>
							</Label>

							<Input
								min="0"
								step="1"
								max="100"
								id="anchorY"
								type="number"
								placeholder="0.0"
								value={formData.anchorY}
								className={`${errors.anchorY ? "border-destructive" : ""}`}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									handleInputChange("anchorY", parseFloat(e.target.value) || 0)
								}
							/>

							{errors.anchorY && (
								<div className="flex items-center gap-2 text-sm text-destructive">
									<AlertCircle className="size-4" />
									{errors.anchorY}
								</div>
							)}

							<div className="text-xs text-muted-foreground">Y coordinate (0-100)</div>
						</div>
					</div>

					<div className="flex justify-end gap-4 py-1">
						<Button variant="outline" disabled={isCreating} onClick={handleCancel}>
							Cancel
						</Button>
						<Button
							className="min-w-32"
							onClick={handleSubmit}
							disabled={
								isCreating ||
								!formData.serialStartNumber.trim() ||
								formData.anchorX < 0 ||
								formData.anchorX > 100 ||
								formData.anchorY < 0 ||
								formData.anchorY > 100
							}
						>
							{isCreating ? (
								<>
									<Loader2 className="size-4 mr-2 animate-spin" />
									Creating...
								</>
							) : (
								<>
									<BookOpen className="size-4" />
									Create Booklet
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default CreateBookletPage;
