import { Separator } from "@/components/ui/separator";
import { getFormLayoutConfig } from "@/actions/app-config";
import FormLayoutEditor from "@/components/admin/form-layout-editor";

export const dynamic = "force-dynamic";

export default async function FormLayoutPage() {
	const initialConfigRes = await getFormLayoutConfig();
	const initialData = initialConfigRes.isSuccess ? initialConfigRes.data : {};

	return (
		<div className="pt-8 pb-12 px-6 lg:px-8 space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">Form Layout Calibration</h1>
					<p className="text-muted-foreground text-sm">
						Calibrate element placement coordinates and field mappings for printed concession forms
					</p>
				</div>
			</div>

			<Separator className="my-4" />

			<div>
				<FormLayoutEditor initialData={initialData} />
			</div>
		</div>
	);
}
