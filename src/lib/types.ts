export interface DaySinceEntry {
  name: string;
  url?: string;
  date: string; // ISO date string YYYY-MM-DD
}

export interface DaySinceConfig {
  title: string;
  entries: DaySinceEntry[];
  bg?: string;    // background color, default #f0f8ff
  accent?: string; // accent/timeline color, default #4444ff
}
