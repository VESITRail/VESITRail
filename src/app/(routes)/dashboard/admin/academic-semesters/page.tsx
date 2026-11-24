"use client";

import {
	type AcademicSemesterPage,
	type AcademicSemesterItem,
	getPaginatedAcademicSemesters
} from "@/actions/academic-semester";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Heading3, Small } from "@/components/ui/typography";
import AcademicSemestersTable from "@/components/admin/academic-semesters-table";
import { applyAcademicSemesterEdit, type AcademicSemesterListParams } from "@/lib/academic-semester-table";
import { AcademicSemesterDeleteDialog, AcademicSemesterFormDialog } from "@/components/admin/academic-semester-dialogs";

type SemesterDialog = { mode: "add" } | { mode: "edit" | "delete"; semester: AcademicSemesterItem };

const initialRequest: AcademicSemesterListParams = { page: 1, searchQuery: "", term: "all" };
const emptyPage: AcademicSemesterPage = {
	data: [],
	totalCount: 0,
	totalPages: 0,
	currentPage: 1,
	hasNextPage: false,
	hasPreviousPage: false
};

export default function AcademicSemestersPage() {
	const { data: session, isPending } = authClient.useSession();
	const userId = session?.user.id;

	const addButton = useRef<HTMLButtonElement>(null);
	const dialogTrigger = useRef<HTMLButtonElement | null>(null);

	const [request, setRequest] = useState(initialRequest);
	const [dialog, setDialog] = useState<SemesterDialog | null>(null);
	const [loaded, setLoaded] = useState<{
		userId: string;
		page: AcademicSemesterPage | null;
		request: AcademicSemesterListParams;
	}>();

	useEffect(() => {
		if (isPending || !userId) return;
		let current = true;

		const loadSemesters = async () => {
			try {
				const result = await getPaginatedAcademicSemesters(request);
				if (current) setLoaded({ request, userId, page: result.isSuccess ? result.data : null });
			} catch {
				if (!current) return;
				setLoaded({ request, userId, page: null });
				toast.error("Failed to Load Academic Semesters", {
					description: "Unable to load semester data. Please try again."
				});
			}
		};

		void loadSemesters();
		return () => {
			current = false;
		};
	}, [isPending, userId, request]);

	const currentResponse = loaded?.request === request && loaded.userId === userId ? loaded : undefined;
	const isLoading = !currentResponse;
	const page = currentResponse?.page ?? emptyPage;

	function openDialog(selection: SemesterDialog, trigger: HTMLButtonElement) {
		dialogTrigger.current = trigger;
		setDialog(selection);
	}

	function closeAndReload() {
		setDialog(null);
		setRequest((previous) => ({ ...previous, page: page.currentPage }));
	}

	async function handleSemesterEdit(semester: AcademicSemesterItem) {
		if (!currentResponse?.page) {
			setDialog(null);
			return;
		}

		const editedPage = applyAcademicSemesterEdit(currentResponse.page, semester, request);
		if (editedPage) {
			setLoaded((previous) => (previous === currentResponse ? { ...currentResponse, page: editedPage } : previous));
			setDialog(null);
			return;
		}

		try {
			const result = await getPaginatedAcademicSemesters({ ...request, page: page.currentPage });
			if (!result.isSuccess) throw new Error(result.error.message);
			setLoaded((previous) => (previous === currentResponse ? { ...currentResponse, page: result.data } : previous));
		} catch {
			toast.warning("Semester saved, but the table could not refresh", {
				description: "Submit the search again to see the updated results."
			});
		} finally {
			setDialog(null);
		}
	}

	const dialogProps = {
		onClose: () => setDialog(null),
		onCloseAutoFocus: (event: Event) => {
			event.preventDefault();
			const trigger = dialogTrigger.current;
			(trigger?.isConnected ? trigger : addButton.current)?.focus();
		}
	};

	if (!isPending && !userId) return null;

	return (
		<div className="h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] flex flex-col p-6 lg:px-8 space-y-4 overflow-hidden">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
				{isPending ? (
					<div className="space-y-2">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-64 max-w-full" />
					</div>
				) : (
					<>
						<div className="space-y-2">
							<Heading3 className="text-2xl font-semibold">Academic Semesters</Heading3>
							<Small className="text-muted-foreground">Manage the college’s official semester dates.</Small>
						</div>
						<Button
							ref={addButton}
							className="self-start sm:self-auto"
							disabled={currentResponse?.page === null}
							onClick={(event) => openDialog({ mode: "add" }, event.currentTarget)}
						>
							<Plus className="size-4" /> Add Semester
						</Button>
					</>
				)}
			</div>

			<Separator className="shrink-0" />

			<div className="flex-1 min-h-0 overflow-hidden flex flex-col">
				<AcademicSemestersTable
					term={request.term}
					semesters={page.data}
					isLoading={isLoading}
					totalPages={page.totalPages}
					totalCount={page.totalCount}
					currentPage={page.currentPage}
					hasNextPage={page.hasNextPage}
					searchQuery={request.searchQuery}
					hasPreviousPage={page.hasPreviousPage}
					isError={currentResponse?.page === null}
					onEdit={(semester, trigger) => openDialog({ mode: "edit", semester }, trigger)}
					onDelete={(semester, trigger) => openDialog({ mode: "delete", semester }, trigger)}
					onFilterChange={(term) => setRequest((previous) => ({ ...previous, page: 1, term }))}
					onPageChange={(nextPage) => setRequest((previous) => ({ ...previous, page: nextPage }))}
					onSearchChange={(search) => setRequest((previous) => ({ ...previous, page: 1, searchQuery: search.trim() }))}
				/>
			</div>
			{dialog?.mode === "add" && <AcademicSemesterFormDialog {...dialogProps} onSuccess={closeAndReload} />}
			{dialog?.mode === "edit" && (
				<AcademicSemesterFormDialog {...dialogProps} semester={dialog.semester} onSuccess={handleSemesterEdit} />
			)}
			{dialog?.mode === "delete" && (
				<AcademicSemesterDeleteDialog {...dialogProps} semester={dialog.semester} onSuccess={closeAndReload} />
			)}
		</div>
	);
}
