/**
 * Sanitizes plain-text inputs to remove null bytes, dangerous control chars,
 * and raw HTML script/event-handler tags (defense-in-depth alongside React escaping + CSP).
 */
export function sanitizeText(input: string, maxLength = 5000): string {
  return input
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<\/?(?:iframe|object|embed|style|link|meta|base)[^>]*>/gi, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates that an image URL is either a trusted local path or an HTTPS URL
 * from an approved image host (blocks javascript:, data:text/html, etc.).
 */
export function isSafeImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Local static images or server-validated uploads
  if (trimmed.startsWith("/images/") || trimmed.startsWith("/api/uploads/") || trimmed === "/mcpic-logo.png") {
    return !trimmed.includes("..") && !trimmed.includes("\\");
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return host === "i.ibb.co" || host === "i.ibb.co.com";
  } catch {
    return false;
  }
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "event";
}

export type AllowedImageMime = "image/jpeg" | "image/png" | "image/webp";

export interface DetectedImage {
  mime: AllowedImageMime;
  ext: "jpg" | "png" | "webp";
}

/**
 * Inspects file magic bytes to verify the upload is genuinely JPEG, PNG, or WebP
 * (prevents spoofed MIME types, SVG/HTML XSS payloads, and polyglots).
 */
export function detectImageMagicBytes(buffer: Buffer): DetectedImage | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}
