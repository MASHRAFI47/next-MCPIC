import crypto from "node:crypto";
import { getEnv } from "../env";

function deriveAesKey(): Buffer {
  const { mfaEncryptionKey } = getEnv();
  return crypto.createHash("sha256").update(mfaEncryptionKey).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = deriveAesKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted secret format");
  }
  const [ivB64, tagB64, dataB64] = parts;
  const key = deriveAesKey();
  const iv = Buffer.from(ivB64, "base64url");
  const authTag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomTokenHex(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
