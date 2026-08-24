"use server";

import prisma from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/auth-guard";
import { Result, success, failure, AuthError, databaseError, DatabaseError } from "@/lib/result";

const FORM_LAYOUT_KEY = "form_layout";

export async function getFormLayoutConfig(): Promise<Result<Record<string, unknown>, AuthError | DatabaseError>> {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		const config = await prisma.appConfig.findUnique({
			where: { key: FORM_LAYOUT_KEY }
		});

		if (!config || !config.value) {
			return success({});
		}

		const parsedValue =
			typeof config.value === "string" ? JSON.parse(config.value) : (config.value as Record<string, unknown>);

		return success(parsedValue);
	} catch (error) {
		console.error("Error fetching form layout config:", error);
		return failure(databaseError("Failed to fetch form layout configuration"));
	}
}

export async function updateFormLayoutConfig(
	configData: Record<string, unknown>
): Promise<Result<{ success: boolean }, AuthError | DatabaseError>> {
	const adminResult = await requireAdmin();
	if (!adminResult.isSuccess) return adminResult;

	try {
		await prisma.appConfig.upsert({
			where: { key: FORM_LAYOUT_KEY },
			update: {
				value: configData as unknown as object
			},
			create: {
				key: FORM_LAYOUT_KEY,
				value: configData as unknown as object
			}
		});

		return success({ success: true });
	} catch (error) {
		console.error("Error updating form layout config:", error);
		return failure(databaseError("Failed to update form layout configuration"));
	}
}
