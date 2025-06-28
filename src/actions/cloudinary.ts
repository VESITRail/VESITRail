"use server";

import {
  Result,
  success,
  failure,
  AuthError,
  authError,
  databaseError,
  DatabaseError,
} from "@/lib/result";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  api_secret: process.env.CLOUDINARY_API_SECRET,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
});

export type DeleteCloudinaryFile = { response: any; message: string };

export const deleteCloudinaryFile = async (
  publicId: string
): Promise<Result<DeleteCloudinaryFile, AuthError | DatabaseError>> => {
  try {
    if (!publicId) {
      return failure(authError("Public ID is required"));
    }

    const response = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "raw",
    });

    if (response.result === "ok") {
      return success({ response, message: "File deleted successfully" });
    }

    if (response.result === "not found") {
      return failure(authError("File not found"));
    }

    return failure(authError("Failed to delete file"));
  } catch (error) {
    return failure(databaseError("Failed to delete file"));
  }
};
