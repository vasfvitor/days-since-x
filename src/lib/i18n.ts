import { DEFAULTS } from "./defaults";

export const translations = {
  "pt-BR": {
    itHasBeen: "Faz",
    days: "dias",
    day: "dia",
    sinceTheLast: "desde o último",
    mostRecent: "Mais recente",
    timeline: "Linha do tempo",
    createYourOwn: "Crie o seu",
    edit: "Editar",
    builder: "Construtor",
    builderSubtitle: 'Crie um contador "dias desde" compartilhável. Preencha o formulário e pegue seu link.',
    examples: "Exemplos",
    titleLabel: "Título (o que estamos contando?)",
    titlePlaceholder: "novo servidor de Minecraft feito em Rust",
    background: "Fundo",
    accent: "Destaque",
    entriesLegend: "Entradas (pelo menos uma)",
    addEntry: "+ Adicionar entrada",
    generateLink: "Gerar link",
    yourLink: "Seu link",
    copy: "Copiar",
    copied: "Copiado!",
    open: "Abrir",
    loading: "Carregando\u2026",
    noData: "Nenhum dado na URL.",
    goToBuilder: "Ir ao construtor",
    couldNotDecode: "Não foi possível decodificar os dados da URL.",
    namePlaceholder: "Nome",
    urlPlaceholder: "URL ou user/repo",
    datePlaceholder: "Data (opcional)",
    importHelp: "Uma entrada por linha: nome, url, data",
    theme: "Tema",
    custom: "Personalizado",
    record: "Nosso recorde é de",
    newRecord: "Novo recorde!",
    createPermalink: "Criar permalink",
    editOnGithub: "Editar no GitHub",
  },
  en: {
    itHasBeen: "It has been",
    days: "days",
    day: "day",
    sinceTheLast: "since the last",
    mostRecent: "Most recent",
    timeline: "Timeline",
    createYourOwn: "Create your own",
    edit: "Edit",
    builder: "Builder",
    builderSubtitle: 'Create a shareable "days since" counter. Fill in the form and grab your link.',
    examples: "Examples",
    titleLabel: "Title (what are we counting?)",
    titlePlaceholder: "new Rust MC server releases",
    background: "Background",
    accent: "Accent",
    entriesLegend: "Entries (at least one)",
    addEntry: "+ Add entry",
    generateLink: "Generate link",
    yourLink: "Your link",
    copy: "Copy",
    copied: "Copied!",
    open: "Open",
    loading: "Loading\u2026",
    noData: "No data in URL.",
    goToBuilder: "Go to builder",
    couldNotDecode: "Could not decode URL data.",
    namePlaceholder: "Name",
    urlPlaceholder: "URL or user/repo",
    datePlaceholder: "Date (optional)",
    importHelp: "One entry per line: name, url, date",
    theme: "Theme",
    custom: "Custom",
    record: "Our record is",
    newRecord: "New record!",
    createPermalink: "Create permalink",
    editOnGithub: "Edit on GitHub",
  },
} as const;

export type Lang = keyof typeof translations;
export type TKey = keyof (typeof translations)["en"];

export function t(lang: Lang, key: TKey): string {
  return translations[lang][key];
}

export function getLang(): Lang {
  if (typeof window === "undefined") return DEFAULTS.lang;
  return (localStorage.getItem("ds-lang") as Lang) || DEFAULTS.lang;
}

export function setLang(lang: Lang) {
  localStorage.setItem("ds-lang", lang);
}

/** Apply translations to all elements with data-i18n on the page */
export function applyI18n(lang: Lang) {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as TKey;
    if (translations[lang][key] != null) {
      el.textContent = translations[lang][key];
    }
  });
  document.querySelectorAll<HTMLInputElement>("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder as TKey;
    if (translations[lang][key] != null) {
      el.placeholder = translations[lang][key];
    }
  });
}

export function formatDateLocale(dateStr: string, lang: Lang): string {
  const locale = lang === "pt-BR" ? "pt-BR" : "en-US";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
