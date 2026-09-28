import axios from "axios";
import { api } from "@/lib/api";

export type UploadPurpose =
  | "avatar"
  | "step-proof"
  | "nin-slip"
  | "cac-certificate"
  | "workshop-photo"
  | "appeal-attachment"
  | "support-attachment"
  | "job-spec";

export interface SignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  folder: string;
  cloudName: string;
  publicId?: string;
}

export interface UploadResult {
  publicId: string;
  url: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
}

export const mediaService = {
  /**
   * Upload a file directly and securely to Cloudinary using backend signing
   */
  async uploadFile(file: File, purpose: UploadPurpose): Promise<UploadResult> {
    // 1. Get upload signature from backend
    const { data: signatureData } = await api.post<SignatureResponse>(
      "/media/signature",
      { purpose }
    );

    // 2. Direct upload to Cloudinary via FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", String(signatureData.timestamp));
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`;

    const cloudinaryResponse = await axios.post<{
      public_id: string;
      secure_url: string;
      format: string;
      bytes: number;
      resource_type: string;
    }>(cloudinaryUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const publicId = cloudinaryResponse.data.public_id;
    const url = cloudinaryResponse.data.secure_url;

    // 3. Confirm upload with backend to lock ownership
    await api.post("/media/confirm", {
      purpose,
      publicId,
    });

    return {
      publicId,
      url,
      format: cloudinaryResponse.data.format,
      bytes: cloudinaryResponse.data.bytes,
      resourceType: cloudinaryResponse.data.resource_type,
    };
  },
};
