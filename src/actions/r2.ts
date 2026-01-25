"use server";

import { nanoid } from "nanoid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Result, success, failure, AuthError, authError, databaseError, DatabaseError } from "@/lib/result";

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

export const deleteR2File = async (key: string): Promise<Result<DeleteR2File, AuthError | DatabaseError>> => {
	try {
		if (!key) {
			return failure(authError("File key is required"));
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

export const getUploadUrl = async (fileType: string): Promise<Result<R2UploadUrl, AuthError | DatabaseError>> => {
	try {
		if (!fileType) {
			return failure(authError("File type is required"));
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
