import type { DaySinceConfig, DaySinceEntry } from "./types";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_URL = /^https?:\/\//;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g;

function sanitizeColor(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return HEX_COLOR.test(value.trim()) ? value.trim() : undefined;
}

function sanitizeDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!ISO_DATE.test(trimmed)) return undefined;
  const d = new Date(trimmed + "T00:00:00");
  if (isNaN(d.getTime())) return undefined;
  // Round-trip: reject dates that JS auto-corrects (e.g., Feb 31 → Mar 2)
  const [y, m, day] = trimmed.split("-").map(Number);
  if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) return undefined;
  return trimmed;
}

function sanitizeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!SAFE_URL.test(trimmed)) return undefined;
  // Reject embedded credentials (user:pass@host)
  if (/@/.test(trimmed.replace(/^https?:\/\//, "").split("/")[0])) return undefined;
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    return undefined;
  }
}

function sanitizeText(value: unknown, maxLength = 200): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL_CHARS, "").slice(0, maxLength).trim();
}

function sanitizeEntry(raw: unknown): DaySinceEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const name = sanitizeText(e.name, 100);
  if (!name) return null;
  return {
    name,
    url: sanitizeUrl(e.url as string | undefined),
    date: sanitizeDate(e.date as string | undefined),
  };
}

export function sanitizeConfig(raw: unknown): DaySinceConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const title = sanitizeText(obj.title, 200);
  if (!title) return null;

  if (!Array.isArray(obj.entries) || obj.entries.length === 0) return null;

  const entries = obj.entries
    .slice(0, 100)
    .map(sanitizeEntry)
    .filter((e): e is DaySinceEntry => e !== null);

  if (entries.length === 0) return null;

  return {
    title,
    entries,
    bg: sanitizeColor(obj.bg as string | undefined),
    accent: sanitizeColor(obj.accent as string | undefined),
  };
}
