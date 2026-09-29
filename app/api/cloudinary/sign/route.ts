import { NextResponse } from "next/server";
import { cloudinary, getCloudinaryCredentials } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { folder, publicId, context, tags } = body;

    const timestamp = Math.round(Date.now() / 1000);
    const { apiKey, apiSecret, cloudName } = getCloudinaryCredentials();

    const paramsToSign: Record<string, string | number> = {
      timestamp,
    };

    if (folder) paramsToSign.folder = folder;
    if (publicId) paramsToSign.public_id = publicId;
    if (context) paramsToSign.context = context;
    if (tags) paramsToSign.tags = tags;

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return NextResponse.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      publicId,
      context,
      tags,
    });
  } catch (error) {
    console.error("Cloudinary sign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
