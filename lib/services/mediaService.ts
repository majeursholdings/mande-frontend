import axios from "axios";
import { api } from "@/lib/api";

export type UploadPurpose =
  | "avatar"
  | "nin-card"
  | "business-document"
  | "step-proof"
  | "completion-photo"
  | "feedback-screenshot"
  | "appeal-attachment"
  | "job-image"
  | "job-attachment"
  | "review-attachment";

export interface SignatureResponse {
  uploadUrl: string;
  fields: Record<string, string | number | boolean>;
  maxBytes?: number;
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
  async uploadFile(
    file: File,
    purpose: UploadPurpose,
    onProgress?: (percent: number) => void
  ): Promise<UploadResult> {
    // 1. Get upload signature from backend
    const { data: signatureData } = await api.post<SignatureResponse>(
      "/media/signature",
      { purpose }
    );

    // 2. Direct upload to Cloudinary via FormData
    const formData = new FormData();
    if (signatureData.fields) {
      for (const [key, value] of Object.entries(signatureData.fields)) {
        formData.append(key, String(value));
      }
    }
    formData.append("file", file);

    const cloudinaryResponse = await axios.post<{
      public_id: string;
      secure_url: string;
      format: string;
      bytes: number;
      resource_type: string;
    }>(signatureData.uploadUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    const publicId = cloudinaryResponse.data.public_id;
    const url = cloudinaryResponse.data.secure_url;

    return {
      publicId,
      url,
      format: cloudinaryResponse.data.format,
      bytes: cloudinaryResponse.data.bytes,
      resourceType: cloudinaryResponse.data.resource_type,
    };
  },
};

