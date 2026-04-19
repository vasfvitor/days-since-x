import type { DaySinceConfig, DaySinceEntry } from "./types";
import type { Lang } from "./i18n";
import { DEFAULTS } from "./defaults";
import { daysSince, daysBetween } from "./codec";
import { formatDateLocale } from "./i18n";

export interface ViewEntry {
  name: string;
  url?: string;
  date?: string;
  dateFormatted?: string;
}

export interface DaySinceView {
  title: string;
  bg: string;
  accent: string;
  textColor: string;
  latest: ViewEntry | null;
  days: number;
  dayWord: "day" | "days";
  record: number;
  isRecord: boolean;
  timeline: ViewEntry[];
}

function isDark(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2) || c.substring(0, 1).repeat(2), 16);
  const g = parseInt(c.substring(2, 4) || c.substring(1, 2).repeat(2), 16);
  const b = parseInt(c.substring(4, 6) || c.substring(2, 3).repeat(2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export function prepareView(config: DaySinceConfig, lang: Lang): DaySinceView {
  const bg = config.bg ?? DEFAULTS.bg;
  const accent = config.accent ?? DEFAULTS.accent;

  const withDates = config.entries.filter((e) => e.date);
  const sorted = [...withDates].sort(
    (a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime(),
  );
  const latestRaw = sorted[0] ?? null;
  const days = latestRaw ? daysSince(latestRaw.date!) : 0;

  const latest: ViewEntry | null = latestRaw
    ? {
        name: latestRaw.name,
        url: latestRaw.url,
        date: latestRaw.date,
        dateFormatted: latestRaw.date ? formatDateLocale(latestRaw.date, lang) : undefined,
      }
    : null;

  const timeline: ViewEntry[] = [...config.entries]
    .sort((a, b) => {
      if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    })
    .map((e) => ({
      name: e.name,
      url: e.url,
      date: e.date,
      dateFormatted: e.date ? formatDateLocale(e.date, lang) : undefined,
    }));

  // Compute record: largest gap between consecutive dated entries
  let record = 0;
  if (sorted.length >= 2) {
    // sorted is newest-first, iterate to find max gap between consecutive dates
    const chronological = [...sorted].reverse(); // oldest-first
    for (let i = 1; i < chronological.length; i++) {
      const gap = daysBetween(chronological[i - 1].date!, chronological[i].date!);
      if (gap > record) record = gap;
    }
  }
  // Current streak (days since latest) also counts
  const isRecord = days > 0 && days >= record;
  if (days > record) record = days;

  const textColor = isDark(bg) ? "#f0f0f5" : "#1a1a2e";

  return { title: config.title, bg, accent, textColor, latest, days, dayWord: days === 1 ? "day" : "days", record, isRecord, timeline };
}
