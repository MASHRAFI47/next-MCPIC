import dns from "node:dns/promises";
import net from "node:net";

const DEFAULT_ALLOWED_OUTBOUND_HOSTS = new Set(["api.imgbb.com"]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local & cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // multicast & reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("::ffff:")) {
    const mapped = lower.slice(7);
    if (net.isIP(mapped) === 4) return isPrivateIPv4(mapped);
  }
  return false;
}

function isBlockedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateIPv4(ip);
  if (family === 6) return isPrivateIPv6(ip);
  return true;
}

/**
 * Prevents Server-Side Request Forgery (SSRF) by enforcing HTTPS,
 * strict hostname allowlisting, and DNS resolution checks against private/metadata IPs.
 */
export async function assertSafeOutboundUrl(
  rawUrl: string,
  allowedHosts: Set<string> = DEFAULT_ALLOWED_OUTBOUND_HOSTS
): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid outbound URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Outbound requests must use HTTPS");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Credentials in outbound URLs are forbidden");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!allowedHosts.has(hostname)) {
    throw new Error(`Outbound host "${hostname}" is not in the allowlist`);
  }

  if (net.isIP(hostname) !== 0 && isBlockedIp(hostname)) {
    throw new Error("Direct private IP access is blocked");
  }

  const records = await dns.lookup(hostname, { all: true });
  if (records.length === 0) {
    throw new Error("Could not resolve outbound host");
  }

  for (const record of records) {
    if (isBlockedIp(record.address)) {
      throw new Error("Resolved IP address is in a blocked private or metadata range");
    }
  }

  return parsed;
}
