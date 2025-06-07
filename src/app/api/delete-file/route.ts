import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  api_secret: process.env.CLOUDINARY_API_SECRET,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
});

export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "raw",
    });

    if (result.result === "ok") {
      return NextResponse.json({
        message: "File deleted successfully",
        result: result,
      });
    } else if (result.result === "not found") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    } else {
      return NextResponse.json(
        { error: "Failed to delete file", details: result },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
