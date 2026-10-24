"use client";

import { cn } from "@/lib/utils";
import { FormMessage, useFormField } from "@/components/ui/form";

type FieldErrorProps = {
	id?: string;
};

const FieldError = ({ id }: FieldErrorProps) => {
	const { error } = useFormField();

	return (
		<div
			className={cn(
				"grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
				error ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
			)}
		>
			<div className="overflow-hidden">
				<FormMessage id={id} className="text-sm" />
			</div>
		</div>
	);
};

export { FieldError };
