// ─────────────────────────────────────────────────────────────────────────────
// What the form's upload fields take. An "image" field takes images only; a
// "file" field is for documents and takes PDF or Word only. A field's own
// `accept` can narrow that further, never widen it. Every file is capped at
// DEFAULT_MAX_FILE_SIZE_MB unless the field sets its own `maxSizeMB`.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_MAX_FILE_SIZE_MB = 5;

// Extensions as well as types: browsers often leave HEIC's type blank
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|heic|heif|bmp)$/i;
const DOCUMENT_EXTENSIONS = /\.(pdf|docx?)$/i;
const DOCUMENT_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** The picker filter for image fields. */
export const IMAGE_ACCEPT = "image/*, .heic, .heif";
/** The picker filter for document fields — PDF or Word. */
export const DOCUMENT_ACCEPT = `.pdf, .doc, .docx, ${DOCUMENT_TYPES.join(", ")}`;

/**
 * What the API keeps with a record (a job, an appeal, a review): JPG, PNG or
 * WebP photos and PDF documents. It refuses Word files and other image
 * types, so fields whose files go to the API narrow `accept` to these.
 */
export const API_PHOTO_ACCEPT = ".jpg, .jpeg, .png, .webp, image/jpeg, image/png, image/webp";
export const API_DOCUMENT_ACCEPT = ".pdf, application/pdf";

export const isImageFile = (file: File) => file.type.startsWith("image/") || IMAGE_EXTENSIONS.test(file.name);

export const isDocumentFile = (file: File) =>
    DOCUMENT_TYPES.includes(file.type) || DOCUMENT_EXTENSIONS.test(file.name);

/** Why `file` can't go in a field of `type` — null when it can. */
export function getFileKindError(file: File, type: "file" | "image"): string | null {
    if (type === "image") return isImageFile(file) ? null : "Only images can be added";
    return isDocumentFile(file) ? null : "Only PDF or Word documents can be added";
}
