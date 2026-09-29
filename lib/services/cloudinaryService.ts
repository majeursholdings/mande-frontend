import type { PublicUser } from "@/lib/services/authService";

export type CloudinaryVisibility = "public" | "private";

export interface FileMetadata {
  id: string;
  date: string;
  source: string;
  category: string;
  originalName?: string;
}

export interface CloudinaryUploadResult {
  id: string; // client unique ID
  publicId: string;
  url: string; // secure_url from Cloudinary
  name: string; // renamed filename: username-datetime
  originalName: string;
  format: string;
  bytes: number;
  resourceType: "image" | "raw" | "video";
  category: string;
  metadata: FileMetadata;
}

export interface UploadTask {
  id: string;
  file: File;
  name: string; // username-datetime
  originalName: string;
  size: number;
  progress: number; // 0 to 100
  status: "idle" | "uploading" | "completed" | "error" | "cancelled";
  result?: CloudinaryUploadResult;
  error?: string;
  cancel: () => void;
}

/**
 * Format datetime string for file renaming: YYYYMMDD-HHmmss
 */
export function formatDateTimeForFileName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Sanitize a string for safe use in Cloudinary filenames and folder paths
 */
export function sanitizeSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Extract username and role folder from current user or defaults
 */
export function resolveUserUploadInfo(user?: PublicUser | null): {
  username: string;
  roleFolder: "admins" | "manufacturers" | "super-admins";
  userFolder: string;
  source: string;
} {
  if (!user) {
    return {
      username: "user",
      roleFolder: "admins",
      userFolder: "guest",
      source: "Guest User",
    };
  }

  const profile = user.profile as {
    firstName?: string;
    lastName?: string;
    contactName?: string;
    companyName?: string;
  } | null;

  const fullName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.contactName ||
        profile?.companyName ||
        user.email.split("@")[0] ||
        "user";

  const rawUsername =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName.toLowerCase()}-${profile.lastName.toLowerCase()}`
      : user.email.split("@")[0] || "user";

  const username = sanitizeSlug(rawUsername) || "user";

  let roleFolder: "admins" | "manufacturers" | "super-admins" = "admins";
  if (user.role === "super_admin") {
    roleFolder = "super-admins";
  } else if (user.role === "manufacturer") {
    roleFolder = "manufacturers";
  }

  // Each user gets their own dedicated folder: username or username-userIdSuffix
  const userFolder = sanitizeSlug(username);

  return {
    username,
    roleFolder,
    userFolder,
    source: `${fullName} (${user.email})`,
  };
}

/**
 * Build the exact Cloudinary folder path requested:
 * Mande / {private|public} / {admins|manufacturers|super-admins} / {userFolder} / {category}
 */
export function buildCloudinaryFolder({
  visibility = "private",
  roleFolder = "admins",
  userFolder = "guest",
  category = "general",
}: {
  visibility?: CloudinaryVisibility;
  roleFolder?: "admins" | "manufacturers" | "super-admins";
  userFolder?: string;
  category?: string;
}): string {
  const cleanVisibility = visibility === "public" ? "public" : "private";
  const cleanUser = sanitizeSlug(userFolder) || "general";
  const cleanCategory = sanitizeSlug(category) || "general";

  return `Mande/${cleanVisibility}/${roleFolder}/${cleanUser}/${cleanCategory}`;
}

/**
 * Generate renamed filename according to the rule: (username-datetime)
 */
export function generateRenamedFileName(
  username: string,
  originalName: string,
  date: Date = new Date()
): {
  baseName: string; // username-datetime
  fullName: string; // username-datetime.ext
  extension: string;
} {
  const lastDot = originalName.lastIndexOf(".");
  const ext = lastDot !== -1 ? originalName.slice(lastDot + 1).toLowerCase() : "";
  const datetime = formatDateTimeForFileName(date);
  const baseName = `${sanitizeSlug(username)}-${datetime}`;
  const fullName = ext ? `${baseName}.${ext}` : baseName;

  return { baseName, fullName, extension: ext };
}

/**
 * Serialize metadata object into Cloudinary context string format
 * (key=value|key2=value2)
 */
export function serializeContext(metadata: FileMetadata): string {
  const escapeVal = (val: string) => val.replace(/[|=]/g, " ").trim();
  const pairs: string[] = [
    `id=${escapeVal(metadata.id)}`,
    `date=${escapeVal(metadata.date)}`,
    `source=${escapeVal(metadata.source)}`,
    `category=${escapeVal(metadata.category)}`,
  ];
  if (metadata.originalName) {
    pairs.push(`original_name=${escapeVal(metadata.originalName)}`);
  }
  return pairs.join("|");
}

export interface UploadOptions {
  file: File;
  category?: string; // "jobcreation", "jobProof", "profile", etc.
  visibility?: CloudinaryVisibility;
  user?: PublicUser | null;
  onProgress?: (progress: number) => void;
}

/**
 * Upload a file directly to Cloudinary with real-time progress and cancellation support
 */
export function uploadFileToCloudinary(options: UploadOptions): {
  promise: Promise<CloudinaryUploadResult>;
  cancel: () => void;
} {
  const {
    file,
    category = "jobcreation",
    visibility = "private",
    user,
    onProgress,
  } = options;

  let xhr: XMLHttpRequest | null = null;
  let isCancelled = false;

  const cancel = () => {
    isCancelled = true;
    if (xhr) {
      xhr.abort();
    }
  };

  const promise = (async (): Promise<CloudinaryUploadResult> => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const userInfo = resolveUserUploadInfo(user);
    const renamed = generateRenamedFileName(userInfo.username, file.name);

    const folder = buildCloudinaryFolder({
      visibility,
      roleFolder: userInfo.roleFolder,
      userFolder: userInfo.userFolder,
      category,
    });

    const metadata: FileMetadata = {
      id: fileId,
      date: new Date().toISOString(),
      source: userInfo.source,
      category,
      originalName: file.name,
    };

    const contextStr = serializeContext(metadata);
    const tags = [category, userInfo.roleFolder, visibility, userInfo.username].join(",");

    // 1. Get signed upload credentials from our Next.js API route
    const signResponse = await fetch("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder,
        publicId: renamed.baseName,
        context: contextStr,
        tags,
      }),
    });

    if (!signResponse.ok) {
      throw new Error("Failed to sign upload request");
    }

    const signData = await signResponse.json();

    if (isCancelled) {
      throw new Error("Upload cancelled");
    }

    // 2. Perform direct upload to Cloudinary using XMLHttpRequest for progress
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signData.apiKey);
    formData.append("timestamp", String(signData.timestamp));
    formData.append("signature", signData.signature);
    formData.append("folder", signData.folder);
    if (signData.publicId) formData.append("public_id", signData.publicId);
    if (signData.context) formData.append("context", signData.context);
    if (signData.tags) formData.append("tags", signData.tags);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`;

    interface CloudinaryUploadApiResponse {
      public_id: string;
      secure_url?: string;
      url?: string;
      format?: string;
      bytes?: number;
      resource_type?: "image" | "raw" | "video";
    }

    const uploadResponse = await new Promise<CloudinaryUploadApiResponse>((resolve, reject) => {
      xhr = new XMLHttpRequest();
      xhr.open("POST", cloudinaryUrl);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr && xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as CloudinaryUploadApiResponse;
            resolve(data);
          } catch {
            reject(new Error("Invalid response from Cloudinary"));
          }
        } else {
          reject(new Error(xhr?.statusText || "Upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.onabort = () => reject(new Error("Upload cancelled"));

      xhr.send(formData);
    });

    return {
      id: fileId,
      publicId: uploadResponse.public_id,
      url: uploadResponse.secure_url || uploadResponse.url,
      name: renamed.fullName,
      originalName: file.name,
      format: uploadResponse.format || renamed.extension,
      bytes: uploadResponse.bytes || file.size,
      resourceType: uploadResponse.resource_type || "image",
      category,
      metadata,
    };
  })();

  return { promise, cancel };
}

/**
 * Delete a file from Cloudinary (called when user removes an uploaded file or form fails)
 */
export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image"
): Promise<boolean> {
  try {
    const res = await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId, resourceType }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("Failed to delete asset from Cloudinary:", error);
    return false;
  }
}

/**
 * Clean up an array of uploaded files from Cloudinary (e.g. when form submission fails)
 */
export async function cleanupFailedUploads(
  files: { publicId: string; resourceType?: "image" | "raw" | "video" }[]
): Promise<void> {
  if (!files || files.length === 0) return;
  await Promise.allSettled(
    files.map((file) => deleteCloudinaryAsset(file.publicId, file.resourceType))
  );
}
