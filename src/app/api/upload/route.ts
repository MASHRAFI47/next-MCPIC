import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { detectImageMagicBytes } from "@/lib/security/sanitize";
import { assertSafeOutboundUrl } from "@/lib/security/ssrf";

const MAX_AUTH_BYTES = 5 * 1024 * 1024; // 5 MB for signed-in users
const MAX_ANON_BYTES = 2 * 1024 * 1024; // 2 MB for registration avatar upload
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    auth: "none",
    rateLimit: "upload",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  const session = await getServerSession(authOptions);
  const maxBytes = session?.user?.id ? MAX_AUTH_BYTES : MAX_ANON_BYTES;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonResponse(req, { error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonResponse(req, { error: "No image file provided" }, { status: 400 });
  }

  if (file.size === 0) {
    return jsonResponse(req, { error: "Uploaded file is empty" }, { status: 400 });
  }

  if (file.size > maxBytes) {
    return jsonResponse(
      req,
      { error: `File exceeds maximum allowed size (${Math.round(maxBytes / (1024 * 1024))} MB).` },
      { status: 413 }
    );
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return jsonResponse(
      req,
      { error: "Only JPEG, PNG, and WebP images are allowed." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Magic-byte inspection (never trust client filename or MIME header alone)
  const detected = detectImageMagicBytes(buffer);
  if (!detected) {
    return jsonResponse(
      req,
      { error: "File content is not a valid JPEG, PNG, or WebP image." },
      { status: 400 }
    );
  }

  const safeFilename = `${crypto.randomUUID()}.${detected.ext}`;
  const { imgbbApiKey } = getEnv();

  // Option A: Server-side ImgBB upload (key never exposed to client, SSRF-protected)
  if (imgbbApiKey) {
    try {
      const targetUrl = await assertSafeOutboundUrl(
        `https://api.imgbb.com/1/upload?key=${encodeURIComponent(imgbbApiKey)}`,
        new Set(["api.imgbb.com"])
      );

      const outboundForm = new FormData();
      outboundForm.append("image", buffer.toString("base64"));
      outboundForm.append("name", safeFilename);

      const upstream = await fetch(targetUrl.toString(), {
        method: "POST",
        body: outboundForm,
        signal: AbortSignal.timeout(15_000),
      });

      if (!upstream.ok) {
        logger.error("ImgBB upload returned non-OK status", { status: upstream.status });
        return jsonResponse(req, { error: "Image upload provider failed" }, { status: 502 });
      }

      const payload = (await upstream.json()) as {
        data?: { display_url?: string };
      };
      const url = payload?.data?.display_url;
      if (!url || !url.startsWith("https://")) {
        return jsonResponse(req, { error: "Unexpected response from image provider" }, { status: 502 });
      }

      return jsonResponse(req, { url, mime: detected.mime }, { status: 201 });
    } catch (err) {
      logger.error("Server-side ImgBB upload error", { error: err });
      return jsonResponse(req, { error: "Image upload failed" }, { status: 502 });
    }
  }

  // Option B: Safe local disk storage outside public/, served via /api/uploads/[filename]
  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const fullPath = path.join(uploadsDir, safeFilename);
    await fs.writeFile(fullPath, buffer, { flag: "wx" });

    return jsonResponse(
      req,
      { url: `/api/uploads/${safeFilename}`, mime: detected.mime },
      { status: 201 }
    );
  } catch (err) {
    logger.error("Local image upload failed", { error: err });
    return jsonResponse(req, { error: "Failed to store uploaded image" }, { status: 500 });
  }
}
