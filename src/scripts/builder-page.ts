import { encode, decode, resolveUrl } from "../lib/codec";
import { getLang, t } from "../lib/i18n";
import { REPO_URL } from "../lib/defaults";
import type { DaySinceConfig, DaySinceEntry } from "../lib/types";

function el(tag: string, cls?: string, attrs?: Record<string, string>): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

const list = document.getElementById("entries-list")!;
const form = document.getElementById("builder-form") as HTMLFormElement;
const bulkText = document.getElementById("bulk-text") as HTMLTextAreaElement;
const bulkWrap = document.getElementById("bulk-wrap")!;
const titleInput = document.getElementById("f-title") as HTMLInputElement;
const previewTitle = document.getElementById("preview-title")!;
const titlePreview = document.getElementById("title-preview")!;

function updatePreview() {
  const val = titleInput.value.trim();
  previewTitle.textContent = val || "...";
  titlePreview.style.display = val ? "" : "none";
}
titleInput.addEventListener("input", updatePreview);
updatePreview();

const bgInput = document.getElementById("f-bg") as HTMLInputElement;
const accentInput = document.getElementById("f-accent") as HTMLInputElement;
const bgHex = document.getElementById("f-bg-hex")!;
const accentHex = document.getElementById("f-accent-hex")!;
bgInput.addEventListener("input", () => {
  bgHex.textContent = bgInput.value;
  clearActiveTheme();
});
accentInput.addEventListener("input", () => {
  accentHex.textContent = accentInput.value;
  clearActiveTheme();
});

const customColorsDiv = document.getElementById("custom-colors")!;
const themeBtns = document.querySelectorAll<HTMLButtonElement>(".theme-btn:not(.theme-custom)");
const customBtn = document.getElementById("theme-custom-btn")!;

function clearActiveTheme() {
  themeBtns.forEach((b) => b.classList.remove("active"));
  customBtn.classList.add("active");
  customColorsDiv.hidden = false;
}

themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    themeBtns.forEach((b) => b.classList.remove("active"));
    customBtn.classList.remove("active");
    btn.classList.add("active");
    customColorsDiv.hidden = true;
    const bg = btn.dataset.bg!;
    const accent = btn.dataset.accent!;
    bgInput.value = bg;
    accentInput.value = accent;
    bgHex.textContent = bg;
    accentHex.textContent = accent;
  });
});

customBtn.addEventListener("click", () => {
  clearActiveTheme();
  bgInput.focus();
});

document.getElementById("toggle-bulk")!.addEventListener("click", () => {
  const isHidden = bulkWrap.hidden;
  bulkWrap.hidden = !isHidden;
  if (isHidden) {
    bulkText.value = rowsToText();
    bulkText.focus();
  }
});

let syncing = false;

function rowsToText(): string {
  return [...list.querySelectorAll(".entry-row")]
    .map((row) => {
      const name = (row.querySelector(".e-name") as HTMLInputElement).value;
      const url = (row.querySelector(".e-url") as HTMLInputElement).value;
      const date = (row.querySelector(".e-date") as HTMLInputElement).value;
      if (!name && !url && !date) return "";
      if (date) return `${name}, ${url}, ${date}`;
      if (url) return `${name}, ${url}`;
      return name;
    })
    .filter(Boolean)
    .join("\n");
}

function syncToTextarea() {
  if (syncing) return;
  syncing = true;
  bulkText.value = rowsToText();
  syncing = false;
}

function syncToRows() {
  if (syncing) return;
  syncing = true;
  const lines = bulkText.value.split("\n");
  list.innerHTML = "";
  let hasContent = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(",").map((s) => s.trim());
    createEntryRow(parts[0] || "", parts[1] || "", parts[2] || "");
    hasContent = true;
  }
  if (!hasContent) createEntryRow();
  syncing = false;
}

function createEntryRow(name = "", url = "", date = "") {
  const lang = getLang();
  const row = document.createElement("div");
  row.className = "entry-row";
  row.innerHTML = `
    <input type="text" class="e-name" data-i18n-placeholder="namePlaceholder" required />
    <input type="text" class="e-url" data-i18n-placeholder="urlPlaceholder" />
    <input type="date" class="e-date" />
    <button type="button" class="btn-remove" title="Remove">&times;</button>
  `;
  const nameInput = row.querySelector(".e-name") as HTMLInputElement;
  const urlInput = row.querySelector(".e-url") as HTMLInputElement;
  const dateInput = row.querySelector(".e-date") as HTMLInputElement;
  nameInput.value = name;
  nameInput.placeholder = t(lang, "namePlaceholder");
  urlInput.value = url;
  urlInput.placeholder = t(lang, "urlPlaceholder");
  dateInput.value = date;
  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", syncToTextarea);
  });
  row.querySelector(".btn-remove")!.addEventListener("click", () => {
    if (list.querySelectorAll(".entry-row").length > 1) {
      row.remove();
      syncToTextarea();
    }
  });
  list.appendChild(row);
}

document.getElementById("add-entry")!.addEventListener("click", () => {
  createEntryRow();
  syncToTextarea();
});

let debounceTimer: ReturnType<typeof setTimeout>;
bulkText.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(syncToRows, 400);
});

const editHash = new URLSearchParams(window.location.search).get("edit");
const editConfig = editHash ? decode(editHash) : null;
if (editConfig) {
  titleInput.value = editConfig.title;
  updatePreview();
  if (editConfig.bg) {
    bgInput.value = editConfig.bg;
    bgHex.textContent = editConfig.bg;
  }
  if (editConfig.accent) {
    accentInput.value = editConfig.accent;
    accentHex.textContent = editConfig.accent;
  }
  for (const entry of editConfig.entries) {
    createEntryRow(entry.name, entry.url ?? "", entry.date ?? "");
  }
} else {
  createEntryRow();
}

syncToTextarea();

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const entries: DaySinceEntry[] = [...list.querySelectorAll(".entry-row")].map((row) => {
    const rawUrl = (row.querySelector(".e-url") as HTMLInputElement).value;
    const date = (row.querySelector(".e-date") as HTMLInputElement).value;
    return {
      name: (row.querySelector(".e-name") as HTMLInputElement).value,
      url: resolveUrl(rawUrl),
      date: date || undefined,
    };
  });

  if (entries.length === 0) return;

  const config: DaySinceConfig = {
    title: (document.getElementById("f-title") as HTMLInputElement).value,
    bg: bgInput.value,
    accent: accentInput.value,
    entries,
  };

  const hash = encode(config);
  const url = `${window.location.origin}/d#${hash}`;

  const resultDiv = document.getElementById("result")!;
  const resultUrl = document.getElementById("result-url") as HTMLInputElement;
  const openBtn = document.getElementById("open-btn") as HTMLAnchorElement;
  const permalinkBtn = document.getElementById("permalink-btn") as HTMLAnchorElement;

  resultUrl.value = url;
  openBtn.href = url;

  const issueTitle = `[counter] ${config.title}`;
  const entriesTable = config.entries
    .map((e) => `| ${e.name} | ${e.url ?? ""} | ${e.date ?? ""} |`)
    .join("\n");
  const issueBody = [
    `## ${config.title}`,
    "",
    `**Link:** [View counter](${url})`,
    "",
    `| Name | URL | Date |`,
    `|------|-----|------|`,
    entriesTable,
    "",
    "<details><summary>Raw config</summary>",
    "",
    "```json",
    JSON.stringify(config, null, 2),
    "```",
    "</details>",
  ].join("\n");

  permalinkBtn.href = `${REPO_URL}/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;

  resultDiv.hidden = false;
  resultDiv.classList.add("result-enter");
  resultUrl.select();
  resultDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

document.getElementById("copy-btn")!.addEventListener("click", () => {
  const lang = getLang();
  const input = document.getElementById("result-url") as HTMLInputElement;
  navigator.clipboard.writeText(input.value);
  const btn = document.getElementById("copy-btn")!;
  btn.textContent = t(lang, "copied");
  btn.classList.add("copied");
  setTimeout(() => {
    btn.textContent = t(lang, "copy");
    btn.classList.remove("copied");
  }, 2000);
});
