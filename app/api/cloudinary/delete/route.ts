import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicId, resourceType } = body;

    if (!publicId) {
      return NextResponse.json(
        { error: "publicId is required" },
        { status: 400 }
      );
    }

    const type = (resourceType as "image" | "raw" | "video") || "image";

    // Attempt to destroy asset with specified resource_type
    let result = await cloudinary.uploader.destroy(publicId, {
      resource_type: type,
      invalidate: true,
    });

    // If not found and type wasn't "raw", try "raw" as fallback (common for documents/PDFs)
    if (result.result === "not found" && type !== "raw") {
      const rawResult = await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
        invalidate: true,
      });
      if (rawResult.result === "ok") {
        result = rawResult;
      }
    }

    return NextResponse.json({
      success: true,
      result: result.result,
    });
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete asset from Cloudinary" },
      { status: 500 }
    );
  }
}
