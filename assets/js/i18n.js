// Lightweight RU/EN switcher. Russian text is the default markup already in
// the HTML; elements that should translate carry `data-en="English text"`
// (and inputs/textarea use `data-en-placeholder`). Switching language swaps
// textContent/placeholder in place — no page reload, no flash on first load
// since Russian is already what's rendered by default.
(function () {
  const STORAGE_KEY = "lang";

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || "ru";
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-en]").forEach((el) => {
      if (el.dataset.ru === undefined) el.dataset.ru = el.textContent;
      el.textContent = lang === "en" ? el.dataset.en : el.dataset.ru;
    });

    document.querySelectorAll("[data-en-placeholder]").forEach((el) => {
      if (el.dataset.ruPlaceholder === undefined) el.dataset.ruPlaceholder = el.placeholder;
      el.placeholder = lang === "en" ? el.dataset.enPlaceholder : el.dataset.ruPlaceholder;
    });

    document.querySelectorAll("[data-en-aria-label]").forEach((el) => {
      if (el.dataset.ruAriaLabel === undefined) el.dataset.ruAriaLabel = el.getAttribute("aria-label");
      el.setAttribute("aria-label", lang === "en" ? el.dataset.enAriaLabel : el.dataset.ruAriaLabel);
    });

    document.querySelectorAll(".lang-switch button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    window.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyLang(lang);
  }

  window.i18n = { getLang, setLang, applyLang };

  document.addEventListener("DOMContentLoaded", () => {
    applyLang(getLang());
    document.querySelectorAll(".lang-switch button").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });
  });
})();
