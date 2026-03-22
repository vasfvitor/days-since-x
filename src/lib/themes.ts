export interface Theme {
  name: string;
  nameEn: string;
  bg: string;
  accent: string;
}

export const THEMES: Theme[] = [
  { name: "Padrão",    nameEn: "Default",    bg: "#f0f8ff", accent: "#4444ff" },
  { name: "Oceano",    nameEn: "Ocean",      bg: "#f0f7f4", accent: "#0e8a6d" },
  { name: "Pôr do sol", nameEn: "Sunset",    bg: "#fff5f0", accent: "#e05a33" },
  { name: "Noturno",   nameEn: "Midnight",   bg: "#111117", accent: "#7b8cff" },
  { name: "Roxo",      nameEn: "Grape",      bg: "#f8f0ff", accent: "#8b3ec7" },
  { name: "Monocromático", nameEn: "Mono",   bg: "#f5f5f5", accent: "#222222" },
];
