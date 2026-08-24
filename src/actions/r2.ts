"use server";

import {
	Result,
	success,
	failure,
	AuthError,
	authError,
	databaseError,
	DatabaseError,
	validationError,
	ValidationError
} from "@/lib/result";
import { nanoid } from "nanoid";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
	region: "auto",
	endpoint: process.env.R2_ENDPOINT,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
	}
});

export type R2DeleteResponse = {
	message: string;
	success: boolean;
};

export type DeleteR2File = {
	message: string;
	response: R2DeleteResponse;
};

export type R2UploadUrl = {
	key: string;
	fileUrl: string;
	uploadUrl: string;
};

export const deleteR2File = async (
	key: string
): Promise<Result<DeleteR2File, AuthError | DatabaseError | ValidationError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		if (!key) {
			return failure(validationError("File key is required"));
		}

		if (!/^[a-zA-Z0-9_-]+\.pdf$/.test(key)) {
			return failure(validationError("Invalid file key format"));
		}

		const admin = await prisma.admin.findUnique({
			where: { userId: authResult.data.userId },
			select: { isActive: true }
		});

		const isAdmin = admin?.isActive === true;

		if (!isAdmin) {
			const [otherStudentDoc, otherAddressChangeDoc] = await Promise.all([
				prisma.student.findFirst({
					where: {
						verificationDocUrl: { contains: key },
						userId: { not: authResult.data.userId }
					},
					select: { userId: true }
				}),
				prisma.addressChange.findFirst({
					where: {
						verificationDocUrl: { contains: key },
						studentId: { not: authResult.data.userId }
					},
					select: { id: true }
				})
			]);

			if (otherStudentDoc || otherAddressChangeDoc) {
				return failure(authError("You do not have permission to delete this file", "FORBIDDEN"));
			}
		}

		const command = new DeleteObjectCommand({
			Key: key,
			Bucket: process.env.R2_BUCKET_NAME
		});

		await r2Client.send(command);

		return success({
			message: "File deleted successfully",
			response: { success: true, message: "File deleted successfully" }
		});
	} catch (error) {
		console.error("Error while deleting file:", error);
		return failure(databaseError("Failed to delete file"));
	}
};

export const getUploadUrl = async (
	fileType: string
): Promise<Result<R2UploadUrl, AuthError | DatabaseError | ValidationError>> => {
	const authResult = await requireAuth();
	if (!authResult.isSuccess) return authResult;

	try {
		if (!fileType) {
			return failure(validationError("File type is required"));
		}

		if (fileType !== "application/pdf") {
			return failure(validationError("Only PDF files are allowed"));
		}

		const key = `${nanoid()}.pdf`;

		const command = new PutObjectCommand({
			Key: key,
			ContentType: fileType,
			Bucket: process.env.R2_BUCKET_NAME
		});

		const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
		const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

		return success({
			key,
			fileUrl,
			uploadUrl
		});
	} catch (error) {
		console.error("Error generating upload URL:", error);
		return failure(databaseError("Failed to generate upload URL"));
	}
};
