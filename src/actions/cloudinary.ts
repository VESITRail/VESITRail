"use server";

import { v2 as cloudinary } from "cloudinary";
import { ok, err, Result } from "neverthrow";

cloudinary.config({
  api_secret: process.env.CLOUDINARY_API_SECRET,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
});

export const deleteCloudinaryFile = async (
  publicId: string
): Promise<Result<any, string>> => {
  try {
    if (!publicId) {
      return err("Public ID is required");
    }

    const response = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "raw",
    });

    if (response.result === "ok") {
      return ok({ response, message: "File deleted successfully" });
    } else if (response.result === "not found") {
      return err("File not found");
    } else {
      return err("Failed to delete file");
    }
  } catch (error) {
    return err("Failed to delete file");
  }
};
