"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AuthError, authError, failure, Result } from "@/lib/result";

export type AuthSession = {
	name: string;
	email: string;
	userId: string;
};

export type AdminSession = AuthSession & {
	isActive: boolean;
};

export type StudentSession = AuthSession & {
	studentId: string;
};

export const requireAuth = async (): Promise<Result<AuthSession, AuthError>> => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		});

		if (!session?.user?.id) {
			return failure(authError("Authentication required", "UNAUTHORIZED"));
		}

		return {
			isSuccess: true,
			data: {
				userId: session.user.id,
				name: session.user.name,
				email: session.user.email
			}
		};
	} catch (error) {
		console.error("Error verifying authentication:", error);
		return failure(authError("Authentication failed", "UNAUTHORIZED"));
	}
};

export const requireAdmin = async (): Promise<Result<AdminSession, AuthError>> => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		});

		if (!session?.user?.id) {
			return failure(authError("Authentication required", "UNAUTHORIZED"));
		}

		const admin = await prisma.admin.findUnique({
			where: { userId: session.user.id },
			select: { isActive: true }
		});

		if (!admin) {
			return failure(authError("Admin access required", "FORBIDDEN"));
		}

		if (!admin.isActive) {
			return failure(authError("Admin account is not active", "FORBIDDEN"));
		}

		return {
			isSuccess: true,
			data: {
				userId: session.user.id,
				name: session.user.name,
				isActive: admin.isActive,
				email: session.user.email
			}
		};
	} catch (error) {
		console.error("Error verifying admin access:", error);
		return failure(authError("Authorization failed", "UNAUTHORIZED"));
	}
};

export const requireStudent = async (): Promise<Result<StudentSession, AuthError>> => {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		});

		if (!session?.user?.id) {
			return failure(authError("Authentication required", "UNAUTHORIZED"));
		}

		const student = await prisma.student.findUnique({
			where: { userId: session.user.id },
			select: { userId: true, status: true }
		});

		if (!student) {
			return failure(authError("Student profile not found", "FORBIDDEN"));
		}

		if (student.status !== "Approved") {
			return failure(authError("Student account is not approved", "FORBIDDEN"));
		}

		return {
			isSuccess: true,
			data: {
				userId: session.user.id,
				name: session.user.name,
				studentId: student.userId,
				email: session.user.email
			}
		};
	} catch (error) {
		console.error("Error verifying student access:", error);
		return failure(authError("Authorization failed", "UNAUTHORIZED"));
	}
};
