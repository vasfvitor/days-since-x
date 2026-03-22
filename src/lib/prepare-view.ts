import type { DaySinceConfig, DaySinceEntry } from "./types";
import type { Lang } from "./i18n";
import { DEFAULTS } from "./defaults";
import { daysSince } from "./codec";
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
  latest: ViewEntry | null;
  days: number;
  dayWord: "day" | "days";
  record: number;
  isRecord: boolean;
  timeline: ViewEntry[];
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
      const prev = new Date(chronological[i - 1].date!).getTime();
      const curr = new Date(chronological[i].date!).getTime();
      const gap = Math.floor((curr - prev) / 86_400_000);
      if (gap > record) record = gap;
    }
  }
  // Current streak (days since latest) also counts
  const isRecord = days > 0 && days >= record;
  if (days > record) record = days;

  return { title: config.title, bg, accent, latest, days, dayWord: days === 1 ? "day" : "days", record, isRecord, timeline };
}
