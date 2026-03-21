import LZString from "lz-string";
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

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
