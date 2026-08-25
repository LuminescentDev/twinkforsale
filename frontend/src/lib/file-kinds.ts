export type FileKind = "image" | "video" | "audio" | "document" | "archive" | "other";

export const fileKindLabels: Record<FileKind, string> = {
  image: "Images",
  video: "Video",
  audio: "Audio",
  document: "Documents",
  archive: "Archives",
  other: "Other",
};

/** Group a MIME type into the coarse buckets the Files type filter offers. */
export function fileKind(mimeType: string): FileKind {
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime.includes("zip") ||
    mime.includes("rar") ||
    mime.includes("tar") ||
    mime.includes("7z") ||
    mime.includes("gzip")
  )
    return "archive";
  if (
    mime.startsWith("text/") ||
    mime.includes("pdf") ||
    mime.includes("json") ||
    mime.includes("xml") ||
    mime.includes("document") ||
    mime.includes("spreadsheet") ||
    mime.includes("presentation")
  )
    return "document";
  return "other";
}

/** Short human label for a MIME type, e.g. "PNG image", "MP4 video". */
export function fileTypeLabel(mimeType: string): string {
  if (mimeType === "application/octet-stream") return "File";
  const [type, subtypeRaw] = mimeType.split("/");
  if (!subtypeRaw) return mimeType || "Unknown";
  const subtype = subtypeRaw.split(";")[0].replace(/^x-/, "").toUpperCase();
  switch (type) {
    case "image":
      return `${subtype} image`;
    case "video":
      return `${subtype} video`;
    case "audio":
      return `${subtype} audio`;
    case "text":
      return subtype === "PLAIN" ? "Text file" : `${subtype} text`;
    default:
      return subtype.length > 12 ? type : subtype;
  }
}

/** Compact relative date for list metadata, e.g. "Today", "3d ago", "12 Mar". */
export function formatRelativeDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays < 0) return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (date.getFullYear() === new Date().getFullYear()) {
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Full timestamp for tooltips and detail views. */
export function formatAbsoluteDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Expires in 3 days" / "Expired" / null when there is no expiry. */
export function describeExpiry(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const days = Math.ceil(diffMs / 86_400_000);
  if (days === 1) return "Expires tomorrow";
  if (days < 30) return `Expires in ${days} days`;
  return `Expires ${date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
}

/** Severity is stored as free text, so it is matched case-insensitively. */
export type Severity = "critical" | "error" | "warning" | "info" | "other";

export function normalizeSeverity(value: string): Severity {
  const s = value.trim().toLowerCase();
  if (s === "critical") return "critical";
  if (s === "error") return "error";
  if (s === "warning" || s === "warn") return "warning";
  if (s === "info" || s === "information") return "info";
  return "other";
}

export const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  error: "Error",
  warning: "Warning",
  info: "Info",
  other: "Other",
};
