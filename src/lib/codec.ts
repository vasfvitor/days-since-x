import * as LZString from "lz-string";
import type { DaySinceConfig } from "./types";

export function encode(config: DaySinceConfig): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(config));
}

export function decode(hash: string): DaySinceConfig | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash);
    if (!json) return null;
    return JSON.parse(json) as DaySinceConfig;
  } catch {
    return null;
  }
}

export function daysSince(dateStr: string): number {
  const then = new Date(dateStr + "T00:00:00");
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000);
}

/** Resolve a URL-like input: full URL kept as-is, "user/repo" → GitHub link */
export function resolveUrl(input: string): string | undefined {
  const v = input.trim();
  if (!v) return undefined;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.includes("/")) return `https://github.com/${v}`;
  return undefined;
}
