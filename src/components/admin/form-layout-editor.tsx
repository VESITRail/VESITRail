"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getFormLayoutConfig, updateFormLayoutConfig } from "@/actions/app-config";
import { Save, Code2, Loader2, Sparkles, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";

interface FormLayoutEditorProps {
	initialData?: Record<string, unknown>;
}

export default function FormLayoutEditor({ initialData }: FormLayoutEditorProps) {
	const [saving, setSaving] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(!initialData);

	const [configData, setConfigData] = useState<Record<string, unknown>>(initialData || {});
	const [originalData, setOriginalData] = useState<Record<string, unknown>>(initialData || {});

	const [jsonError, setJsonError] = useState<string | null>(null);
	const [jsonText, setJsonText] = useState<string>(initialData ? JSON.stringify(initialData, null, 2) : "");

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const lineNumbersRef = useRef<HTMLDivElement>(null);

	const loadConfig = useCallback(async () => {
		setLoading(true);

		try {
			const res = await getFormLayoutConfig();
			if (res.isSuccess) {
				const fetched = res.data || {};
				setConfigData(fetched);
				setOriginalData(fetched);
				setJsonText(JSON.stringify(fetched, null, 2));
				setJsonError(null);
			} else {
				toast.error("Failed to load configuration", {
					description: res.error?.message || "An unexpected database error occurred."
				});
			}
		} catch (err) {
			console.error("Error loading form layout config:", err);
			toast.error("Error loading config", {
				description: "Could not retrieve the form layout configuration."
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!initialData) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- We want to load the config if initialData is not provided
			loadConfig();
		}
	}, [initialData, loadConfig]);

	const handleScroll = useCallback(() => {
		if (textareaRef.current && lineNumbersRef.current) {
			lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
		}
	}, []);

	const lines = useMemo(() => {
		return jsonText.split("\n");
	}, [jsonText]);

	const handleJsonTextChange = (text: string) => {
		setJsonText(text);
		try {
			const parsed = JSON.parse(text);
			if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
				setConfigData(parsed);
				setJsonError(null);
			} else {
				setJsonError("JSON root must be a valid object.");
			}
		} catch (err) {
			setJsonError((err as Error).message);
		}
	};

	const handleFormatJson = () => {
		try {
			const parsed = JSON.parse(jsonText);
			const formatted = JSON.stringify(parsed, null, 2);
			setJsonText(formatted);
			setConfigData(parsed);
			setJsonError(null);
			toast.success("JSON Formatted");
		} catch (err) {
			toast.error("Format Failed", {
				description: "Cannot format invalid JSON syntax."
			});
		}
	};

	const handleReset = () => {
		setConfigData(originalData);
		setJsonText(JSON.stringify(originalData, null, 2));
		setJsonError(null);
		toast.info("Reset to saved state");
	};

	const hasChanges = useMemo(() => {
		return JSON.stringify(configData) !== JSON.stringify(originalData);
	}, [configData, originalData]);

	const handleSave = async () => {
		if (jsonError) {
			toast.error("Cannot Save", {
				description: "Please fix JSON syntax errors before saving."
			});
			return;
		}

		setSaving(true);

		const savePromise = async () => {
			const res = await updateFormLayoutConfig(configData);
			if (res.isSuccess) {
				setOriginalData(configData);
				return res.data;
			} else {
				throw new Error(res.error?.message || "Failed to update configuration.");
			}
		};

		toast.promise(savePromise, {
			finally: () => setSaving(false),
			loading: "Saving form layout configuration...",
			success: "Form layout configuration saved successfully!",
			error: (err) => err.message || "Failed to save configuration."
		});
	};

	if (loading) {
		return (
			<div className="w-full rounded-xl border bg-card p-4 space-y-4 shadow-xs">
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-48" />
					<div className="flex gap-2">
						<Skeleton className="h-8 w-24" />
						<Skeleton className="h-8 w-24" />
					</div>
				</div>
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	return (
		<div className="w-full rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden flex flex-col">
			<div className="flex flex-row items-center justify-between px-4 py-3 bg-muted/20 border-b gap-4 flex-wrap">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<Code2 className="size-4 text-muted-foreground" />
						<span className="text-sm font-semibold">Configuration Editor</span>
					</div>

					{jsonError ? (
						<Badge variant="destructive" className="gap-1 text-[11px] font-medium py-0.5">
							<AlertCircle className="size-3" /> Syntax Error
						</Badge>
					) : hasChanges ? (
						<Badge className="bg-amber-600 hover:bg-amber-600 text-white gap-1 text-[11px] font-medium py-0.5 border-0">
							<Sparkles className="size-3" /> Unsaved Changes
						</Badge>
					) : (
						<Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-[11px] font-medium py-0.5 border-0">
							<CheckCircle2 className="size-3" /> Saved
						</Badge>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Button
						size="icon"
						variant="outline"
						className="size-8"
						title="Format JSON"
						onClick={handleFormatJson}
						disabled={Boolean(jsonError)}
					>
						<Sparkles className="size-4" />
					</Button>

					<Button
						size="icon"
						variant="outline"
						className="size-8"
						title="Reset Changes"
						onClick={handleReset}
						disabled={!hasChanges || saving}
					>
						<RotateCcw className="size-4" />
					</Button>

					<Button
						size="icon"
						className="size-8"
						onClick={handleSave}
						title="Save Changes"
						disabled={!hasChanges || saving || Boolean(jsonError)}
					>
						{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
					</Button>
				</div>
			</div>

			<div className="relative flex bg-background h-[calc(100vh-320px)] min-h-105">
				<div
					aria-hidden="true"
					ref={lineNumbersRef}
					className="w-12 shrink-0 pt-4 pb-8 select-none overflow-hidden bg-muted/20 border-r text-right pr-3 font-mono text-xs text-muted-foreground/60 leading-6"
				>
					{lines.map((_, i) => (
						<div key={i}>{i + 1}</div>
					))}
				</div>

				<textarea
					value={jsonText}
					ref={textareaRef}
					spellCheck={false}
					onScroll={handleScroll}
					placeholder="Enter JSON structure..."
					onChange={(e) => handleJsonTextChange(e.target.value)}
					className="flex-1 pt-4 pb-8 px-4 font-mono text-xs leading-relaxed bg-transparent text-foreground resize-none outline-none border-0 ring-0 focus:ring-0 leading-relaxed overflow-auto whitespace-pre"
				/>
			</div>

			{jsonError && (
				<div className="bg-destructive/10 border-t border-destructive/20 px-4 py-2.5 flex items-center gap-2 text-destructive text-xs">
					<AlertCircle className="size-4 shrink-0" />
					<span className="font-mono font-medium truncate">{jsonError}</span>
				</div>
			)}
		</div>
	);
}
