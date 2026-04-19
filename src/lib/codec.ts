import * as LZString from "lz-string";
import type { DaySinceConfig } from "./types";
import { sanitizeConfig } from "./sanitize";

export function encode(config: DaySinceConfig): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(config));
}

export function decode(hash: string): DaySinceConfig | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash);
    if (!json || json.length > 50_000) return null;
    return sanitizeConfig(JSON.parse(json));
  } catch {
    return null;
  }
}

function toUtcDay(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(fromDateStr: string, toDateStr: string): number {
  return Math.floor((toUtcDay(toDateStr) - toUtcDay(fromDateStr)) / 86_400_000);
}

export function daysSince(dateStr: string): number {
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((todayUtc - toUtcDay(dateStr)) / 86_400_000);
}

/** Resolve a URL-like input: full URL kept as-is, "user/repo" → GitHub link */
export function resolveUrl(input: string): string | undefined {
  const v = input.trim();
  if (!v) return undefined;
  if (v.startsWith("https://") || v.startsWith("http://")) {
    try { new URL(v); return v; } catch { return undefined; }
  }
  if (/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(v)) {
    return `https://github.com/${v}`;
  }
  return undefined;
}
