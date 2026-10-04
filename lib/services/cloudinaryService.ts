import type { PublicUser } from "@/lib/services/authService";

// Every upload goes through the API's signed media flow (see mediaService):
// the API picks the folder and checks ownership, and the Cloudinary secret
// never reaches the app. What's left here is the shape a finished upload takes
// in a form, and the friendly name it's shown under.

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
  const millis = String(date.getMilliseconds()).padStart(3, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}${millis}`;
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
  const uniqueSuffix = Math.random().toString(36).slice(2, 6);
  const baseName = `${sanitizeSlug(username)}-${datetime}-${uniqueSuffix}`;
  const fullName = ext ? `${baseName}.${ext}` : baseName;

  return { baseName, fullName, extension: ext };
}
