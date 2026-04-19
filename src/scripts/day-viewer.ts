import { daysBetween, daysSince } from "../lib/codec";
import { formatDateLocale, getLang, t } from "../lib/i18n";

function updateDates() {
  const lang = getLang();
  document.querySelectorAll<HTMLTimeElement>("time[data-date]").forEach((el) => {
    el.textContent = formatDateLocale(el.dataset.date!, lang);
  });
}

function countUp() {
  const el = document.querySelector<HTMLSpanElement>(".ds-count");
  if (!el?.dataset.target) return;
  const target = parseInt(el.dataset.target, 10);
  if (isNaN(target) || target <= 0) {
    el.textContent = String(target);
    return;
  }
  const duration = Math.min(1200, 300 + target * 3);
  const start = performance.now();
  function tick(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(eased * target));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function updateDayUnit(days: number) {
  const lang = getLang();
  const daysEl = document.querySelector<HTMLSpanElement>(".ds-days");
  if (!daysEl) return;
  const key = days === 1 ? "day" : "days";
  daysEl.dataset.i18n = key;
  daysEl.textContent = t(lang, key);
}

function updateCounter() {
  const el = document.querySelector<HTMLSpanElement>(".ds-count");
  if (!el?.dataset.date) return;
  const days = daysSince(el.dataset.date);
  el.textContent = String(days);
  el.dataset.target = String(days);
  updateDayUnit(days);
}

function updateRecord() {
  const recordEl = document.querySelector<HTMLParagraphElement>(".ds-record");
  if (!recordEl) return;
  const lang = getLang();

  const times = document.querySelectorAll<HTMLTimeElement>(".ds-timeline time[data-date]");
  const dates = Array.from(times)
    .map((el) => el.dataset.date)
    .filter((d): d is string => !!d);
  if (dates.length < 2) return;

  const sorted = [...dates].sort();
  let gapRecord = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1], sorted[i]);
    if (gap > gapRecord) gapRecord = gap;
  }

  const days = daysSince(sorted[sorted.length - 1]);
  const record = Math.max(gapRecord, days);
  const isRecord = days > 0 && days >= gapRecord;

  recordEl.classList.toggle("ds-record-new", isRecord);
  recordEl.textContent = "";
  if (isRecord) {
    const s = document.createElement("span");
    s.dataset.i18n = "newRecord";
    s.textContent = t(lang, "newRecord");
    recordEl.appendChild(s);
  } else {
    const s = document.createElement("span");
    s.dataset.i18n = "record";
    s.textContent = t(lang, "record");
    recordEl.appendChild(s);
    recordEl.appendChild(
      document.createTextNode(` ${record} ${t(lang, record === 1 ? "day" : "days")}`),
    );
  }
}

function refresh() {
  updateCounter();
  updateRecord();
}

updateDates();
refresh();
countUp();
setInterval(refresh, 60_000);
window.addEventListener("langchange", () => {
  updateDates();
  refresh();
});
