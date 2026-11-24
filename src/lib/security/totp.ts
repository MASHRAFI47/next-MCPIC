import crypto from "node:crypto";
import { sha256Hex, timingSafeEqualStr } from "./crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function buildOtpAuthUri(email: string, secret: string, issuer = "MCPIC"): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

function generateHotp(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const counterBuf = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  counterBuf.writeUInt32BE(high, 0);
  counterBuf.writeUInt32BE(low, 4);

  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, "0");
}

/**
 * Verifies a 6-digit RFC 6238 TOTP code allowing +/- 1 time step (30s drift).
 */
export function verifyTotpCode(secretBase32: string, code: string, window = 1): boolean {
  const normalized = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  for (let delta = -window; delta <= window; delta++) {
    const candidate = generateHotp(secretBase32, currentStep + delta);
    if (timingSafeEqualStr(candidate, normalized)) {
      return true;
    }
  }
  return false;
}

export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return codes;
}

export function hashRecoveryCode(code: string): string {
  return sha256Hex(code.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""));
}

export function matchRecoveryCode(code: string, hashes: string[]): number {
  const target = hashRecoveryCode(code);
  for (let i = 0; i < hashes.length; i++) {
    if (timingSafeEqualStr(hashes[i], target)) {
      return i;
    }
  }
  return -1;
}
