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

    // The switch is a pair of toggle buttons, so the active one is reported as
    // pressed — the `active` class alone is invisible to screen readers. On the
    // /en/ pages the switch is made of links instead (they navigate to another
    // URL), where aria-current is the right equivalent.
    document.querySelectorAll(".lang-switch button").forEach((btn) => {
      const on = btn.dataset.lang === lang;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    document.querySelectorAll(".lang-switch a[data-lang]").forEach((link) => {
      if (link.dataset.lang === lang) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
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
    // On pages where the language switch navigates to a separate URL (the /en/
    // pages use <a> links, not in-place buttons), persist the chosen language
    // before the browser follows the link. Without this, clicking "RU" from an
    // /en/ page lands on the Russian URL but localStorage still says "en", so
    // i18n re-renders it in English — the switch appears broken.
    document.querySelectorAll(".lang-switch a[data-lang]").forEach((link) => {
      link.addEventListener("click", () => {
        try {
          localStorage.setItem(STORAGE_KEY, link.dataset.lang);
        } catch (e) {}
      });
    });
  });
})();
