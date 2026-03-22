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
      if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
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

  return { title: config.title, bg, accent, latest, days, dayWord: days === 1 ? "day" : "days", timeline };
}
