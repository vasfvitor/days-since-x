import { applyI18n, getLang, setLang, type Lang } from "../lib/i18n";

function initLangToggle() {
  const switches = document.querySelectorAll<HTMLElement>(".lang-switch");
  let lang = getLang();

  function update() {
    document.documentElement.lang = lang === "pt-BR" ? "pt-BR" : "en";
    switches.forEach((sw) => {
      sw.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.lang === lang);
      });
    });
    applyI18n(lang);
    window.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }

  update();

  switches.forEach((sw) => {
    sw.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("button");
      if (!btn?.dataset.lang) return;
      lang = btn.dataset.lang as Lang;
      setLang(lang);
      update();
    });
  });
}

initLangToggle();
